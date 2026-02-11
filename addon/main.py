"""
Thermostat Panel API — Proxy FastAPI vers Home Assistant + service du panel.
Restriction aux IP locales (allowed_networks). Token HA côté serveur uniquement.
"""
import json
import os
import logging
from pathlib import Path
from ipaddress import ip_address, ip_network

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Thermostat Panel API")

# CORS (utile si le panel est servi depuis une autre origine ; en intégré, même origine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Options : d'abord /data/options.json (add-on HA), sinon variables d'environnement
def _load_options():
    opts = {}
    path = Path("/data/options.json")
    if path.exists():
        try:
            opts = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Could not read /data/options.json: %s", e)
    # Complément / override par l'env
    opts.setdefault("ha_url", os.environ.get("HA_URL", "auto"))
    opts.setdefault("token", os.environ.get("TOKEN", ""))
    opts.setdefault("port", int(os.environ.get("PORT", "8765")))
    allowed = opts.get("allowed_networks")
    if not allowed and os.environ.get("ALLOWED_NETWORKS"):
        try:
            allowed = json.loads(os.environ["ALLOWED_NETWORKS"])
        except Exception:
            allowed = None
    if not allowed:
        allowed = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8"]
    opts["allowed_networks"] = allowed
    return opts


def _detect_ha_url(token: str) -> str:
    """Détecte automatiquement l'URL de l'API Home Assistant."""
    candidates = [
        "http://supervisor/core",   # Add-on installé via Supervisor (HA OS / Supervised)
        "http://localhost:8123",   # Core en local (sans Supervisor)
    ]
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    for base in candidates:
        try:
            with httpx.Client(timeout=2.0) as client:
                r = client.get(f"{base}/api/", headers=headers)
                # 200 OK ou 401 Unauthorized = l'API répond
                if r.status_code in (200, 401):
                    logger.info("HA URL auto-détectée : %s", base)
                    return base
        except Exception as e:
            logger.debug("Tentative %s : %s", base, e)
    # Par défaut Supervisor (cas add-on standard)
    logger.warning("Auto-détection impossible, utilisation de http://supervisor/core")
    return "http://supervisor/core"


OPTIONS = _load_options()
_ha_url_raw = str(OPTIONS.get("ha_url", "auto")).strip().rstrip("/")
if not _ha_url_raw or _ha_url_raw.lower() == "auto":
    HA_URL = _detect_ha_url(OPTIONS.get("token") or "")
else:
    HA_URL = _ha_url_raw
HA_URL = HA_URL.rstrip("/")
# Via supervisor/core : le Supervisor injecte normalement SUPERVISOR_TOKEN. S'il est absent (ex. add-on
# depuis un dépôt personnalisé), on utilise le token des options (Long-Lived Access Token).
# Avec localhost:8123, seul le token des options est utilisé.
if "supervisor/core" in HA_URL:
    TOKEN = (os.environ.get("SUPERVISOR_TOKEN") or "").strip()
    if not TOKEN:
        TOKEN = str(OPTIONS.get("token", "")).strip()
        if TOKEN:
            logger.info("Utilisation du token des options (SUPERVISOR_TOKEN non fourni par le Supervisor).")
    else:
        logger.info("Utilisation du token Supervisor pour l'API Core.")
else:
    TOKEN = str(OPTIONS.get("token", "")).strip()

if not TOKEN and "supervisor/core" in HA_URL:
    logger.warning(
        "SUPERVISOR_TOKEN non fourni et option « token » vide. "
        "Renseignez un Long-Lived Access Token dans la configuration de l'add-on (Profil HA → Créer un jeton)."
    )
try:
    ALLOWED_NETWORKS = [
        ip_network(cidr.strip()) for cidr in OPTIONS.get("allowed_networks", [])
    ]
