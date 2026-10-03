# Session Capture: Projectlean Query Skill Repair

- Date: 2026-09-19
- Purpose: Preserve the post-query profile-integrity diagnosis and recovery.
- Scope: Only the projectlean profile skill-directory invariant after the real wiki-backed query.

## Durable Facts

- After the one-shot `hermes --profile projectlean chat` wiki query, post-apply verification found extra category skill directories and rejected the profile because the portable contract requires exactly six vendored skill trees. Evidence: `python3 .hermes/bin/verify-projectlean.py --profile projectlean --mode postapply`.
- Re-running the idempotent projectlean installer removed the extra profile-local skill directories, retained the reviewed live SOUL unchanged, and restored final post-apply acceptance. Evidence: `python3 .hermes/bin/install-projectlean.py --profile projectlean --clone-from default --repo /home/james/dotfiles` followed by post-apply verification and SHA parity.

## Decisions

- Treat the installer as the recovery path for projectlean's six-skill invariant; do not broaden its profile surface after a runtime query. Evidence: `.hermes/bin/install-projectlean.py`, `.hermes/bin/verify-projectlean.py`.

## Evidence

- `.hermes/bin/{install-projectlean.py,verify-projectlean.py}` — restore and enforcement behavior.
- `.hermes/templates/projectlean-soul.md.template` — exact live-parity target.

## Exclusions

- No secrets, external issue, default-profile mutation, or gateway action was captured.

## Open Questions And Follow-Ups

- Candidate promotion remains subject to James approval.
