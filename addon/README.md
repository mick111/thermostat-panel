# Thermostat Panel API (add-on Home Assistant)

Add-on qui expose une API FastAPI en proxy vers Home Assistant **et sert le panel thermostat** (HTML/JS/CSS intégrés). Le token HA est configuré dans l'add-on ; seules les IP des réseaux autorisés peuvent accéder au panel et à l'API.

## Installation

- **Dépôt local** : copiez le dossier de l'add-on (config.yaml, Dockerfile, run.sh, main.py, static/) dans un dépôt d'add-ons reconnu par Home Assistant (Supervisor → Add-ons → Add-on store → ⋮ → Repositories).
- Ou ajoutez ce repo comme dépôt et installez l'add-on « Thermostat Panel API ».

## Configuration (options)

- **port** : port d'écoute (défaut 8765). Doit correspondre au port exposé dans l'onglet Réseau de l'add-on.
- **ha_url** : URL de l'API Home Assistant. Sur Supervisor : `http://supervisor/core`. En local : `http://localhost:8123`.
- **token** : Long-Lived Access Token (Profil HA → Créer un jeton).
- **allowed_networks** : liste de réseaux CIDR autorisés (ex. `192.168.0.0/24`, `10.0.0.0/8`). Seules les requêtes dont l'IP source est dans l'un de ces réseaux sont acceptées.
- **thermostat_entity_id**, **guest_entity_id**, **guest_count_entity_id**, **guest_dates_entity_id** : entités HA pour le panel.
- **step_degrees**, **refresh_interval** : pas de température et intervalle de rafraîchissement (ms).

## Utilisation

Une fois l'add-on démarré, ouvrez **http://IP_HA:8765/** (ou le port configuré) depuis un appareil sur le réseau local. Le panel s'affiche directement ; la configuration (entités, etc.) est lue depuis les options de l'add-on.
