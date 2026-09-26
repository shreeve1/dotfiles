# ThinkPad Input

Omarchy bar plugin for the built-in input devices on this ThinkPad T14 Gen 5:

- ELAN touchpad: `elan0676:00-04f3:3195-touchpad`
- ELAN TrackPoint: `tpps/2-elan-trackpoint`

The controller intentionally requires both normalized Hyprland device names. It reports a clear error before changing anything if either device is absent; there is no device picker or generic hardware fallback.

## Use

Click the bar icon to open the panel. Changes remain staged in the panel until **Apply settings** is pressed. Right-click the bar icon to refresh from the controller.

The Touchpad section provides per-device pointer speed (`-1..1`, `0.05` steps), scroll speed (`0.1..2`, `0.1` steps), natural scrolling, tap-to-click, clickfinger behavior, disable-while-typing, tap-and-drag, and touchpad middle-click emulation.

The TrackPoint section provides its own per-device pointer speed (`-1..1`, `0.05` steps) and physical middle-button hold-to-scroll. Hold-to-scroll reserves the TrackPoint middle button for scrolling while the stick moves; turn it off for conventional middle clicks. This is separate from touchpad middle-click emulation, which combines the touchpad's left and right click actions into a middle click.

## Controller and state

`controller/touchpadctl` uses `hyprctl` without sudo. Pointer speeds are applied to the exact devices above with per-device Hyprland rules. TrackPoint hold-to-scroll selects the device's `on_button_down` scroll method when enabled and `no_scroll` when disabled. The plugin does not configure a scroll button, button lock, acceleration profile, kernel interface, or global scroll method.

Hyprland cannot read these per-device values back. The schema-2 state saved at `$XDG_CONFIG_HOME/omarchy/touchpad-settings.json` (or `~/.config/omarchy/touchpad-settings.json`) is therefore authoritative for both pointer speeds and TrackPoint hold-to-scroll. On the first status request without saved state, both pointer speeds start from the current global `input:sensitivity`, TrackPoint hold-to-scroll starts enabled, and the global touchpad options are read live.

Apply validates the complete settings object and both required devices before issuing any changes. It applies all Hyprland commands first, then atomically replaces the state file with mode `0600`; a failed apply never replaces the saved state. Startup restore reapplies saved settings and is a no-op until a state file exists.

Commands:

```sh
controller/touchpadctl status --json
controller/touchpadctl restore --json
controller/touchpadctl apply --json '{"touchpad_sensitivity":0,"scroll_factor":0.4,"natural_scroll":false,"tap_to_click":true,"clickfinger_behavior":true,"disable_while_typing":true,"tap_and_drag":true,"middle_button_emulation":false,"trackpoint_sensitivity":0,"trackpoint_middle_scroll":true}'
```

## Validation

Run `bin/validate` from this directory. The tests use a fake `hyprctl`; they verify command generation and persistence without changing the live compositor.

For a live check after installation, confirm that `hyprctl devices -j` contains both normalized names, open **ThinkPad Input**, move each of the three sliders and both middle-action toggles, and verify that nothing changes before **Apply settings**. Apply once, then reopen the panel (or right-click its bar icon) and confirm the saved values return. Test TrackPoint scrolling by holding its physical middle button while moving the stick; disable the setting and apply again to restore normal middle-click behavior.
