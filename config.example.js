/**
 * Configuration du panneau thermostat Home Assistant
 * À adapter selon votre installation.
 */

var CONFIG = {
  // URL de base pour l'API. "auto" = même origine que la page (votre cas avec /local/thermostat-panel/).
  // Pour forcer l'URL HA : "https://echiquier.duckdns.org:48123"
  baseUrl: "auto",

  // Long-Lived Access Token (Profil HA > Créer un jeton).
  // Attention : ce token est visible par quiconque peut charger la page. Voir SECURITE.md.
  token: "VOTRE_TOKEN_ICI",

  // Entity ID du thermostat (ex: climate.salon, climate.thermostat)
  thermostatEntityId: "climate.thermostat",

  // Pas de température pour les boutons +/-
  stepDegrees: 0.5,

  // Intervalle de rafraîchissement des données (ms)
  refreshInterval: 10000
};
