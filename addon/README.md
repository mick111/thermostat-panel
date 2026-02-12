# Thermostat Panel API (add-on Home Assistant)

Add-on qui expose une API FastAPI en proxy vers Home Assistant **et sert le panel thermostat** (HTML/JS/CSS integres).

Cette version est volontairement simplifiee pour un usage perso:

- API Core **hard-codee** sur `http://supervisor/core`
- authentification **uniquement** via `SUPERVISOR_TOKEN`
- pas d'options `ha_url` ni `token`

## Installation

- **Depot local** : copiez le dossier de l'add-on (`config.yaml`, `Dockerfile`, `run.sh`, `main.py`, `static/`) dans un depot d'add-ons reconnu par Home Assistant (Supervisor -> Add-ons -> Add-on store -> Repositories).
- Ou ajoutez ce repo comme depot et installez l'add-on « Thermostat Panel API ».

## Configuration (options)

- **port** : port d'ecoute (defaut 8765). Doit correspondre au port expose dans l'onglet Reseau de l'add-on.
- **allowed_networks** : liste de reseaux CIDR autorises (ex. `192.168.0.0/24`, `10.0.0.0/8`).
- **thermostat_entity_id**, **guest_entity_id**, **guest_count_entity_id**, **guest_dates_entity_id** : entites HA pour le panel.
- **step_degrees**, **refresh_interval** : pas de temperature et intervalle de rafraichissement (ms).

## Permissions add-on

L'add-on active `homeassistant_api: true` et `hassio_api: true` dans `config.yaml` pour recuperer `SUPERVISOR_TOKEN` et acceder a l'API Core via `http://supervisor/core/api/`.

Le demarrage de `uvicorn` est execute via `/usr/bin/with-contenv` pour garantir la recuperation des variables d'environnement injectees par le Supervisor.

Reference doc: https://developers.home-assistant.io/docs/add-ons/communication

## Utilisation

Une fois l'add-on demarre, ouvrez **http://IP_HA:8765/** (ou le port configure) depuis un appareil du reseau local.
