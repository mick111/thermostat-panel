# Security and token

## The token is visible client-side

The **config.js** file is sent as-is to the browser. Anyone who can load the panel page can therefore see the token (view source, Network tab in dev tools, etc.). This is a limitation of static web apps that call an API with a token in the frontend.

## Recommended measures

1. **Restrict access to the panel URL**
   - Keep the panel on your local network (home Wi‑Fi, VPN) when possible.
   - Avoid sharing the link publicly.

2. **Use a dedicated token**
   - Create a **Long-Lived Access Token** reserved for the panel (HA Profile → Create token, name e.g. “Thermostat panel”).
   - If it is leaked or you have doubts, revoke that token in Home Assistant and create a new one.

3. **Least privilege**
   - The HA account tied to the token can be a user with only the required permissions (access to the relevant climate entities), to limit impact if compromised. See the *Limiting an HA user’s access to certain entities* section below.

4. **Do not commit the token**
   - Keep your real `config.js` (with the token) out of the Git repo. Use `config.example.js` as a template and add `config.js` to `.gitignore` if you version the project.

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

Once a user is restricted to certain entities, create a **Long-Lived Access Token** from *their* profile (not the owner’s) and use that token in the panel. If the token leaks, the attacker will only be able to act on the entities allowed for that account.

**Note**: The official docs state that non-owner accounts currently have the same access as the owner; group/policy restrictions are still evolving. Check behaviour on your version and the [release notes](https://www.home-assistant.io/blog/).

## Alternative (more complex)

To avoid exposing a token in the browser, you would need a small server (proxy) that holds the token and forwards API requests, with the frontend calling it without a token. That is outside the scope of this minimal panel.
