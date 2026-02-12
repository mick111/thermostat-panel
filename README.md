# Home Assistant thermostat panel (iPad kiosk)

Minimal web app to control a Home Assistant thermostat from an iPad in kiosk mode (wall mount). Compatible with **iOS 9.3** (XMLHttpRequest only, no fetch).

The panel calls a **backend API** (add-on Thermostat Panel API) which proxies requests to Home Assistant. The token stays on the server; only clients on allowed local IPs can use the API. See **SECURITE.md**.

## Files

- **addon/** — Home Assistant add-on (FastAPI) : proxy vers HA, restriction par IP, et **service du panel** (ouvrir l’URL de l’add-on pour l’utiliser).
  - **addon/static/** — Fichiers du panel (index.html, app.js, styles.css, apple-touch-icon.png). Modifier ici pour faire évoluer le panel.
- **VERROUILLAGE.md** — Verrouillage iPad (Accès guidé).

## Ajouter l’add-on à Home Assistant

1. **Pousser ce projet sur un dépôt Git** (GitHub, Gitea, etc.) si ce n’est pas déjà fait. L’add-on doit être dans le sous-dossier **addon/** (avec `config.yaml`, `Dockerfile`, `run.sh`, `main.py`, `static/` à l’intérieur).

2. **Ajouter le dépôt dans Home Assistant**  
   - **Paramètres** → **Add-ons** → **Add-on store**  
   - En haut à droite, cliquer sur **⋮** (menu) → **Repositories**  
   - Ajouter l’URL du dépôt (ex. `https://github.com/VOTRE_UTILISATEUR/thermostat-panel`) puis **Valider**.

3. **Installer l’add-on**  
   - Recharger la page du Add-on store si besoin.  
   - Chercher **« Thermostat Panel API »** (ou le nom du dépôt dans la liste).  
   - Cliquer sur l’add-on → **Installer** → attendre la fin du build.

4. **Configurer et démarrer**  
   - Onglet **Configuration** : renseigner `allowed_networks` et les options du panel (`thermostat_entity_id`, etc.).  
   - Onglet **Réseau** : le port (ex. 8765) doit être exposé.  
   - **Démarrer** l’add-on.

Ensuite, ouvrir **http://IP_DE_HA:8765/** (ou le port choisi) depuis un appareil du réseau local pour afficher le panel.

## Configuration

Une fois l’add-on installé, tout se règle dans ses **options** : `allowed_networks`, `thermostat_entity_id`, `guest_entity_id`, etc.  
L’API Home Assistant est forcée en interne sur `http://supervisor/core` et l’auth se fait via `SUPERVISOR_TOKEN` injecté par Supervisor.

## iPad lock-down

To restrict the iPad to this panel only: **Guided Access** (Settings → Accessibility). Details in **VERROUILLAGE.md**.

## Home Assistant requirements

- **Thermostat Panel API add-on** installed and running (`allowed_networks` configured).
- **climate** entity for the thermostat.
- Sensor Entities with informations on the guest for greetings.

## Mode « Auto »

Si le thermostat utilise `heat_cool` au lieu de `auto`, modifier le bouton Auto dans **addon/static/app.js** : remplacer `setHVACMode("auto")` par `setHVACMode("heat_cool")`.
