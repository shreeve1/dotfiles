#!/usr/bin/env python3
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

tests = Path(__file__).resolve().parent
extension = tests.parent
with tempfile.TemporaryDirectory(prefix="keystroke-hermes-acp-") as temp:
    work = Path(temp)
    shutil.copy2(extension / "AcpSession.qml", work / "AcpSession.qml")
    shutil.copy2(tests / "fake_acp.py", work / "fake_acp.py")
    shutil.copy2(tests / "session_harness.qml", work / "shell.qml")
    (work / "fake_acp.py").chmod(0o755)
    (work / "qs").symlink_to("/usr/share/omarchy/shell")
    env = dict(
        os.environ,
        QT_QPA_PLATFORM="offscreen",
        QT_QPA_PLATFORMTHEME="generic",
        QT_QUICK_BACKEND="software",
        QML_IMPORT_PATH=str(work),
    )
    env.pop("DISPLAY", None)
    env.pop("WAYLAND_DISPLAY", None)
    result = subprocess.run(
        ["quickshell", "-p", str(work / "shell.qml")],
        env=env,
        capture_output=True,
        text=True,
        timeout=25,
    )
    output = result.stdout + result.stderr
assert "PASS Hermes ACP session" in output and "FAIL" not in output, output
print("PASS Hermes ACP session: streaming, tool updates, permission response and recent-session listing")
