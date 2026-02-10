/**
 * Home Assistant thermostat panel configuration
 * Adjust for your setup.
 */

var CONFIG = {
  // API base URL. "auto" = same origin as the page (e.g. with /local/thermostat-panel/).
  // To force HA URL: "https://echiquier.duckdns.org:48123"
  baseUrl: "auto",

  // Long-Lived Access Token (HA Profile → Create token).
  // Warning: this token is visible to anyone who can load the page. See SECURITE.md.
  token: "VOTRE_TOKEN_ICI",

  // Thermostat entity ID (e.g. climate.living_room, climate.thermostat)
  thermostatEntityId: "climate.thermostat",

  // Temperature step for +/- buttons (degrees)
  stepDegrees: 0.5,

  // Data refresh interval (ms)
  refreshInterval: 10000
};