except (TypeError, ValueError) as e:
    logger.warning("Invalid allowed_networks, using defaults: %s", e)
    ALLOWED_NETWORKS = [
        ip_network("10.0.0.0/8"),
        ip_network("172.16.0.0/12"),
        ip_network("192.168.0.0/16"),
        ip_network("127.0.0.0/8"),
    ]


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return ""


def is_ip_allowed(ip_str: str) -> bool:
    if not ip_str:
        return False
    try:
        addr = ip_address(ip_str)
    except ValueError:
        return False
    return any(addr in net for net in ALLOWED_NETWORKS)


@app.middleware("http")
async def restrict_ip_middleware(request: Request, call_next):
    ip = client_ip(request)
    if not is_ip_allowed(ip):
        logger.warning("Rejected request from non-allowed IP: %s", ip)
        return JSONResponse(
            status_code=403,
            content={"message": "Accès refusé. Connexion réservée au réseau local."},
        )
    return await call_next(request)


def _get_panel_config():
    o = _load_options()
    return {
        "baseUrl": "auto",
        "thermostatEntityId": o.get("thermostat_entity_id", "climate.thermostat"),
        "guestEntityId": o.get("guest_entity_id", "sensor.guest_name"),
        "guestCountEntityId": o.get("guest_count_entity_id", "sensor.guest_count"),
        "guestDatesEntityId": o.get("guest_dates_entity_id", "sensor.guest_dates"),
        "stepDegrees": float(o.get("step_degrees", 0.5)),
        "refreshInterval": int(o.get("refresh_interval", 10000)),
    }


@app.get("/config.js")
async def config_js():
    """Configuration du panel (même format que config.js), générée depuis les options de l'add-on."""
    config = _get_panel_config()
    body = "var CONFIG = " + json.dumps(config, ensure_ascii=False) + ";"
    return Response(content=body, media_type="application/javascript")


def _ha_response(r: httpx.Response) -> Response:
    """Renvoie la réponse HA, avec message explicite en cas de 401 (token invalide)."""
    if r.status_code == 401:
        return JSONResponse(
            status_code=401,
            content={
                "message": "Token Home Assistant invalide ou expiré. Vérifiez l'option « token » dans la configuration de l'add-on (Profil HA → Créer un jeton).",
            },
        )
    return Response(
        content=r.content,
        status_code=r.status_code,
        headers={"Content-Type": "application/json"},
    )


@app.get("/api/states/{entity_id:path}")
async def get_state(entity_id: str):
    if not TOKEN:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Authentification HA manquante. Renseignez l'option « token » dans la configuration de l'add-on avec un Long-Lived Access Token (Profil HA → Créer un jeton), puis redémarrez l'add-on.",
            },
        )
    url = f"{HA_URL}/api/states/{entity_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {TOKEN}",
                "Content-Type": "application/json",
            },
        )
    return _ha_response(r)


@app.post("/api/services/climate/set_temperature")
async def set_temperature(request: Request):
    if not TOKEN:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Authentification HA manquante. Avec supervisor/core laissez « token » vide. Avec localhost:8123 renseignez un Long-Lived Access Token.",
            },
        )
    body = await request.body()
    url = f"{HA_URL}/api/services/climate/set_temperature"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            url,
            content=body,
            headers={
                "Authorization": f"Bearer {TOKEN}",
                "Content-Type": "application/json",
            },
        )
    return _ha_response(r)


@app.post("/api/services/climate/set_preset_mode")
async def set_preset_mode(request: Request):
    if not TOKEN:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Authentification HA manquante. Avec supervisor/core laissez « token » vide. Avec localhost:8123 renseignez un Long-Lived Access Token.",
            },
        )
    body = await request.body()
    url = f"{HA_URL}/api/services/climate/set_preset_mode"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            url,
            content=body,
            headers={
                "Authorization": f"Bearer {TOKEN}",
                "Content-Type": "application/json",
            },
        )
    return _ha_response(r)


# Panel intégré : fichiers statiques (après les routes /api et /config.js)
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"service": "Thermostat Panel API", "status": "ok"}
