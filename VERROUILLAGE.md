# Locking the iPad in kiosk mode

To make the iPad usable **only** for the thermostat panel (no Safari, no other apps, no way out without a password), use **Guided Access** (iOS) and a few settings.

---

## 1. Guided Access (required)

**Guided Access** locks the device to a single app. While it’s on, you can’t switch apps or leave the screen without the code.

### Enable Guided Access (one-time)

1. **Settings** → **General** → **Accessibility** → **Guided Access**
2. Turn on **Guided Access**
3. Set a **passcode** (remember it to exit kiosk mode)
4. Optional: turn on **Accessibility Shortcut** if you want to disable certain touch areas (Home button, etc.)

### Daily use

1. Open **Safari** (or the “Thermostat” icon if you added the page to the home screen).
2. Go to the thermostat panel URL (your server that serves `index.html`).
3. **Triple-click the main button** (Home) to **start Guided Access**.
4. The iPad then stays on that page: no URL bar, no app switching.

### Exiting Guided Access

1. **Triple-click** the main button (Home).
2. Enter the **passcode** you set for Guided Access.
3. Tap **End** at the top left.

---

## 2. “Add to Home Screen”

So the panel looks like an app and opens full screen:

1. In Safari, open the thermostat page.
2. Tap the **Share** icon (square with arrow).
3. Choose **Add to Home Screen**.
4. Name it e.g. “Thermostat” then **Add**.

Then launch **that icon** and enable **Guided Access** (triple-click). The iPad will be locked to that “app” only.

### Updating when the page is on the home screen

iOS and Safari cache pages added to the home screen. After updating files on the server (HA), you may feel the old version is still showing.

**What to do:**

1. **Bump the version in `index.html`**: scripts and CSS are loaded with `?v=1`. After a deploy, change to `?v=2`, then `?v=3`, etc. (in all three places: `styles.css?v=…`, `config.js?v=…`, `app.js?v=…`). Copy `index.html` to the server again. On the next load, the browser will fetch the new files.
2. **Remove and recreate the shortcut**: on the iPad, long-press the Thermostat icon on the home screen → **Remove App** (or **Delete**). Then in Safari, open the panel URL again and **Add to Home Screen** again.
3. **Clear site data** (if needed): Settings → Safari → Advanced → Website Data → find your domain → delete. Then open the page again and optionally add it to the home screen again.

---

## 3. Recommended settings for a wall panel

| Setting | Where | Value |
|--------|--------|-------|
| **Auto-Lock** | Settings → Display & Brightness → Auto-Lock | **Never** (or 15 min if you prefer to save the display) |
| **Do Not Disturb** | Control Center (optional) | On to avoid notifications |
| **Airplane / Wi‑Fi** | — | Keep **Wi‑Fi** on so the iPad can reach Home Assistant |
| **Activation Lock (Find My)** | Settings → [your account] → iCloud → Find My | Keep on if you want to unlock remotely if you lose the code |

---

## 4. Lock-down flow summary

1. Put the thermostat app or page on the home screen (optional but handy).
2. Open **only** that page / that icon.
3. **Triple-click** the main button → **Guided Access** on.
4. The user can’t use the iPad for anything else; exiting requires the Guided Access passcode.

No other changes are needed in the web app: locking is entirely handled by iOS via Guided Access.
