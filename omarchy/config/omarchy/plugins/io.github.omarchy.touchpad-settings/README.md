# Omarchy Touchpad Settings

Local Quickshell bar widget for generic Hyprland/libinput touchpad options. It is intentionally unprivileged and hardware-independent.

## Settings

Sensitivity (`-1..1`, `.05` steps), scroll factor (`.1..2`, `.1` steps), natural scrolling, tap-to-click, clickfinger behavior, disable-while-typing, tap-and-drag, and middle-button emulation.

## Controller

`controller/touchpadctl` reads with `hyprctl getoption ... -j` and applies with `hyprctl keyword ...`. `apply` validates before any command, then atomically saves JSON at `$XDG_CONFIG_HOME/omarchy/touchpad-settings.json` (or `~/.config/...`, mode 0600). `restore` does nothing when no saved file exists; the panel invokes it at startup. No sudo, root, hidraw, or device-specific assumptions are used.

Commands:

```sh
controller/touchpadctl status --json
controller/touchpadctl restore --json
controller/touchpadctl apply --json '{"sensitivity":0,"scroll_factor":0.4,"natural_scroll":false,"tap_to_click":true,"clickfinger_behavior":true,"disable_while_typing":true,"tap_and_drag":true,"middle_button_emulation":false}'
```

## Validation

Run `bin/validate`. Tests use a fake `hyprctl` and never apply values to the live compositor. Install only after review with the normal Omarchy plugin workflow; this repository does not modify the active shell configuration.

Verified option names on this host are `input:sensitivity`, `input:touchpad:scroll_factor`, `input:touchpad:natural_scroll`, `input:touchpad:tap-to-click`, `input:touchpad:clickfinger_behavior`, `input:touchpad:disable_while_typing`, `input:touchpad:tap-and-drag`, and `input:touchpad:middle_button_emulation`.
