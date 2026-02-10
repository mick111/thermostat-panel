# Copying the panel to Home Assistant’s www folder

**Important:** The page you open (`https://echiquier.duckdns.org:48123/local/thermostat-panel/`) is served by Home Assistant. The browser therefore loads the files **on the Pi** (in `config/www/thermostat-panel/`), **not** the ones on your Mac.  
→ If you change `config.js` (token, entity_id, etc.) **on your Mac**, you must **copy** that file to the Pi again for the change to take effect. Reload the page after copying.

---

You don’t have access to the root in File Editor: use one of the methods below.

---

## Option A: Samba (recommended if you’re on the same network)

1. **On the Pi**: Add-ons → **Samba share** → Start (enable “Start on boot” if needed).
2. **On the Mac**: Finder → **Go** menu → **Connect to Server** (or ⌘K).
3. Enter the **Raspberry Pi’s local IP** (not Duck DNS), for example:
   ```text
   smb://192.168.1.XX
   ```
   (Find the IP: HA Settings → System → Network, or from your router.)
4. Connect to the **config** share (credentials as per your Samba setup).
5. In the opened folder, create the **www** folder if it doesn’t exist.
6. Open **www**, create the **thermostat-panel** folder.
7. Copy **from your Mac** the 4 files from the `thermostat-panel` folder into **config/www/thermostat-panel/**:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`

The panel URL will be: **https://echiquier.duckdns.org:48123/local/thermostat-panel/**

---

## Option B: Command line copy (SSH / SCP)

The **SSH** add-on (or SSH access to the Pi) must be enabled.

1. **On the Pi**: Add-ons → **SSH** → Configure (note the **port**, often 22 or 22222) → Start.
2. **On the Mac**: open Terminal and run:

```bash
# Replace 192.168.1.XX with the Pi’s local IP, and 22 with the SSH port if different
export HA_HOST="192.168.1.XX"
export HA_SSH_PORT="22"

# Create the folder on the Pi
ssh -p "$HA_SSH_PORT" root@$HA_HOST "mkdir -p /config/www/thermostat-panel"

# Copy the 4 files (adjust project path if needed)
scp -P "$HA_SSH_PORT" /Users/mick111/Documents/Projets/thermostat-panel/index.html \
  /Users/mick111/Documents/Projets/thermostat-panel/styles.css \
  /Users/mick111/Documents/Projets/thermostat-panel/app.js \
  /Users/mick111/Documents/Projets/thermostat-panel/config.js \
  root@$HA_HOST:/config/www/thermostat-panel/
```

Or in one line (adjust IP and port):

```bash
ssh -p 22 root@192.168.1.XX "mkdir -p /config/www/thermostat-panel" && scp -P 22 /Users/mick111/Documents/Projets/thermostat-panel/{index.html,styles.css,app.js,config.js} root@192.168.1.XX:/config/www/thermostat-panel/
```

---

## Option C: File Editor (if you see configuration.yaml)

If in File Editor you see files like **configuration.yaml** at the root of what’s displayed:

1. You’re already in **config**. Create a **www** folder (e.g. “New folder” button).
2. Open **www**, create **thermostat-panel**.
3. Open **thermostat-panel**, then create 4 files: `index.html`, `styles.css`, `app.js`, `config.js`.
4. Copy-paste the contents of each file from your project on the Mac (thermostat-panel folder).

If you don’t see `configuration.yaml` and can’t go up a level, use Option A (Samba) or B (SCP).
