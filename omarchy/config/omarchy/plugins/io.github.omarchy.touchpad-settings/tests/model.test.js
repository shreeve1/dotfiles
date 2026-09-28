const test = require("node:test");
const assert = require("node:assert/strict");
const Model = require("../Model.js");

const controller = "/tmp/touchpadctl";
const baseSettings = {
  touchpad_sensitivity: 0.15,
  scroll_factor: 0.4,
  natural_scroll: false,
  tap_to_click: true,
  clickfinger_behavior: true,
  disable_while_typing: true,
  tap_and_drag: true,
  middle_button_emulation: false,
  trackpoint_sensitivity: -0.25,
  trackpoint_middle_scroll: true
};

function settings(changes = {}) {
  return {...baseSettings, ...changes};
}

test("builds schema-2 commands with the exact settings shape", () => {
  const value = settings();
  assert.deepEqual(Model.statusCommand(controller), [
    controller,
    "status",
    "--json"
  ]);
  assert.deepEqual(Model.restoreCommand(controller), [
    controller,
    "restore",
    "--json"
  ]);
  assert.deepEqual(Model.applyCommand(controller, value), {
    ok: true,
    command: [controller, "apply", "--json", JSON.stringify(value)]
  });
});

test("validates all numeric ranges, steps, and primitive types", () => {
  assert.equal(Model.validSettings(settings({
    touchpad_sensitivity: -1,
    scroll_factor: 0.1,
    trackpoint_sensitivity: 1
  })), true);
  assert.equal(Model.validSettings(settings({
    touchpad_sensitivity: 1,
    scroll_factor: 2,
    trackpoint_sensitivity: -1
  })), true);
  assert.equal(Model.validSettings(settings({touchpad_sensitivity: 1.01})), false);
  assert.equal(Model.validSettings(settings({trackpoint_sensitivity: -1.01})), false);
  assert.equal(Model.validSettings(settings({scroll_factor: 0.15})), false);
  assert.equal(Model.validSettings(settings({touchpad_sensitivity: "0.15"})), false);
  assert.equal(Model.validSettings(settings({tap_to_click: 1})), false);
  assert.equal(Model.validSettings(settings({trackpoint_middle_scroll: 1})), false);
});

test("rejects missing and additional schema fields", () => {
  const missing = settings();
  delete missing.trackpoint_sensitivity;
  assert.equal(Model.validSettings(missing), false);
  assert.equal(Model.validSettings(settings({unexpected: true})), false);
  assert.equal(Model.validSettings([]), false);
  assert.equal(Model.applyCommand(controller, missing).ok, false);
});

test("parses only stable schema-2 success responses", () => {
  const value = settings();
  const parsed = Model.parseResponse(JSON.stringify({
    schemaVersion: 2,
    ok: true,
    settings: value
  }));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.payload.settings, value);
  assert.deepEqual(
    Model.parseResponse(JSON.stringify({
      schemaVersion: 1,
      ok: true,
      settings: value
    })),
    {ok: false, error: "Controller returned an unsupported response"}
  );
  assert.deepEqual(
    Model.parseResponse(JSON.stringify({
      schemaVersion: 2,
      ok: true,
      settings: settings({trackpoint_sensitivity: 0.03})
    })),
    {ok: false, error: "Controller returned invalid settings"}
  );
  assert.deepEqual(
    Model.parseResponse("not json"),
    {ok: false, error: "Controller returned invalid JSON"}
  );
});

test("extracts concise schema-2 controller failures", () => {
  const parsed = Model.parseResponse(JSON.stringify({
    schemaVersion: 2,
    ok: false,
    error: "required TrackPoint device not found"
  }));
  assert.deepEqual(parsed, {
    ok: false,
    error: "required TrackPoint device not found"
  });
});
