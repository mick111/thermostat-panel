# Home Assistant thermostat panel (iPad kiosk)

Minimal web app to control a Home Assistant thermostat from an iPad in kiosk mode (wall mount). Compatible with **iOS 9.3** (XMLHttpRequest only, no fetch).

## Files

- **index.html** — Main page (temperature, setpoint, mode, buttons)
- **styles.css** — Full-screen, touch-friendly layout
- **app.js** — Home Assistant API calls (state read, set_temperature, set_hvac_mode)
- **config.js** — Edit this: HA URL, token, thermostat entity_id (token is visible client-side; see **SECURITE.md**)
- **VERROUILLAGE.md** — How to lock the iPad (Guided Access + settings)

## Configuration

1. Edit **config.js**:
   - `baseUrl`: Home Assistant URL (e.g. `https://homeassistant.local:8123`)
   - `token`: Long-Lived Access Token (Profile → Create token)
   - `thermostatEntityId`: e.g. `climate.living_room`, `climate.thermostat`
2. Serve the files over HTTPS (required for the API from a web page). Options:
   - Home Assistant **http** module: add the folder to `config/www/` and access via `https://YOUR_HA:8123/local/thermostat-panel/`
   - Or any other web server (nginx, Apache, etc.) over HTTPS on your network

## iPad lock-down

To restrict the iPad to this panel only: **Guided Access** (Settings → Accessibility). Details in **VERROUILLAGE.md**.

## Home Assistant requirements

- REST API enabled (default with the frontend)
- **climate** entity for the thermostat
- Token with permission to call services

## “Auto” mode

If your thermostat uses `heat_cool` instead of `auto`, change the Auto button in **app.js**: replace `setHVACMode("auto")` with `setHVACMode("heat_cool")`.
