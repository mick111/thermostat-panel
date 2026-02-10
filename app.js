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
  var PRESET_TEMPERATURES = {
    away: 17,
    eco: 19,
    comfort: 20,
    activity: 21
  };
  var RING_COLORS_SOFT = {
    away: "#d7ccc8",
    eco: "#c8e6c9",
    comfort: "#bbdefb",
    activity: "#ffe0b2",
    over: "#ffcdd2"
  };
  var RING_COLORS_STRONG = {
    away: "#6d4c41",
    eco: "#388e3c",
    comfort: "#1976d2",
    activity: "#ef6c00",
    over: "#c62828"
  };
  var LANG_STORAGE_KEY = "thermostat-panel-lang";
  var UNIT_STORAGE_KEY = "thermostat-panel-unit";

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
      presetActivity: "Comfort+",
      presetEco: "Eco",
      presetComfort: "Comfort",
      ariaDecrease: "Decrease",
      ariaIncrease: "Increase",
      unitToggleAria: "Toggle temperature unit",
      unitToggleTitle: "Switch between Celsius and Fahrenheit",
      comfortMessageLine1: "Significant environmental impact",
      comfortMessageLine2: "Let's think about our planet"
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
      presetAway: "Départ",
      presetActivity: "Confort+",
      presetEco: "Éco",
      presetComfort: "Confort",
      ariaDecrease: "Baisser",
      ariaIncrease: "Monter",
      unitToggleAria: "Basculer l'unité de température",
      unitToggleTitle: "Basculer entre Celsius et Fahrenheit",
      comfortMessageLine1: "Impact environnemental important",
      comfortMessageLine2: "Pensons à notre planète"
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
      presetAway: "Salida",
      presetActivity: "Confort+",
      presetEco: "Eco",
      presetComfort: "Confort",
      ariaDecrease: "Bajar",
      ariaIncrease: "Subir",
      unitToggleAria: "Cambiar unidad de temperatura",
      unitToggleTitle: "Alternar entre Celsius y Fahrenheit",
      comfortMessageLine1: "Impacto ambiental importante",
      comfortMessageLine2: "Pensemos en nuestro planeta"
    },
    zh: {
      refresh: "刷新",
      refreshAria: "刷新页面",
      statusLoading: "加载中…",
      statusConnected: "已连接",
      statusErrorPrefix: "错误：",
      statusTokenMissing: "请在 config.js 中设置令牌（HA 个人资料 → 创建令牌）",
      error401Hint: " 请检查 config.js 中的令牌（HA 个人资料 → 创建令牌），并确认 baseUrl 指向 Home Assistant。",
      networkUnavailable: "网络不可用",
      labelCurrentTemperature: "当前温度",
      lastUpdatePrefix: "最后更新：",
      modeHeating: "加热中",
      modeIdle: "待机",
      modeOff: "关闭",
      modeHeat: "加热",
      presetAway: "外出",
      presetActivity: "舒适+",
      presetEco: "节能",
      presetComfort: "舒适",
      ariaDecrease: "降低",
      ariaIncrease: "升高",
      unitToggleAria: "切换温度单位",
      unitToggleTitle: "在摄氏度和华氏度之间切换",
      comfortMessageLine1: "环境影响重大",
      comfortMessageLine2: "让我们一起关心我们的地球"
    }
  };

  var el = {
    status: document.getElementById("status"),
    btnRefresh: document.getElementById("btnRefresh"),
    btnUnitToggle: document.getElementById("btnUnitToggle"),
    btnLangFr: document.getElementById("btnLangFr"),
    btnLangEn: document.getElementById("btnLangEn"),
    btnLangEs: document.getElementById("btnLangEs"),
    btnLangZh: document.getElementById("btnLangZh"),
    labelCurrentTemp: document.getElementById("labelCurrentTemp"),
    currentTemp: document.getElementById("currentTemp"),
    targetTemp: document.getElementById("targetTemp"),
    lastUpdate: document.getElementById("lastUpdate"),
    btnUp: document.getElementById("btnUp"),
    btnDown: document.getElementById("btnDown"),
    modeLabel: document.getElementById("modeLabel"),
    dialTrackPath: document.getElementById("dialTrackPath"),
    dialFillSoftPath: document.getElementById("dialFillSoftPath"),
    dialFillStrongPath: document.getElementById("dialFillStrongPath"),
    dialCurrentDot: document.getElementById("dialCurrentDot"),
    btnPresetAway: document.getElementById("btnPresetAway"),
    btnPresetActivity: document.getElementById("btnPresetActivity"),
    btnPresetEco: document.getElementById("btnPresetEco"),
    btnPresetComfort: document.getElementById("btnPresetComfort"),
    labelPresetAway: document.getElementById("labelPresetAway"),
    labelPresetActivity: document.getElementById("labelPresetActivity"),
    labelPresetEco: document.getElementById("labelPresetEco"),
    labelPresetComfort: document.getElementById("labelPresetComfort"),
    comfortMessage: document.getElementById("comfortMessage"),
    comfortMessageLine1: document.getElementById("comfortMessageLine1"),
    comfortMessageLine2: document.getElementById("comfortMessageLine2")
  };

  var currentState = null;
  var refreshTimer = null;
  var currentLang = "en";
  var displayUnit = "C";
  var backendTempUnit = "C";
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
    if (currentLang === "zh") return "zh-CN";
    return "en-US";
  }

  function normalizeTemperatureUnit(unit) {
    var u = String(unit || "").toUpperCase();
    if (u.indexOf("F") !== -1) return "F";
    return "C";
  }

  function convertTemperature(value, fromUnit, toUnit) {
    var from = normalizeTemperatureUnit(fromUnit);
    var to = normalizeTemperatureUnit(toUnit);
    if (from === to) return value;
    if (from === "C" && to === "F") return (value * 9 / 5) + 32;
    return (value - 32) * 5 / 9;
  }

  function roundToHalf(value) {
    return Math.round(value * 2) / 2;
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

  function formatTemp(value, sourceUnit, options) {
    if (value == null || value === "") return "—";
    var n = parseFloat(value, 10);
    if (isNaN(n)) return "—";
    var converted = convertTemperature(n, sourceUnit || backendTempUnit, displayUnit);
    if (options && options.roundHalfInF && displayUnit === "F") {
      converted = roundToHalf(converted);
    }
    var temp = converted.toFixed(1);
    if (currentLang !== "en") temp = temp.replace(".", ",");
    return temp + "°" + displayUnit;
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

  function describeArcBetween(startDeg, endDeg, radius) {
    var start = polarToCartesian(startDeg, radius);
    if (startDeg === endDeg) {
      return "M " + start.x + " " + start.y;
    }
    var end = polarToCartesian(endDeg, radius);
    var delta = endDeg - startDeg;
    var absDelta = Math.abs(delta);
    var largeArcFlag = absDelta > 180 ? 1 : 0;
    var sweepFlag = delta >= 0 ? 1 : 0;
    return "M " + start.x + " " + start.y +
      " A " + radius + " " + radius + " 0 " + largeArcFlag + " " + sweepFlag + " " + end.x + " " + end.y;
  }

  function modeFromTargetTemperature(targetNum) {
    if (targetNum > PRESET_TEMPERATURES.activity) return "over";
    if (targetNum > PRESET_TEMPERATURES.comfort) return "activity";
    if (targetNum > PRESET_TEMPERATURES.eco) return "comfort";
    if (targetNum > PRESET_TEMPERATURES.away) return "eco";
    return "away";
  }

  function clampBetween(value, min, max) {
    var out = value;
    if (min != null && !isNaN(min) && out < min) out = min;
    if (max != null && !isNaN(max) && out > max) out = max;
    return out;
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
      } catch (e) { }

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
    var tempUnit = normalizeTemperatureUnit(attrs.temperature_unit || attrs.unit_of_measurement);
    backendTempUnit = tempUnit;
    var current = attrs.current_temperature != null ? attrs.current_temperature : attrs.temperature;
    var target = attrs.temperature;

    el.currentTemp.textContent = formatTemp(current, tempUnit);
    el.targetTemp.textContent = formatTemp(target, tempUnit, { roundHalfInF: true });
    el.lastUpdate.textContent = t("lastUpdatePrefix") + formatTime(state.last_updated);

    var modeState = (state.state || "").toLowerCase();
    var hvacAction = (attrs.hvac_action || "").toLowerCase();
    el.modeLabel.className = "dial-mode";
    if (hvacAction === "heating") el.modeLabel.textContent = t("modeHeating");
    else if (hvacAction === "idle") {
      el.modeLabel.textContent = t("modeIdle");
      el.modeLabel.className += " dial-mode-idle";
    }
    else if (hvacAction === "off") el.modeLabel.textContent = t("modeOff");
    else if (modeState === "heat") el.modeLabel.textContent = t("modeHeat");
    else if (modeState === "off") el.modeLabel.textContent = t("modeOff");
    else el.modeLabel.textContent = modeState || "—";

    var minT = attrs.min_temp != null ? parseFloat(attrs.min_temp, 10) : 5;
    var maxT = attrs.max_temp != null ? parseFloat(attrs.max_temp, 10) : 35;
    var targetNum = target != null ? parseFloat(target, 10) : minT;
    var currentNum = current != null ? parseFloat(current, 10) : targetNum;
    if (isNaN(currentNum)) currentNum = targetNum;
    var targetRatio = maxT > minT ? clamp01((targetNum - minT) / (maxT - minT)) : 0;
    var currentRatio = maxT > minT ? clamp01((currentNum - minT) / (maxT - minT)) : 0;
    var targetDelta = targetRatio * ARC_SPAN_DEG;
    var currentDelta = currentRatio * ARC_SPAN_DEG;
    var isTargetAboveCurrent = targetNum > currentNum;
    var visibleTargetDelta = targetRatio <= 0 ? 0.75 : targetDelta;
    var visibleCurrentDelta = currentRatio <= 0 ? 0.75 : currentDelta;
    var currentDeg = ARC_START_DEG + currentDelta;
    var targetDeg = ARC_START_DEG + targetDelta;
    el.dialTrackPath.setAttribute("d", describeArc(ARC_START_DEG, ARC_SPAN_DEG, ARC_RADIUS));
    if (isTargetAboveCurrent) {
      el.dialFillSoftPath.setAttribute("d", describeArc(ARC_START_DEG, visibleCurrentDelta, ARC_RADIUS));
      el.dialFillStrongPath.setAttribute("d", describeArcBetween(currentDeg, targetDeg, ARC_RADIUS));
      el.dialFillStrongPath.removeAttribute("display");
    } else {
      el.dialFillSoftPath.setAttribute("d", describeArc(ARC_START_DEG, visibleTargetDelta, ARC_RADIUS));
      el.dialFillStrongPath.setAttribute("d", "M 50 50");
      el.dialFillStrongPath.setAttribute("display", "none");
    }
    var targetNumC = convertTemperature(targetNum, tempUnit, "C");
    var ringMode = modeFromTargetTemperature(targetNumC);
    el.dialFillSoftPath.setAttribute("stroke", RING_COLORS_SOFT[ringMode] || RING_COLORS_SOFT.comfort);
    el.dialFillStrongPath.setAttribute("stroke", RING_COLORS_STRONG[ringMode] || RING_COLORS_STRONG.comfort);

    var currentAngle = ARC_START_DEG + currentRatio * ARC_SPAN_DEG;
    var currentPoint = polarToCartesian(currentAngle, ARC_RADIUS);
    el.dialCurrentDot.setAttribute("cx", currentPoint.x);
    el.dialCurrentDot.setAttribute("cy", currentPoint.y);

    var targetBand = ringMode;
    [el.btnPresetAway, el.btnPresetActivity, el.btnPresetEco, el.btnPresetComfort].forEach(function (btn) {
      btn.classList.remove("active");
    });
    if (targetBand === "away") el.btnPresetAway.classList.add("active");
    else if (targetBand === "eco") el.btnPresetEco.classList.add("active");
    else if (targetBand === "comfort") el.btnPresetComfort.classList.add("active");
    else if (targetBand === "activity") el.btnPresetActivity.classList.add("active");

    el.comfortMessage.style.display = targetBand === "over" ? "" : "none";

    el.btnUp.disabled = target != null && parseFloat(target, 10) >= maxT;
    el.btnDown.disabled = target != null && parseFloat(target, 10) <= minT;
  }

  function loadSavedLanguage() {
    var lang = "en";
    try {
      var saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && I18N[saved]) lang = saved;
    } catch (e) { }
    return lang;
  }

  function loadSavedUnit() {
    var unit = "C";
    try {
      var saved = localStorage.getItem(UNIT_STORAGE_KEY);
      if (saved === "C" || saved === "F") unit = saved;
    } catch (e) { }
    return unit;
  }

  function saveLanguage(lang) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) { }
  }

  function saveUnit(unit) {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch (e) { }
  }

  function updateLanguageButtons() {
    [el.btnLangFr, el.btnLangEn, el.btnLangEs, el.btnLangZh].forEach(function (btn) {
      if (!btn) return;
      btn.classList.remove("active");
    });
    if (currentLang === "fr" && el.btnLangFr) el.btnLangFr.classList.add("active");
    else if (currentLang === "es" && el.btnLangEs) el.btnLangEs.classList.add("active");
    else if (currentLang === "zh" && el.btnLangZh) el.btnLangZh.classList.add("active");
    else if (el.btnLangEn) el.btnLangEn.classList.add("active");
  }

  function updateUnitToggleButton() {
    if (!el.btnUnitToggle) return;
    el.btnUnitToggle.textContent = "°" + displayUnit;
    if (displayUnit === "F") el.btnUnitToggle.classList.add("active");
    else el.btnUnitToggle.classList.remove("active");
  }

  function toggleTemperatureUnit() {
    displayUnit = displayUnit === "F" ? "C" : "F";
    saveUnit(displayUnit);
    updateUnitToggleButton();
    if (currentState) updateUI(currentState);
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
    if (el.labelPresetActivity) el.labelPresetActivity.textContent = t("presetActivity");
    if (el.labelPresetEco) el.labelPresetEco.textContent = t("presetEco");
    if (el.labelPresetComfort) el.labelPresetComfort.textContent = t("presetComfort");
    if (el.btnPresetAway) el.btnPresetAway.setAttribute("title", t("presetAway"));
    if (el.btnPresetActivity) el.btnPresetActivity.setAttribute("title", t("presetActivity"));
    if (el.btnPresetEco) el.btnPresetEco.setAttribute("title", t("presetEco"));
    if (el.btnPresetComfort) el.btnPresetComfort.setAttribute("title", t("presetComfort"));
    if (el.btnDown) el.btnDown.setAttribute("aria-label", t("ariaDecrease"));
    if (el.btnUp) el.btnUp.setAttribute("aria-label", t("ariaIncrease"));
    if (el.btnUnitToggle) {
      el.btnUnitToggle.setAttribute("aria-label", t("unitToggleAria"));
      el.btnUnitToggle.setAttribute("title", t("unitToggleTitle"));
    }
    if (el.comfortMessageLine1) el.comfortMessageLine1.textContent = t("comfortMessageLine1");
    if (el.comfortMessageLine2) el.comfortMessageLine2.textContent = t("comfortMessageLine2");

    updateUnitToggleButton();
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

  function adjustTarget(deltaInDisplayUnit) {
    if (!currentState || !currentState.attributes) return;
    var attrs = currentState.attributes;
    var sourceUnit = normalizeTemperatureUnit(attrs.temperature_unit || attrs.unit_of_measurement || backendTempUnit);
    var minT = attrs.min_temp != null ? parseFloat(attrs.min_temp, 10) : null;
    var maxT = attrs.max_temp != null ? parseFloat(attrs.max_temp, 10) : null;
    var tValue = attrs.temperature;
    if (tValue == null) tValue = sourceUnit === "F" ? 68 : 20;
    var currentTarget = parseFloat(tValue, 10);
    if (isNaN(currentTarget)) currentTarget = sourceUnit === "F" ? 68 : 20;
    var currentInDisplayUnit = convertTemperature(currentTarget, sourceUnit, displayUnit);
    var nextInDisplayUnit = currentInDisplayUnit + deltaInDisplayUnit;
    var nextInSourceUnit = convertTemperature(nextInDisplayUnit, displayUnit, sourceUnit);
    nextInSourceUnit = clampBetween(nextInSourceUnit, minT, maxT);
    setTemperature(parseFloat(nextInSourceUnit.toFixed(2)));
  }

  function onUp() {
    adjustTarget(step);
  }

  function onDown() {
    adjustTarget(-step);
  }

  el.btnRefresh.addEventListener("click", function () { window.location.reload(); });
  el.btnUp.addEventListener("click", onUp);
  el.btnDown.addEventListener("click", onDown);
  if (el.btnUnitToggle) el.btnUnitToggle.addEventListener("click", toggleTemperatureUnit);
  el.btnPresetAway.addEventListener("click", function () { setPresetMode("away"); });
  el.btnPresetComfort.addEventListener("click", function () { setPresetMode("comfort"); });
  el.btnPresetEco.addEventListener("click", function () { setPresetMode("eco"); });
  el.btnPresetActivity.addEventListener("click", function () { setPresetMode("activity"); });

  // Kiosk fallback for older iOS: block elastic vertical scroll.
  document.addEventListener("touchmove", function (evt) {
    evt.preventDefault();
  }, { passive: false });

  if (el.btnLangFr) el.btnLangFr.addEventListener("click", function () { setLanguage("fr"); });
  if (el.btnLangEn) el.btnLangEn.addEventListener("click", function () { setLanguage("en"); });
  if (el.btnLangEs) el.btnLangEs.addEventListener("click", function () { setLanguage("es"); });
  if (el.btnLangZh) el.btnLangZh.addEventListener("click", function () { setLanguage("zh"); });

  currentLang = loadSavedLanguage();
  displayUnit = loadSavedUnit();
  applyTranslations();
  setStatusLoading();
  refresh();
  refreshTimer = setInterval(refresh, refreshInterval);
})();
