# Securite

## Architecture

Le panel n'utilise aucun token dans le navigateur.  
Il appelle l'add-on **Thermostat Panel API** (`addon/`) qui:

- utilise l'API Core via `http://supervisor/core`
- s'authentifie uniquement avec `SUPERVISOR_TOKEN` injecte par Supervisor
- accepte seulement les IP presentes dans `allowed_networks` (sinon `403`)

## Consequences

`SUPERVISOR_TOKEN` est un jeton interne puissant.  
L'acces au panel doit donc rester strictement local/VPN.

## Mesures recommandees

1. **Limiter l'exposition reseau**
   - conserver l'URL du panel sur le LAN/VPN
   - ne pas publier le port sur Internet

2. **Filtrer les IP**
   - configurer `allowed_networks` au plus strict (ex. `192.168.0.0/24`)

3. **Proteger l'appareil client**
   - iPad en mode kiosk/Acces guide
   - verrouillage par code local

4. **Ne pas exposer les secrets**
   - ne jamais logger la valeur de `SUPERVISOR_TOKEN`
   - ne pas versionner de fichiers contenant des URLs ou infos sensibles inutiles

## Reference

- Home Assistant add-ons communication: https://developers.home-assistant.io/docs/add-ons/communication
