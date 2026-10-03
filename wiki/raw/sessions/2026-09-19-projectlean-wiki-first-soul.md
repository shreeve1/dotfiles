# Session Capture: Projectlean Wiki-First SOUL

- Date: 2026-09-19
- Purpose: Capture the staged portable wiki-first SOUL design for projectlean.
- Scope: Template contract, protected installation boundary, and deterministic verification.

## Durable Facts

- `.hermes/templates/projectlean-soul.md.template` is a 1,364-byte portable SOUL that routes project context through `wiki/index.md`, `llm-wiki-setup`, and `wiki-update`. Evidence: `.hermes/templates/projectlean-soul.md.template` and `.hermes/bin/verify-projectlean.py`.
- The installer manifest records the template SHA and leaves `SOUL.md` untouched. Final verification requires byte-for-byte parity only after a human-approved protected-file copy. Evidence: `.hermes/bin/install-projectlean.py`, `.hermes/bin/verify-projectlean.py`.
- Preflight passed; post-apply correctly refused the current stock SOUL because it differs from the staged template. Evidence: `python3 .hermes/bin/verify-projectlean.py --mode preflight` and `--mode postapply`.

## Decisions

- Keep universal wiki discipline in the portable SOUL, while project-specific routing remains in the separate project router template. Evidence: `.hermes/docs/project-scoped-hermes-spec.md`.
- Do not automate or bypass the protected SOUL write; require backup, human-approved copy, parity verification, prompt-size, and a real wiki-backed query. Evidence: `.hermes/docs/project-scoped-hermes-spec.md`.

## Evidence

- `.hermes/templates/projectlean-soul.md.template` — staged reviewed bytes.
- `.hermes/bin/install-projectlean.py` — portable manifest and non-writing installer behavior.
- `.hermes/bin/verify-projectlean.py` — static contract and final parity gate.

## Exclusions

- No credentials, raw transcript, or unverified token-cost estimate was captured.

## Open Questions And Follow-Ups

- A human must approve the protected SOUL copy before final post-apply, prompt-size, and real project-wiki query evidence can be recorded.
