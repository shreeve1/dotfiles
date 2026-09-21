"""Explicit Companion profiles and their non-audio policies."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Profile:
    name: str
    prompt: str
    eyes: bool
    speech: bool
    proactive: bool


PROFILES = {
    "Coding": Profile("Coding", "You are in Coding profile. Prioritize actionable help for the user's technical work.", True, True, True),
    "Meeting": Profile("Meeting", "You are in Meeting profile. Be quiet and concise; treat captured speech as private meeting context. Never speak or notify proactively.", False, False, False),
    "Quiet": Profile("Quiet", "You are in Quiet profile. Do not observe or proactively suggest anything. Answer only explicit requests.", False, True, False),
}


def normalize(name: str | None) -> str:
    if name in PROFILES:
        return name
    return "Coding"


def config_defaults() -> dict:
    return {"active": "Coding", "profiles": {name: {} for name in PROFILES}}
