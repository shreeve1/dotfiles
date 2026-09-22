"""Voice I/O: bounded Hermes VAD turns, continuous Listen/Stop, and streaming TTS.

Reuses Hermes' own pipeline (hermes_cli.voice, tools.tts_tool) so STT/TTS
provider, voice and model config come from ~/.hermes/config.yaml.
"""
from __future__ import annotations

import logging
import os
import sys
import threading
import time
from pathlib import Path
from typing import Callable

HERMES_ROOT = Path(os.environ.get("HERMES_AGENT_DIR", Path.home() / ".hermes/hermes-agent"))
sys.path.insert(0, str(HERMES_ROOT))

log = logging.getLogger("companion.voice")


class Voice:
    def __init__(
        self,
        on_request: Callable[[str], None],
        on_status: Callable[[str], None],
        on_listening: Callable[[bool], None] | None = None,
        silence_duration: float = 1.6,
        max_utterance_seconds: float = 30.0,
    ):
        self.on_request = on_request
        self.on_status = on_status
        self.on_listening = on_listening or (lambda _active: None)
        self.silence_duration = silence_duration
        self.max_utterance_seconds = max_utterance_seconds
        self._speaking = threading.Event()
        self._stop_speech = threading.Event()
        self._capturing = threading.Event()
        self._listening = threading.Event()
        self._stop_listening = threading.Event()
        self._capture_wake = threading.Event()
        self._listener_ready = threading.Event()
        self._listener_start_ok = False
        self._listener_thread: threading.Thread | None = None
        self._listener_lock = threading.Lock()

        # Warm the STT model so the first request isn't slow.
        threading.Thread(target=self._warm_stt, daemon=True).start()

    @staticmethod
    def _warm_stt():
        try:
            import tempfile
            import wave

            from tools.transcription_tools import transcribe_audio

            p = tempfile.mktemp(suffix=".wav")
            with wave.open(p, "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b"\x00\x00" * 16000)
            transcribe_audio(p)
            os.unlink(p)
            log.info("STT warmed")
        except Exception:
            log.debug("STT warm-up skipped", exc_info=True)

    @property
    def capturing(self) -> bool:
        return self._capturing.is_set()

    @property
    def listening(self) -> bool:
        return self._listening.is_set()

    def hush(self):
        """Interrupt any current speech."""
        self._stop_speech.set()

    # ---------------------------------------------------------------- listen
    def listen_for(self, timeout: float, parse):
        """Capture one short utterance and return parse(transcript) (None on silence/timeout).
        Used for yes/no approvals; does not go to the agent."""
        with self._listener_lock:
            if self._capturing.is_set() or self._listening.is_set():
                return None
            self._capturing.set()
        got: list[str] = []
        done = threading.Event()
        hv = None
        try:
            from hermes_cli import voice as hv

            ok = hv.start_continuous(on_transcript=lambda t: (got.append(t), done.set()), on_status=lambda s: None,
                                     on_silent_limit=done.set, silence_duration=1.0, auto_restart=False,
                                     max_recording_seconds=min(8.0, timeout))
            if not ok:
                return None
            done.wait(timeout=timeout)
        finally:
            if hv is not None:
                try:
                    hv.stop_continuous()
                except Exception:
                    pass
                self._release_recorder(hv)
            self._capturing.clear()
        return parse(" ".join(got))

    def listen(self) -> bool:
        """Start continuous microphone capture until :meth:`stop_listening` is called."""
        with self._listener_lock:
            if self._listening.is_set() or self._capturing.is_set():
                return False
            if self._speaking.is_set():
                self.hush()
                time.sleep(0.3)
            self._stop_listening.clear()
            self._capture_wake.clear()
            self._listener_ready.clear()
            self._listener_start_ok = False
            self._listening.set()
            self._listener_thread = threading.Thread(
                target=self._capture_continuous, daemon=True, name="companion-listen"
            )
            self._listener_thread.start()
        if not self._listener_ready.wait(timeout=10):
            log.error("continuous listener did not finish starting")
            self.stop_listening()
            return False
        return self._listener_start_ok

    def stop_listening(self) -> bool:
        """Stop continuous capture and let Hermes flush its bounded final utterance."""
        if not self._listening.is_set():
            return False
        self._stop_listening.set()
        self._capture_wake.set()
        try:
            from hermes_cli import voice as hv
            hv.stop_continuous(force_transcribe=True)
        except Exception:
            log.debug("continuous stop", exc_info=True)
        return True

    def shutdown(self, timeout: float = 45.0):
        """Stop capture, flush the final utterance, and wait briefly for cleanup."""
        self.stop_listening()
        thread = self._listener_thread
        if thread and thread is not threading.current_thread():
            thread.join(timeout=timeout)

    def _capture_continuous(self):
        hv = None
        try:
            from hermes_cli import voice as hv

            while not self._stop_listening.is_set():
                rearm = threading.Event()
                def on_transcript(text: str):
                    if text and text.strip():
                        # Keep one bounded turn in flight. This intentionally pauses recording
                        # while Coding answers; Meeting uses the same non-overlapping callback.
                        self._deliver(text)
                def on_status(status: str):
                    if status == "transcribing":
                        self.on_status("thinking")
                    elif status in ("listening", "recording") and self._listening.is_set():
                        self.on_status("listening")
                    elif status == "idle":
                        self._capture_wake.set()
                def on_silent_limit(*_):
                    # Hermes intentionally stops after a few empty cycles. Re-arm while the user
                    # still wants Listen, so Listen remains an explicit persistent session.
                    rearm.set()
                def on_stop_phrase(*_):
                    self._stop_listening.set()
                ok = hv.start_continuous(on_transcript=on_transcript, on_status=on_status,
                    on_silent_limit=on_silent_limit, on_stop_phrase=on_stop_phrase,
                    silence_duration=self.silence_duration,
                    auto_restart=True, max_recording_seconds=self.max_utterance_seconds)
                if not ok:
                    self.on_status("error")
                    self._listener_ready.set()
                    break
                if not self._listener_start_ok:
                    self._listener_start_ok = True
                    self.on_listening(True)
                    self._listener_ready.set()
                self._capture_wake.wait()
                self._capture_wake.clear()
                if self._stop_listening.is_set():
                    break
                if not rearm.is_set():
                    log.warning("continuous listener became idle unexpectedly")
                    break
        except Exception:
            log.exception("continuous capture")
            self.on_status("error")
        finally:
            self._listener_ready.set()
            if hv is not None:
                try:
                    hv.stop_continuous()
                except Exception:
                    pass
                self._release_recorder(hv)
            self._listening.clear()
            self.on_listening(False)
            self.on_status("watching")

    def _deliver(self, text: str):
        try:
            self.on_request(text.strip())
        except Exception:
            log.exception("continuous transcript callback")

    def _capture_turn(self):
        from hermes_cli import voice as hv

        self._capturing.set()
        self.on_status("listening-request")
        hv._play_beep(880, 1)
        done = threading.Event()
        transcript: list[str] = []

        def on_transcript(text: str):
            transcript.append(text)
            done.set()

        def on_status(s: str):
            if s == "transcribing":
                self.on_status("thinking")

        try:
            ok = hv.start_continuous(
                on_transcript=on_transcript,
                on_status=on_status,
                on_silent_limit=done.set,
                silence_duration=self.silence_duration,
                auto_restart=False,
                max_recording_seconds=self.max_utterance_seconds,
            )
            if not ok:
                log.warning("start_continuous refused (busy)")
                done.set()
            done.wait(timeout=self.max_utterance_seconds + 15)
            try:
                hv.stop_continuous()
            except Exception:
                pass
            self._release_recorder(hv)
        finally:
            self._capturing.clear()
        text = " ".join(t.strip() for t in transcript if t and t.strip()).strip()
        if text:
            log.info("voice request: %r", text)
            try:
                self.on_request(text)
            except Exception:
                log.exception("on_request")
        else:
            hv._play_beep(440, 1)
            self.on_status("watching")

    @staticmethod
    def _release_recorder(hv):
        """Hermes keeps the recorder's InputStream open for reuse; a daemon should free the mic."""
        deadline = time.time() + 10
        while getattr(hv, "_continuous_stopping", False) and time.time() < deadline:
            time.sleep(0.05)
        rec = getattr(hv, "_continuous_recorder", None)
        if rec is None:
            return
        try:
            rec.shutdown()
        except Exception:
            log.exception("recorder shutdown")
        hv._continuous_recorder = None

    # ---------------------------------------------------------------- speak
    def speak(self, text: str):
        """Blocking; streams TTS sentence by sentence."""
        if not text or not text.strip():
            return
        from hermes_cli import voice as hv

        self._stop_speech.clear()
        self._speaking.set()
        try:
            self.on_status("speaking")
            hv.speak_text(text, stop_event=self._stop_speech)
        except Exception:
            log.exception("speak")
        finally:
            self._speaking.clear()
            self.on_status("watching")
