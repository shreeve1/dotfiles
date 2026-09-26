// Pure helpers and JSON validation shared by QML and tests.
var schemaVersion = 2;
var settingNames = [
  "touchpad_sensitivity",
  "scroll_factor",
  "natural_scroll",
  "tap_to_click",
  "clickfinger_behavior",
  "disable_while_typing",
  "tap_and_drag",
  "middle_button_emulation",
  "trackpoint_sensitivity",
  "trackpoint_middle_scroll"
];
var booleanNames = [
  "natural_scroll",
  "tap_to_click",
  "clickfinger_behavior",
  "disable_while_typing",
  "tap_and_drag",
  "middle_button_emulation",
  "trackpoint_middle_scroll"
];

function controllerPath(url) {
  return decodeURIComponent(String(url).replace(/^file:\/\//, ""));
}

function concise(value, fallback) {
  var text = String(value || "").replace(/\s+/g, " ").trim() || fallback;
  return text.length > 180 ? text.slice(0, 177) + "…" : text;
}

function validNumber(value, minimum, maximum, step) {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= minimum - 1e-9
    && value <= maximum + 1e-9
    && Math.abs(value / step - Math.round(value / step)) < 1e-7;
}

function validSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings))
    return false;
  var keys = Object.keys(settings).sort();
  var expected = settingNames.slice().sort();
  if (keys.length !== expected.length
      || !keys.every(function(key, index) { return key === expected[index]; }))
    return false;
  return validNumber(settings.touchpad_sensitivity, -1, 1, .05)
    && validNumber(settings.scroll_factor, .1, 2, .1)
    && validNumber(settings.trackpoint_sensitivity, -1, 1, .05)
    && booleanNames.every(function(key) {
      return typeof settings[key] === "boolean";
    });
}

function parseResponse(raw) {
  try {
    var payload = JSON.parse(String(raw || ""));
    if (!payload || payload.schemaVersion !== schemaVersion)
      return {ok: false, error: "Controller returned an unsupported response"};
    if (payload.ok !== true)
      return {ok: false, error: concise(payload.error, "Controller reported an error")};
    if (!validSettings(payload.settings))
      return {ok: false, error: "Controller returned invalid settings"};
    return {ok: true, payload: payload};
  } catch (error) {
    return {ok: false, error: "Controller returned invalid JSON"};
  }
}

function statusCommand(controller) {
  return [controller, "status", "--json"];
}

function restoreCommand(controller) {
  return [controller, "restore", "--json"];
}

function applyCommand(controller, settings) {
  if (!validSettings(settings))
    return {ok: false, error: "Invalid touchpad settings"};
  return {
    ok: true,
    command: [controller, "apply", "--json", JSON.stringify(settings)]
  };
}

if (typeof module !== "undefined")
  module.exports = {
    controllerPath,
    concise,
    validNumber,
    validSettings,
    parseResponse,
    statusCommand,
    restoreCommand,
    applyCommand
  };
