# Security

## Architecture: token on the server

The panel no longer uses a token in the browser. It calls the **Thermostat Panel API** add-on (see `addon/`), which:

- Holds the **Long-Lived Access Token** in its configuration (server-side only).
- Proxies requests to the Home Assistant API with that token.
- Accepts requests **only from allowed IP ranges** (e.g. `192.168.0.0/16`, `10.0.0.0/8`, `127.0.0.0/8`). Requests from other IPs receive **403 Forbidden**.

So the token is never sent to the client; only devices on your local network (or VPN) can use the panel’s API.

## Recommended measures

1. **Restrict access to the panel URL**
   - Keep the panel on your local network (home Wi‑Fi, VPN) when possible.
   - Avoid sharing the link publicly.

2. **Configure the add-on**
   - Set `allowed_networks` to your local/VPN subnets only (e.g. `192.168.0.0/24`).
   - Use a **dedicated Long-Lived Access Token** for the add-on (HA Profile → Create token, name e.g. “Thermostat panel API”). Revoke and recreate it if you have doubts.

3. **Least privilege**
   - The HA account tied to the token can be a user with only the required permissions (read/control the relevant climate and sensor entities). See the *Limiting an HA user’s access to certain entities* section below.

4. **Do not commit secrets**
   - Keep your real `config.js` (with your `baseUrl`) out of the Git repo if it contains sensitive hostnames. Use `config.example.js` as a template and keep `config.js` in `.gitignore` if you version the project. The add-on options (including the token) are stored by Home Assistant, not in this repo.

## Limiting an HA user’s access to certain entities

Home Assistant lets you assign users to **groups** whose **policy** defines which entities they can read or control. In practice:

- **Settings → People & access → Users**: create a user dedicated to the panel (or use an existing non-owner account).
- The **owner** always has full access; restrictions apply only to other accounts.
- Permissions are defined by **groups**. A user can belong to one or more groups (e.g. `system-users` = standard user). Group policies are merged (if any group allows an entity, the user has access).

### Policy structure (for advanced users)

Policies are JSON objects. Example to allow only reading and controlling the thermostat:

```json
{
  "entities": {
    "entity_ids": {
      "climate.thermostat": { "read": true, "control": true }
    }
  }
}
```

You can also allow a whole **domain** (e.g. `climate`) with `"domains": { "climate": true }`, or target **areas** (`area_ids`) or **devices** (`device_ids`).

### Where to configure

- **UI**: Depending on your HA version, some group/user management may be under **Settings → People & access** (Users tab, then the user’s group). The full policy detail (entity_ids, domains, etc.) is not always exposed in the UI.
- **Files**: Groups and their policies are stored in the HA config directory, in `.storage/auth` (and linked to users). Editing these files by hand is possible but delicate; back them up and check the [developer docs on permissions](https://developers.home-assistant.io/docs/auth_permissions).
- **Command line auth provider**: If you authenticate users via a script (auth provider `command_line`), you can output `group: system-users` to make them a non-admin user; detailed policies still need to be defined in HA groups.

Once a user is restricted to certain entities, create a **Long-Lived Access Token** from *their* profile (not the owner’s) and set that token in the **Thermostat Panel API add-on** options. If the token leaks, the attacker will only be able to act on the entities allowed for that account.

**Note**: The official docs state that non-owner accounts currently have the same access as the owner; group/policy restrictions are still evolving. Check behaviour on your version and the [release notes](https://www.home-assistant.io/blog/).
