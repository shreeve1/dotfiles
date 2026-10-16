#!/usr/bin/env python3

import os
import re
import sys
import urllib.parse

_BAD_ESCAPE = re.compile(r"%(?![0-9A-Fa-f]{2})")


def reject(reason, code=2):
    sys.stderr.write("agent-open-link: " + reason + "\n")
    sys.exit(code)


def main():
    if len(sys.argv) > 2:
        reject("expected at most one URL argument")
    raw = sys.argv[1] if len(sys.argv) == 2 else os.environ.get("HERDR_PLUGIN_CLICKED_URL", "")
    if raw == "":
        reject("missing URL")

    for ch in raw:
        if ch <= "\x1f" or ch == "\x7f":
            reject("invalid control character in URL")

    try:
        parts = urllib.parse.urlsplit(raw)
    except ValueError:
        reject("malformed URL")

    if parts.scheme not in ("agent-open", "file"):
        reject("expected an agent-open:// or file:// URL")

    if parts.netloc.lower() not in ("", "localhost"):
        reject("nonlocal authority: " + repr(parts.netloc))

    encoded_path = parts.path
    if encoded_path == "" or not encoded_path.startswith("/"):
        reject("URL requires an absolute path")

    if _BAD_ESCAPE.search(encoded_path):
        reject("invalid percent escape in URL path")

    try:
        path = urllib.parse.unquote_to_bytes(encoded_path).decode("utf-8", "strict")
    except UnicodeError:
        reject("URL path is not valid UTF-8")

    if "\x00" in path:
        reject("NUL is not a filesystem path character")

    try:
        os.stat(path)
    except OSError as error:
        reason = error.strerror if error.strerror else str(error)
        reject("cannot access target " + repr(path) + ": " + reason, 1)

    home = os.environ.get("HOME", "")
    if home == "":
        reject("HOME is missing; cannot locate the existing agent-open", 1)

    opener = home + "/dotfiles/omarchy/bin/agent-open"
    try:
        os.execv(opener, [opener, path])
    except OSError as error:
        reason = error.strerror if error.strerror else str(error)
        reject("cannot execute existing agent-open: " + reason, 1)


if __name__ == "__main__":
    main()
