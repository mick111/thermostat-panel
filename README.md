# Panneau thermostat Home Assistant (iPad kiosque)

Application web minimaliste pour piloter un thermostat Home Assistant depuis un iPad en mode kiosque (mur). Compatible **iOS 9.3** (XMLHttpRequest, pas de fetch).

## Fichiers

- **index.html** — Page principale (température, consigne, mode, boutons)
- **styles.css** — Mise en page plein écran, tactile
- **app.js** — Appels API Home Assistant (lecture état, set_temperature, set_hvac_mode)
- **config.js** — À éditer : URL HA, token, entity_id du thermostat
- **VERROUILLAGE.md** — Comment verrouiller l’iPad (Accès guidé + réglages)

## Configuration

1. Éditer **config.js** :
   - `baseUrl` : URL de Home Assistant (ex. `https://homeassistant.local:8123`)
   - `token` : Long-Lived Access Token (Profil → Créer un jeton)
   - `thermostatEntityId` : ex. `climate.salon`, `climate.thermostat`
2. Servir les fichiers en HTTPS (obligatoire pour l’API depuis une page web). Possibilités :
   - Module **http** de Home Assistant : ajouter le dossier dans `config/www/` et accéder via `https://VOTRE_HA:8123/local/thermostat-panel/`
   - Ou tout autre serveur web (nginx, Apache, etc.) en HTTPS sur votre réseau

## Verrouillage iPad

Pour que l’iPad ne soit utilisable que pour ce panneau : **Accès guidé** (Réglages → Accessibilité). Détails dans **VERROUILLAGE.md**.

## Prérequis Home Assistant

- API REST activée (par défaut avec le frontend)
- Entité **climate** pour le thermostat
- Token avec droits d’appel de services

## Mode « Auto »

Si votre thermostat utilise le mode `heat_cool` au lieu de `auto`, modifier dans **app.js** la ligne du bouton Auto : remplacer `setHVACMode("auto")` par `setHVACMode("heat_cool")`.
