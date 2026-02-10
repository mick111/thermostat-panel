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

iOS and Safari cache pages added to the home screen (and sometimes a **Service Worker** from Home Assistant caches responses). After updating files on the server, you may still see the old version.

**What to do (in order):**

1. **On the server**: After each deploy, bump the version in `index.html`:
   - `<meta name="app-version" content="2">` → change to `3`, then `4`, etc.
   - In the three URLs: `styles.css?v=2`, `config.js?v=2`, `app.js?v=2` → use the same number.
   Copy the updated files to the Pi.

2. **On the iPad – clear caches and shortcut**:
   - **Remove the home screen icon**: long-press the Thermostat icon → **Remove App** / **Delete**.
   - **Clear website data**: **Settings** → **Safari** → **Advanced** → **Website Data** → search for your HA domain (e.g. `echiquier.duckdns.org`) → **Swipe left** → **Delete**. This removes the cache and any Service Worker for that site.
   - **Quit Safari fully**: from the app switcher (double‑click Home or swipe up), swipe Safari away so it’s closed.
   - Open **Safari** again, go to the panel URL (e.g. `https://…/local/thermostat-panel/`). You should get the new version. Optionally add a version in the URL when testing: `.../thermostat-panel/?v=3`.
   - **Add to Home Screen** again (Share → Add to Home Screen).

3. **If it still shows the old version**: The app includes a small script that detects when the loaded page is older than a version you had before (stored in the browser). In that case it forces a reload with a cache-busting URL. So after step 2, the first load might redirect once and then show the new version. If not, try **Settings** → **Safari** → **Clear History and Website Data** (this clears all Safari data), then open the panel URL and add to home screen again.

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
