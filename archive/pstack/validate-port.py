#!/usr/bin/env python3

from pathlib import Path
import re
import sys

repo = Path(__file__).resolve().parents[2]
skill_root = repo / ".agents" / "skills"
metadata_root = repo / ".agents" / "pstack"
roots = sorted(skill_root.glob("pstack-*"))
errors: list[str] = []


def check_links(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for link in re.findall(r"\[[^\]]*\]\(([^)]+)\)", text):
        if "://" in link or link.startswith(("#", "mailto:")):
            continue
        target = (path.parent / link.split("#", 1)[0]).resolve()
        if not target.exists():
            errors.append(f"broken link in {path}: {link}")


for root in roots:
    skill = root / "SKILL.md"
    if not skill.exists():
        errors.append(f"missing SKILL.md: {root}")
        continue

    text = skill.read_text(encoding="utf-8")
    frontmatter = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not frontmatter:
        errors.append(f"invalid frontmatter: {skill}")
        continue

    metadata = frontmatter.group(1)
    name = re.search(r"^name:\s*(.+)$", metadata, re.M)
    if not name or name.group(1).strip() != root.name:
        errors.append(f"name does not match directory: {skill}")
    if not re.search(r"^disable-model-invocation:\s*true$", metadata, re.M):
        errors.append(f"skill is not isolated as user-only: {skill}")
    if not re.search(r"^description:", metadata, re.M):
        errors.append(f"missing description: {skill}")

    for path in root.rglob("*.md"):
        check_links(path)
    for path in root.rglob("*"):
        if path.is_symlink():
            errors.append(f"symlink is not allowed in port: {path}")

for path in metadata_root.rglob("*.md"):
    check_links(path)

upstream_root = Path("/tmp/cursor-pstack/pstack/skills")
if upstream_root.exists():
    upstream_names = [
        path.name
        for path in upstream_root.iterdir()
        if path.is_dir() and (path / "SKILL.md").exists()
    ]
    for root in roots:
        for path in root.rglob("*.md"):
            text = path.read_text(encoding="utf-8")
            for name in upstream_names:
                patterns = (
                    rf"(?<!pstack-)/{re.escape(name)}\b",
                    rf"(?<!pstack-)`{re.escape(name)}`",
                    rf"(?<!pstack-)\*\*{re.escape(name)}\*\*",
                )
                if any(re.search(pattern, text) for pattern in patterns):
                    errors.append(f"unnamespaced pstack reference in {path}: {name}")

for root in roots:
    for path in root.rglob("*.md"):
        text = path.read_text(encoding="utf-8")
        for label, pattern in {
            "AskQuestion": r"\bAskQuestion\b",
            "subagent_type": r"\bsubagent_type\b",
            "generalPurpose": r"\bgeneralPurpose\b",
            "cursor-team-kit": r"cursor-team-kit",
            "Cursor /loop": r"/loop\b",
            "Cursor cloud syntax": r"environment:\s*[\"']cloud[\"']|cloud_base_branch",
            "unsupported delegation field": r"\breadonly\s*:|\bsubagent_type\s*:",
            "fictional compatibility tool": r"DSH compatibility layer|control-ui|control-cli|/deslop\b",
            "unsupported scheduling": r"sleep-based wake-up|controlled sleep",
            "unsafe handoff reset": r"git reset --hard",
        }.items():
            if re.search(pattern, text):
                errors.append(f"{label} remains in {path}")

print(f"pstack skills: {len(roots)}")
print(f"metadata markdown files: {len(list(metadata_root.rglob('*.md')))}")
print(f"errors: {len(errors)}")
for error in errors:
    print(error)

sys.exit(1 if errors else 0)
