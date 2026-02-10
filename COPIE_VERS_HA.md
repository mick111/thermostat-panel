# Copier le panneau vers le dossier www de Home Assistant

**Important :** La page que vous ouvrez (`https://echiquier.duckdns.org:48123/local/thermostat-panel/`) est servie par Home Assistant. Le navigateur charge donc les fichiers **présents sur le Pi** (dans `config/www/thermostat-panel/`), **pas** ceux de votre Mac.  
→ Si vous modifiez `config.js` (token, entity_id, etc.) **sur votre Mac**, vous devez **recopier** ce fichier vers le Pi pour que le changement soit pris en compte. Rechargez la page après la copie.

---

Vous n’avez pas accès à la racine dans File Editor : utilisez l’une des méthodes ci-dessous.

---

## Option A : Samba (recommandé si vous êtes sur le même réseau)

1. **Sur le Pi** : Add-ons → **Samba share** → Démarrer (activer « Démarrage au boot » si besoin).
2. **Sur le Mac** : Finder → menu **Aller** → **Aller vers le serveur** (ou ⌘K).
3. Saisir l’**IP locale du Raspberry Pi** (pas Duck DNS), par exemple :
   ```text
   smb://192.168.1.XX
   ```
   (Trouver l’IP : Paramètres HA → Système → Réseau, ou dans votre box.)
4. Se connecter au partage **config** (identifiants éventuels selon votre réglage Samba).
5. Dans le dossier ouvert, créer le dossier **www** s’il n’existe pas.
6. Ouvrir **www**, créer le dossier **thermostat-panel**.
7. Copier-coller **depuis votre Mac** les 4 fichiers du dossier `thermostat-panel` vers **config/www/thermostat-panel/** :
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`

L’URL du panneau sera : **https://echiquier.duckdns.org:48123/local/thermostat-panel/**

---

## Option B : Copie en ligne de commande (SSH / SCP)

Il faut que l’add-on **SSH** (ou un accès SSH au Pi) soit activé.

1. **Sur le Pi** : Add-ons → **SSH** → Configurer (notez le **port**, souvent 22 ou 22222) → Démarrer.
2. **Sur le Mac** : ouvrir le Terminal et lancer :

```bash
# Remplacer 192.168.1.XX par l’IP locale du Pi, et 22 par le port SSH si différent
export HA_HOST="192.168.1.XX"
export HA_SSH_PORT="22"

# Créer le dossier sur le Pi
ssh -p "$HA_SSH_PORT" root@$HA_HOST "mkdir -p /config/www/thermostat-panel"

# Copier les 4 fichiers (adapter le chemin du projet si besoin)
scp -P "$HA_SSH_PORT" /Users/mick111/Documents/Projets/thermostat-panel/index.html \
  /Users/mick111/Documents/Projets/thermostat-panel/styles.css \
  /Users/mick111/Documents/Projets/thermostat-panel/app.js \
  /Users/mick111/Documents/Projets/thermostat-panel/config.js \
  root@$HA_HOST:/config/www/thermostat-panel/
```

Ou en une seule ligne (adapter IP et port) :

```bash
ssh -p 22 root@192.168.1.XX "mkdir -p /config/www/thermostat-panel" && scp -P 22 /Users/mick111/Documents/Projets/thermostat-panel/{index.html,styles.css,app.js,config.js} root@192.168.1.XX:/config/www/thermostat-panel/
```

---

## Option C : File Editor (si vous voyez configuration.yaml)

Si dans File Editor vous voyez des fichiers comme **configuration.yaml** à la racine de ce qui s’affiche :

1. Vous êtes déjà dans **config**. Créez un dossier **www** (bouton « Nouveau dossier »).
2. Ouvrez **www**, créez **thermostat-panel**.
3. Ouvrez **thermostat-panel**, puis créez 4 fichiers : `index.html`, `styles.css`, `app.js`, `config.js`.
4. Copiez-collez le contenu de chaque fichier depuis votre projet sur le Mac (dossier `thermostat-panel`).

Si vous ne voyez pas `configuration.yaml` et ne pouvez pas remonter au niveau au-dessus, utilisez l’option A (Samba) ou B (SCP).
