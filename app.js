/**
 * Thermostat panel — Home Assistant API calls
 * Compatible with old iOS (XMLHttpRequest only, no fetch)
 */

(function () {
  "use strict";

  var baseUrl = (CONFIG.baseUrl === "auto" || !CONFIG.baseUrl)
    ? (window.location.origin || "").replace(/\/$/, "")
    : CONFIG.baseUrl.replace(/\/$/, "");
  var token = (typeof CONFIG.token === "string" ? CONFIG.token : "").trim();
  var entityId = CONFIG.thermostatEntityId;
  var step = CONFIG.stepDegrees;
  var refreshInterval = CONFIG.refreshInterval;
  var ARC_START_DEG = 225;
  var ARC_SPAN_DEG = 270;
  var ARC_RADIUS = 43;
  var LANG_STORAGE_KEY = "thermostat-panel-lang";

  var I18N = {
    en: {
      refresh: "Refresh",
      refreshAria: "Refresh page",
      statusLoading: "Loading…",
      statusConnected: "Connected",
      statusErrorPrefix: "Error: ",
      statusTokenMissing: "Set the token in config.js (HA Profile → Create token)",
      error401Hint: " Check the token in config.js (HA Profile → Create token) and that baseUrl points to Home Assistant.",
      networkUnavailable: "Network unavailable",
      labelCurrentTemperature: "Current temperature",
      lastUpdatePrefix: "Last update: ",
      modeHeating: "Heating",
      modeIdle: "Idle",
      modeOff: "Off",
      modeHeat: "Heat",
      presetAway: "Away",
      presetSleep: "Sleep",
      presetEco: "Eco",
      presetComfort: "Comfort",
      ariaDecrease: "Decrease",
      ariaIncrease: "Increase",
      comfortMessage: "Please be reasonable with heating."
    },
    fr: {
      refresh: "Rafraîchir",
      refreshAria: "Rafraîchir la page",
      statusLoading: "Chargement…",
      statusConnected: "Connecté",
      statusErrorPrefix: "Erreur : ",
      statusTokenMissing: "Configurez le token dans config.js (Profil HA → Créer un jeton)",
      error401Hint: " Vérifiez le token dans config.js (Profil HA → Créer un jeton) et que baseUrl pointe bien vers Home Assistant.",
      networkUnavailable: "Réseau indisponible",
      labelCurrentTemperature: "Température actuelle",
      lastUpdatePrefix: "Dernière mise à jour : ",
      modeHeating: "Chauffe",
      modeIdle: "Inactif",
      modeOff: "Arrêt",
      modeHeat: "Chauffage",
      presetAway: "Absent",
      presetSleep: "Sommeil",
      presetEco: "Éco",
      presetComfort: "Confort",
      ariaDecrease: "Baisser",
      ariaIncrease: "Monter",
      comfortMessage: "Merci d’être raisonnable sur le chauffage."
    },
    es: {
      refresh: "Actualizar",
      refreshAria: "Actualizar la página",
      statusLoading: "Cargando…",
      statusConnected: "Conectado",
      statusErrorPrefix: "Error: ",
      statusTokenMissing: "Configure el token en config.js (Perfil HA → Crear token)",
      error401Hint: " Verifique el token en config.js (Perfil HA → Crear token) y que baseUrl apunte a Home Assistant.",
      networkUnavailable: "Red no disponible",
      labelCurrentTemperature: "Temperatura actual",
      lastUpdatePrefix: "Última actualización: ",
      modeHeating: "Calentando",
      modeIdle: "Inactivo",
      modeOff: "Apagado",
      modeHeat: "Calefacción",
      presetAway: "Ausente",
      presetSleep: "Sueño",
      presetEco: "Eco",
      presetComfort: "Confort",
      ariaDecrease: "Bajar",
      ariaIncrease: "Subir",
      comfortMessage: "Por favor, sean razonables con la calefacción."
    }
  };

  var el = {
    status: document.getElementById("status"),
    btnRefresh: document.getElementById("btnRefresh"),
    btnLangFr: document.getElementById("btnLangFr"),
    btnLangEn: document.getElementById("btnLangEn"),
    btnLangEs: document.getElementById("btnLangEs"),
    labelCurrentTemp: document.getElementById("labelCurrentTemp"),
    currentTemp: document.getElementById("currentTemp"),
    targetTemp: document.getElementById("targetTemp"),
    lastUpdate: document.getElementById("lastUpdate"),
    btnUp: document.getElementById("btnUp"),
    btnDown: document.getElementById("btnDown"),
    modeLabel: document.getElementById("modeLabel"),
    dialTrackPath: document.getElementById("dialTrackPath"),
    dialFillPath: document.getElementById("dialFillPath"),
    dialCurrentDot: document.getElementById("dialCurrentDot"),
    btnPresetAway: document.getElementById("btnPresetAway"),
    btnPresetSleep: document.getElementById("btnPresetSleep"),
    btnPresetEco: document.getElementById("btnPresetEco"),
    btnPresetComfort: document.getElementById("btnPresetComfort"),
    labelPresetAway: document.getElementById("labelPresetAway"),
    labelPresetSleep: document.getElementById("labelPresetSleep"),
    labelPresetEco: document.getElementById("labelPresetEco"),
    labelPresetComfort: document.getElementById("labelPresetComfort"),
    comfortMessage: document.getElementById("comfortMessage")
  };

  var currentState = null;
  var refreshTimer = null;
  var currentLang = "en";
  var lastStatusType = "loading";
  var lastStatusErrorMessage = "";

  function t(key) {
    var langDict = I18N[currentLang] || I18N.en;
    if (langDict[key] != null) return langDict[key];
    if (I18N.en[key] != null) return I18N.en[key];
    return key;
  }

  function localeForCurrentLang() {
    if (currentLang === "fr") return "fr-FR";
    if (currentLang === "es") return "es-ES";
    return "en-US";
  }

  function setStatus(text, className) {
    el.status.textContent = text;
    el.status.className = "status " + (className || "");
    el.btnRefresh.style.display = (className === "connected") ? "none" : "";
  }

  function setStatusLoading() {
    lastStatusType = "loading";
    lastStatusErrorMessage = "";
    setStatus(t("statusLoading"), "");
  }

  function setStatusConnected() {
    lastStatusType = "connected";
    lastStatusErrorMessage = "";
    setStatus(t("statusConnected"), "connected");
  }

  function setStatusTokenMissing() {
    lastStatusType = "token_missing";
    lastStatusErrorMessage = "";
    setStatus(t("statusTokenMissing"), "error");
  }

  function setStatusErrorMessage(rawMessage) {
    lastStatusType = "error";
    lastStatusErrorMessage = rawMessage || "";
    setStatus(t("statusErrorPrefix") + lastStatusErrorMessage, "error");
  }

  function rerenderStatusForLanguage() {
    if (lastStatusType === "connected") {
      setStatus(t("statusConnected"), "connected");
    } else if (lastStatusType === "token_missing") {
      setStatus(t("statusTokenMissing"), "error");
    } else if (lastStatusType === "error") {
      setStatus(t("statusErrorPrefix") + lastStatusErrorMessage, "error");
    } else {
      setStatus(t("statusLoading"), "");
    }
  }

  function formatTemp(value) {
    if (value == null || value === "") return "—";
    var n = parseFloat(value, 10);
    if (isNaN(n)) return "—";
    var temp = n.toFixed(1);
    if (currentLang !== "en") temp = temp.replace(".", ",");
    return temp + " °C";
  }

  function formatTime(isoString) {
    if (!isoString) return "—";
    try {
      var d = new Date(isoString);
      return d.toLocaleTimeString(localeForCurrentLang(), { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      return "—";
    }
  }

  function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  function polarToCartesian(angleDeg, radius) {
    var rad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad)
    };
  }

  function describeArc(startDeg, deltaDeg, radius) {
    var start = polarToCartesian(startDeg, radius);
    if (!deltaDeg || deltaDeg <= 0) {
      return "M " + start.x + " " + start.y;
    }
    var end = polarToCartesian(startDeg + deltaDeg, radius);
    var largeArcFlag = deltaDeg > 180 ? 1 : 0;
    return "M " + start.x + " " + start.y +
      " A " + radius + " " + radius + " 0 " + largeArcFlag + " 1 " + end.x + " " + end.y;
  }

  function apiRequest(method, path, body, callback) {
    var url = baseUrl + path;
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var status = xhr.status;
      var response = null;
      try {
        if (xhr.responseText) response = JSON.parse(xhr.responseText);
      } catch (e) {}

      if (status >= 200 && status < 300) {
        callback(null, response);
      } else {
        var msg = "HTTP " + status + (response && response.message ? " — " + response.message : "");
        if (status === 401) {
          msg += t("error401Hint");
        }
        callback(new Error(msg), null);
      }
    };

    xhr.onerror = function () {
      callback(new Error(t("networkUnavailable")), null);
    };

    if (body && (method === "POST" || method === "PUT")) {
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  }

  function loadState(callback) {
    apiRequest("GET", "/api/states/" + encodeURIComponent(entityId), null, function (err, data) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      currentState = data;
      if (callback) callback(null, data);
    });
  }

  function updateUI(state) {
    if (!state || state.attributes === undefined) return;

    var attrs = state.attributes;
    var current = attrs.current_temperature != null ? attrs.current_temperature : attrs.temperature;
    var target = attrs.temperature;

    el.currentTemp.textContent = formatTemp(current);
    el.targetTemp.textContent = formatTemp(target);
    el.lastUpdate.textContent = t("lastUpdatePrefix") + formatTime(state.last_updated);

    var modeState = (state.state || "").toLowerCase();
    var hvacAction = (attrs.hvac_action || "").toLowerCase();
    if (hvacAction === "heating") el.modeLabel.textContent = t("modeHeating");
    else if (hvacAction === "idle") el.modeLabel.textContent = t("modeIdle");
    else if (hvacAction === "off") el.modeLabel.textContent = t("modeOff");
    else if (modeState === "heat") el.modeLabel.textContent = t("modeHeat");
    else if (modeState === "off") el.modeLabel.textContent = t("modeOff");
    else el.modeLabel.textContent = modeState || "—";

    var minT = attrs.min_temp != null ? parseFloat(attrs.min_temp, 10) : 5;
    var maxT = attrs.max_temp != null ? parseFloat(attrs.max_temp, 10) : 35;
    var targetNum = target != null ? parseFloat(target, 10) : minT;
    var targetRatio = maxT > minT ? clamp01((targetNum - minT) / (maxT - minT)) : 0;
    var targetDelta = targetRatio * ARC_SPAN_DEG;
    el.dialTrackPath.setAttribute("d", describeArc(ARC_START_DEG, ARC_SPAN_DEG, ARC_RADIUS));
    el.dialFillPath.setAttribute("d", describeArc(ARC_START_DEG, targetDelta, ARC_RADIUS));

    var currentNum = current != null ? parseFloat(current, 10) : minT;
    var currentRatio = maxT > minT ? clamp01((currentNum - minT) / (maxT - minT)) : 0;
    var currentAngle = ARC_START_DEG + currentRatio * ARC_SPAN_DEG;
    var currentPoint = polarToCartesian(currentAngle, ARC_RADIUS);
    el.dialCurrentDot.setAttribute("cx", currentPoint.x);
    el.dialCurrentDot.setAttribute("cy", currentPoint.y);

    var presetMode = (attrs.preset_mode || "").toLowerCase();
    [el.btnPresetAway, el.btnPresetSleep, el.btnPresetEco, el.btnPresetComfort].forEach(function (btn) {
      btn.classList.remove("active");
    });
    if (presetMode === "away") el.btnPresetAway.classList.add("active");
    else if (presetMode === "sleep") el.btnPresetSleep.classList.add("active");
    else if (presetMode === "eco") el.btnPresetEco.classList.add("active");
    else if (presetMode === "comfort") el.btnPresetComfort.classList.add("active");

    el.comfortMessage.style.display = targetNum > 22 ? "" : "none";

    el.btnUp.disabled = target != null && parseFloat(target, 10) >= maxT;
    el.btnDown.disabled = target != null && parseFloat(target, 10) <= minT;
  }

  function loadSavedLanguage() {
    var lang = "en";
    try {
      var saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && I18N[saved]) lang = saved;
    } catch (e) {}
    return lang;
  }

  function saveLanguage(lang) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {}
  }

  function updateLanguageButtons() {
    [el.btnLangFr, el.btnLangEn, el.btnLangEs].forEach(function (btn) {
      if (!btn) return;
      btn.classList.remove("active");
    });
    if (currentLang === "fr" && el.btnLangFr) el.btnLangFr.classList.add("active");
    else if (currentLang === "es" && el.btnLangEs) el.btnLangEs.classList.add("active");
    else if (el.btnLangEn) el.btnLangEn.classList.add("active");
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    if (el.btnRefresh) {
      el.btnRefresh.textContent = t("refresh");
      el.btnRefresh.setAttribute("aria-label", t("refreshAria"));
      el.btnRefresh.setAttribute("title", t("refresh"));
    }
    if (el.labelCurrentTemp) el.labelCurrentTemp.textContent = t("labelCurrentTemperature");
    if (el.labelPresetAway) el.labelPresetAway.textContent = t("presetAway");
    if (el.labelPresetSleep) el.labelPresetSleep.textContent = t("presetSleep");
    if (el.labelPresetEco) el.labelPresetEco.textContent = t("presetEco");
    if (el.labelPresetComfort) el.labelPresetComfort.textContent = t("presetComfort");
    if (el.btnPresetAway) el.btnPresetAway.setAttribute("title", t("presetAway"));
    if (el.btnPresetSleep) el.btnPresetSleep.setAttribute("title", t("presetSleep"));
    if (el.btnPresetEco) el.btnPresetEco.setAttribute("title", t("presetEco"));
    if (el.btnPresetComfort) el.btnPresetComfort.setAttribute("title", t("presetComfort"));
    if (el.btnDown) el.btnDown.setAttribute("aria-label", t("ariaDecrease"));
    if (el.btnUp) el.btnUp.setAttribute("aria-label", t("ariaIncrease"));
    if (el.comfortMessage) el.comfortMessage.textContent = t("comfortMessage");

    updateLanguageButtons();
    rerenderStatusForLanguage();
    if (currentState) updateUI(currentState);
  }

  function setLanguage(lang) {
    if (!I18N[lang]) return;
    currentLang = lang;
    saveLanguage(lang);
    applyTranslations();
  }

  function refresh() {
    if (!token || token === "VOTRE_TOKEN_ICI") {
      setStatusTokenMissing();
      return;
    }
    loadState(function (err, state) {
      if (err) {
        setStatusErrorMessage(err.message);
        return;
      }
      setStatusConnected();
      updateUI(state);
    });
  }

  function setTemperature(newTemp, done) {
    apiRequest("POST", "/api/services/climate/set_temperature", {
      entity_id: entityId,
      temperature: newTemp
    }, function (err) {
      if (done) done(err);
      if (err) {
        setStatusErrorMessage(err.message);
      } else {
        refresh();
      }
    });
  }

  function setPresetMode(preset) {
    apiRequest("POST", "/api/services/climate/set_preset_mode", {
      entity_id: entityId,
      preset_mode: preset
    }, function (err) {
      if (err) {
        setStatusErrorMessage(err.message);
      } else {
        refresh();
      }
    });
  }

  function onUp() {
    if (!currentState || !currentState.attributes) return;
    var tValue = currentState.attributes.temperature;
    if (tValue == null) tValue = 20;
    var next = parseFloat(tValue, 10) + step;
    setTemperature(next);
  }

  function onDown() {
    if (!currentState || !currentState.attributes) return;
    var tValue = currentState.attributes.temperature;
    if (tValue == null) tValue = 20;
    var next = parseFloat(tValue, 10) - step;
    setTemperature(next);
  }

  el.btnRefresh.addEventListener("click", function () { window.location.reload(); });
  el.btnUp.addEventListener("click", onUp);
  el.btnDown.addEventListener("click", onDown);
  el.btnPresetAway.addEventListener("click", function () { setPresetMode("away"); });
  el.btnPresetComfort.addEventListener("click", function () { setPresetMode("comfort"); });
  el.btnPresetEco.addEventListener("click", function () { setPresetMode("eco"); });
  el.btnPresetSleep.addEventListener("click", function () { setPresetMode("sleep"); });

  if (el.btnLangFr) el.btnLangFr.addEventListener("click", function () { setLanguage("fr"); });
  if (el.btnLangEn) el.btnLangEn.addEventListener("click", function () { setLanguage("en"); });
  if (el.btnLangEs) el.btnLangEs.addEventListener("click", function () { setLanguage("es"); });

  currentLang = loadSavedLanguage();
  applyTranslations();
  setStatusLoading();
  refresh();
  refreshTimer = setInterval(refresh, refreshInterval);
})();
