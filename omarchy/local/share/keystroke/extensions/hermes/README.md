# Hermes for Keystroke

A private Keystroke extension that embeds Hermes Agent through the Agent Client
Protocol (ACP). It streams answers and tool activity, supports follow-ups,
cancellation, saved-session resume, voice composition, and interactive approval
requests without modifying Keystroke's bundled Codex provider.

## Requirements

- Keystroke 1.4.4 or newer
- Hermes Agent with ACP support (`hermes acp --check`)
- `hermes` available to the login shell, or an absolute command configured in
  Keystroke Settings → Hermes → Hermes command

## Usage

Enable the local extension under Keystroke → Extensions → Hermes. Type `?` plus
a prompt, or open the Hermes screen to start or resume a conversation. Settings
control the working folder, optional ACP model override, and edit-approval mode.

The extension starts one local `hermes acp` subprocess. ACP uses newline-delimited
JSON-RPC over stdio; prompts and responses do not pass through the clipboard.
Hermes retains session history in its normal session database. Disabling the
extension or restarting the shell stops the subprocess.
