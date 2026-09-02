# Changing code that has no tests

Code without trustworthy tests is legacy code. Getting control comes before fixing.

- Before changing behaviour you don't fully understand, pin the current behaviour down first — a few characterization tests that assert what it does today, including behaviour that looks wrong. You cannot tell a fix from a regression otherwise.
- Say plainly what should change and what must stay identical. If a change alters cases beyond the reported bug, that is a second change: call it out and get agreement, don't bundle it.
- When intent is ambiguous, name the ambiguity and ask, or state the assumption prominently. Do not silently pick a reading and ship it.
- Prefer the smallest verified move over the tidiest one. Behaviour change, refactoring, and cleanup stay separate.
- If a dependency (clock, network, global, constructor) blocks testing, break the narrowest one that restores feedback.
