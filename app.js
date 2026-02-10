/**
 * Panneau thermostat — appels API Home Assistant
 * Compatible iOS 9 (XMLHttpRequest uniquement, pas de fetch)
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

  var el = {
    status: document.getElementById("status"),
    btnRefresh: document.getElementById("btnRefresh"),
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
    comfortMessage: document.getElementById("comfortMessage")
  };

  var currentState = null;
  var refreshTimer = null;

  function setStatus(text, className) {
    el.status.textContent = text;
    el.status.className = "status " + (className || "");
    el.btnRefresh.style.display = (className === "connected") ? "none" : "";
  }

  function formatTemp(value) {
    if (value == null || value === "") return "—";
    var n = parseFloat(value, 10);
    if (isNaN(n)) return "—";
    return n.toFixed(1) + " °C";
  }

  function formatTime(isoString) {
    if (!isoString) return "—";
    try {
      var d = new Date(isoString);
      return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
          msg += " Check the token in config.js (HA Profile → Create token) and that baseUrl points to Home Assistant.";
        }
        callback(new Error(msg), null);
      }
    };

    xhr.onerror = function () {
      callback(new Error("Network unavailable"), null);
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
    el.lastUpdate.textContent = "Last update: " + formatTime(state.last_updated);

    var modeState = (state.state || "").toLowerCase();
    el.modeLabel.textContent = modeState === "heat" ? "Heat" : (modeState === "off" ? "Off" : modeState || "—");

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

  function refresh() {
    if (!token || token === "VOTRE_TOKEN_ICI") {
      setStatus("Set the token in config.js (HA Profile → Create token)", "error");
      return;
    }
    loadState(function (err, state) {
      if (err) {
        setStatus("Error: " + err.message, "error");
        return;
      }
      setStatus("Connected", "connected");
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
        setStatus("Error: " + err.message, "error");
      } else {
        refresh();
      }
    });
  }

  function setHVACMode(mode, done) {
    apiRequest("POST", "/api/services/climate/set_hvac_mode", {
      entity_id: entityId,
      hvac_mode: mode
    }, function (err) {
      if (done) done(err);
      if (err) {
        setStatus("Error: " + err.message, "error");
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
        setStatus("Error: " + err.message, "error");
      } else {
        refresh();
      }
    });
  }

  function onUp() {
    if (!currentState || !currentState.attributes) return;
    var t = currentState.attributes.temperature;
    if (t == null) t = 20;
    var next = parseFloat(t, 10) + step;
    setTemperature(next);
  }

  function onDown() {
    if (!currentState || !currentState.attributes) return;
    var t = currentState.attributes.temperature;
    if (t == null) t = 20;
    var next = parseFloat(t, 10) - step;
    setTemperature(next);
  }

  el.btnRefresh.addEventListener("click", function () { window.location.reload(); });

  el.btnUp.addEventListener("click", onUp);
  el.btnDown.addEventListener("click", onDown);
  el.btnPresetAway.addEventListener("click", function () { setPresetMode("away"); });
  el.btnPresetComfort.addEventListener("click", function () { setPresetMode("comfort"); });
  el.btnPresetEco.addEventListener("click", function () { setPresetMode("eco"); });
  el.btnPresetSleep.addEventListener("click", function () { setPresetMode("sleep"); });

  refresh();
  refreshTimer = setInterval(refresh, refreshInterval);
})();
