/**
 * Configuration du panneau thermostat Home Assistant
 * À adapter selon votre installation.
 */

var CONFIG = {
  // URL de base pour l'API. Mettez "auto" pour utiliser la même origine que la page
  // (recommandé : fonctionne en VPN, en local, ou via Duck DNS sans rien changer).
  // Sinon indiquez l'URL complète, ex: "https://echiquier.duckdns.org:48123"
  baseUrl: "auto",

  // Long-Lived Access Token (Profil HA > Créer un jeton)
  token: "VOTRE_TOKEN_ICI",

  // Entity ID du thermostat (ex: climate.salon, climate.thermostat)
  thermostatEntityId: "climate.thermostat",

  // Pas de température pour les boutons +/-
  stepDegrees: 0.5,

  // Intervalle de rafraîchissement des données (ms)
  refreshInterval: 10000
};
