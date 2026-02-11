# Thermostat Panel API (add-on Home Assistant)

Add-on qui expose une API FastAPI en proxy vers Home Assistant **et sert le panel thermostat** (HTML/JS/CSS intégrés). Le token HA est configuré dans l'add-on ; seules les IP des réseaux autorisés peuvent accéder au panel et à l'API.

## Installation

- **Dépôt local** : copiez le dossier de l'add-on (config.yaml, Dockerfile, run.sh, main.py, static/) dans un dépôt d'add-ons reconnu par Home Assistant (Supervisor → Add-ons → Add-on store → ⋮ → Repositories).
- Ou ajoutez ce repo comme dépôt et installez l'add-on « Thermostat Panel API ».

## Configuration (options)

- **port** : port d'écoute (défaut 8765). Doit correspondre au port exposé dans l'onglet Réseau de l'add-on.
- **ha_url** : URL de l'API Home Assistant (voir ci-dessous). Valeur par défaut : **`auto`** (détection automatique).
- **token** : Long-Lived Access Token (Profil HA → Créer un jeton).
- **allowed_networks** : liste de réseaux CIDR autorisés (ex. `192.168.0.0/24`, `10.0.0.0/8`). Seules les requêtes dont l'IP source est dans l'un de ces réseaux sont acceptées.
- **thermostat_entity_id**, **guest_entity_id**, **guest_count_entity_id**, **guest_dates_entity_id** : entités HA pour le panel.
- **step_degrees**, **refresh_interval** : pas de température et intervalle de rafraîchissement (ms).

### ha_url : accès à l’API Home Assistant

L’add-on doit joindre l’API HTTP de Home Assistant (Core) pour lire les états et appeler les services. Selon la façon dont vous exécutez Home Assistant, l’URL n’est pas la même.

| Valeur | Quand l’utiliser | Explication |
|--------|------------------|-------------|
| **`auto`** (recommandé) | Toujours, sauf cas particulier | L’add-on essaie d’abord `http://supervisor/core`, puis `http://localhost:8123`. La première URL qui répond est utilisée. Aucune configuration à faire dans la plupart des cas. |
| **`http://supervisor/core`** | Add-on installé via le **Add-on store** (HA OS ou Supervised) | L’add-on tourne dans un conteneur géré par le Supervisor. L’API Core est exposée via le nom de domaine interne **`supervisor`**. C’est le cas le plus courant. |
| **`http://localhost:8123`** | Home Assistant Core installé **sans** Supervisor (Docker seul, venv, etc.) | L’API écoute sur la même machine, port 8123. Si l’add-on est dans un conteneur sur le même host, selon le réseau Docker il peut falloir utiliser l’IP du host (ex. `http://172.17.0.1:8123`) au lieu de `localhost`. |

En résumé : laisser **`auto`** pour une installation classique ; ne renseigner une URL explicite que si la détection automatique ne convient pas (environnement particulier ou dépannage).

## Utilisation

Une fois l'add-on démarré, ouvrez **http://IP_HA:8765/** (ou le port configuré) depuis un appareil sur le réseau local. Le panel s'affiche directement ; la configuration (entités, etc.) est lue depuis les options de l'add-on.
