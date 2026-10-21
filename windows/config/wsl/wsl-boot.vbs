' Startup-folder keepalive for WSL (setup-new-machine.md Phase 2).
' Copy to shell:startup and replace <user>. Holds a hidden session so the
' distro and its systemd services (sshd, herdr) don't idle-stop.
CreateObject("WScript.Shell").Run "wsl.exe -d Ubuntu-24.04 -u <user> -e sleep infinity", 0, False
