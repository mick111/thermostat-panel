# Home Assistant thermostat panel (iPad kiosk)

Minimal web app to control a Home Assistant thermostat from an iPad in kiosk mode (wall mount). Compatible with **iOS 9.3** (XMLHttpRequest only, no fetch).

The panel calls a **backend API** (add-on Thermostat Panel API) which proxies requests to Home Assistant. The token stays on the server; only clients on allowed local IPs can use the API. See **SECURITE.md**.

## Files

- **addon/** — Home Assistant add-on (FastAPI) : proxy vers HA, restriction par IP, et **service du panel** (ouvrir l’URL de l’add-on pour l’utiliser).
  - **addon/static/** — Fichiers du panel (index.html, app.js, styles.css, apple-touch-icon.png). Modifier ici pour faire évoluer le panel.
- **VERROUILLAGE.md** — Verrouillage iPad (Accès guidé).

## Configuration

1. **Installer et configurer l’add-on** (Thermostat Panel API).
2. Dans les options de l’add-on : `ha_url`, `token`, `allowed_networks`, et les options du panel (`thermostat_entity_id`, `guest_entity_id`, etc.).
3. Démarrer l’add-on, puis ouvrir **http://IP_HA:8765/** (ou le port configuré) depuis un appareil du réseau local. Le panel est servi par l’add-on.

## iPad lock-down

To restrict the iPad to this panel only: **Guided Access** (Settings → Accessibility). Details in **VERROUILLAGE.md**.

## Home Assistant requirements

- **Thermostat Panel API add-on** installed and running (token and allowed_networks configured).
- **climate** entity for the thermostat.
- Long-Lived Access Token (stored in the add-on, not in the browser) with permission to read states and call climate services.

## Mode « Auto »

Si le thermostat utilise `heat_cool` au lieu de `auto`, modifier le bouton Auto dans **addon/static/app.js** : remplacer `setHVACMode("auto")` par `setHVACMode("heat_cool")`.
