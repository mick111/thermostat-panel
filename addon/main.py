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


OPTIONS = _load_options()
HA_URL = "http://supervisor/core"
TOKEN = (os.environ.get("SUPERVISOR_TOKEN") or "").strip()

if TOKEN:
    logger.info("Utilisation du token Supervisor pour l'API Core.")
else:
    logger.warning(
        "SUPERVISOR_TOKEN non fourni. Vérifiez homeassistant_api/hassio_api "
        "et le démarrage via /usr/bin/with-contenv."
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
    """Renvoie la réponse HA, avec message explicite en cas de 401."""
    if r.status_code == 401:
        return JSONResponse(
            status_code=401,
            content={
                "message": "Authentification Supervisor refusée par Home Assistant. Vérifiez que SUPERVISOR_TOKEN est bien injecté (homeassistant_api/hassio_api + with-contenv), puis redémarrez l'add-on.",
            },
        )
    return Response(
        content=r.content,
        status_code=r.status_code,
        headers={"Content-Type": "application/json"},
    )


# Message lorsque le proxy Supervisor/Core est injoignable
_MSG_HA_UNREACHABLE = (
    "Impossible de joindre Home Assistant via le proxy Supervisor "
    "(http://supervisor/core). Vérifiez que Supervisor est actif et que "
    "l'add-on démarre bien avec /usr/bin/with-contenv."
)


async def _ha_request(method: str, url: str, **kwargs) -> Response:
    """Effectue une requête vers HA et gère les erreurs réseau (502 + message clair)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if method == "GET":
                r = await client.get(url, **kwargs)
            else:
                r = await client.request(method, url, **kwargs)
        return _ha_response(r)
    except (httpx.RemoteProtocolError, httpx.ConnectError, httpx.ConnectTimeout) as e:
        logger.warning("Connexion HA échouée (%s): %s", url, e)
        return JSONResponse(
            status_code=502,
            content={"message": _MSG_HA_UNREACHABLE, "detail": str(e)},
        )


@app.get("/api/states/{entity_id:path}")
async def get_state(entity_id: str):
    if not TOKEN:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Authentification HA manquante : SUPERVISOR_TOKEN absent. Vérifiez la configuration de l'add-on (homeassistant_api/hassio_api) et redémarrez.",
            },
        )
    url = f"{HA_URL}/api/states/{entity_id}"
    return await _ha_request(
        "GET",
        url,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )


@app.post("/api/services/climate/set_temperature")
async def set_temperature(request: Request):
    if not TOKEN:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Authentification HA manquante : SUPERVISOR_TOKEN absent. Vérifiez la configuration de l'add-on (homeassistant_api/hassio_api) et redémarrez.",
            },
        )
    body = await request.body()
    url = f"{HA_URL}/api/services/climate/set_temperature"
    return await _ha_request(
        "POST",
        url,
        content=body,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )


@app.post("/api/services/climate/set_preset_mode")
async def set_preset_mode(request: Request):
    if not TOKEN:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Authentification HA manquante : SUPERVISOR_TOKEN absent. Vérifiez la configuration de l'add-on (homeassistant_api/hassio_api) et redémarrez.",
            },
        )
    body = await request.body()
    url = f"{HA_URL}/api/services/climate/set_preset_mode"
    return await _ha_request(
        "POST",
        url,
        content=body,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )


# Panel intégré : fichiers statiques (après les routes /api et /config.js)
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"service": "Thermostat Panel API", "status": "ok"}
