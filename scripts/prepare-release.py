#!/usr/bin/env python3
"""Build a *candidate* source snapshot. Dry-run by default; never publish it automatically.

No private configuration, runtime JSON, historical docs, media, or Git history is copied.
The output remains unapproved until a human privacy/license/credential review.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = (
    ".dockerignore", ".env.example", ".gitignore", ".npmrc", "AGENTS.md",
    "Dockerfile", "README.md", "compose.yaml", "components.json",
    "eslint.config.mjs", "next-env.d.ts", "next.config.ts", "package.json",
    "pnpm-lock.yaml", "pnpm-workspace.yaml", "postcss.config.mjs", "tsconfig.json",
)
DOCS = (
    "docs/architecture.md", "docs/deployment-local.md",
    "docs/release-checklist.md", "docs/repository-map.md",
    "docs/role-function-baseline-v6.json",  # imported by src/lib/platform/feature-coverage.ts
)
SCRIPTS = (
    "scripts/scan-secrets.py", "scripts/prepare-release.py",
    "scripts/verify-p0-intent-safety.ts", "scripts/verify-ai-intent.ts",
    "scripts/verify-agent-conversation.ts", "scripts/verify-agent-http.ts",
    "scripts/verify-nine-dimension.ts", "scripts/verify-p1-permission-map.ts",
    "scripts/verify-p1-chat.ts", "scripts/evaluate-agent-acceptance.ts",
)
TREES = ("src", "public")
BLOCKED_PARTS = {".git", ".next", ".runtime", "node_modules", "artifacts", "assets"}
BINARY_ALLOW = {"src/app/favicon.ico"}  # Required framework icon; manual image review remains mandatory.
SK = re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b")
PEM = re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")
ENV_SECRET = re.compile(r"(?i)^\s*(?:[A-Z0-9_]*(?:API_KEY|SECRET|ACCESS_TOKEN|PRIVATE_KEY|PASSWORD))\s*=\s*([^\s#]+)")
PLACEHOLDER = re.compile(r"(?i)^(?:REPLACE_|YOUR_|<|\$\{|process\.|example|demo|test|changeme|none)")


def candidate_files() -> list[Path]:
    required = [ROOT / name for name in (*ROOT_FILES, *DOCS, *SCRIPTS)]
    missing = [str(p.relative_to(ROOT)) for p in required if not p.is_file()]
    if missing:
        raise ValueError("required files missing: " + ", ".join(missing))
    files = required + [p for name in TREES for p in (ROOT / name).rglob("*") if p.is_file()]
    for path in files:
        relative = path.relative_to(ROOT)
        if path.is_symlink() or any(part in BLOCKED_PARTS or (part.startswith(".env") and part != ".env.example") for part in relative.parts):
            raise ValueError("blocked/symlink candidate: " + relative.as_posix())
    return sorted(set(files), key=lambda p: p.relative_to(ROOT).as_posix())


def scan(files: list[Path]) -> list[dict[str, object]]:
    findings = []
    for path in files:
        relative = path.relative_to(ROOT).as_posix()
        if relative in BINARY_ALLOW:
            data = path.read_bytes()
            if not data.startswith(bytes((0, 0, 1, 0))) or len(data) > 100_000:
                findings.append({"path": relative, "line": 0, "rule": "binary_icon_requires_review"})
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeError:
            # The curated tree should not contain opaque binaries without a human review.
            findings.append({"path": path.relative_to(ROOT).as_posix(), "line": 0, "rule": "non_utf8_file"})
            continue
        for number, line in enumerate(lines, 1):
            if relative == "scripts/prepare-release.py" and line.strip().startswith("ENV_SECRET = re.compile("):
                continue  # The scanner definition is not an assigned credential.
            rule = None
            if PEM.search(line):
                rule = "private_key_header"
            elif SK.search(line):
                rule = "provider_key_format"
            else:
                match = ENV_SECRET.search(line)
                if match and not PLACEHOLDER.match(match.group(1)):
                    rule = "environment_secret_literal"
            if rule:
                findings.append({"path": path.relative_to(ROOT).as_posix(), "line": number, "rule": rule})
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="new isolated directory outside the project")
    parser.add_argument("--copy", action="store_true", help="explicitly copy the candidate files")
    args = parser.parse_args()
    if args.copy and not args.output:
        parser.error("--copy requires --output")
    files = candidate_files()
    findings = scan(files)
    print(f"Curated candidate: {len(files)} files; {sum(p.stat().st_size for p in files)} bytes; secret-like findings: {len(findings)}")
    for item in findings[:20]:
        print(f"{item['path']}:{item['line']} [{item['rule']}]")
    if findings:
        print("Stopped; no candidate export created. Values are never printed.")
        return 2
    if not args.copy:
        print("Dry-run only. Private .env.local and archived deliveries are OUTSIDE this scan; owner review is still required.")
        return 0
    target = args.output.expanduser().resolve(strict=False)
    if target == ROOT or ROOT in target.parents or target in ROOT.parents:
        raise ValueError("output must be outside the project, not its ancestor")
    if target.exists():
        raise FileExistsError("output already exists; never overwrite a previous review")
    target.mkdir(parents=True)
    manifest = []
    for source in files:
        rel = source.relative_to(ROOT)
        dest = target / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
        manifest.append({"path": rel.as_posix(), "size": source.stat().st_size,
                         "sha256": hashlib.sha256(source.read_bytes()).hexdigest()})
    (target / "release-candidate-manifest.json").write_text(json.dumps({
        "status": "CANDIDATE_ONLY_NOT_APPROVED", "privateGitHistoryReviewed": False,
        "ownerCredentialRotationVerified": False, "dockerImageBuilt": False,
        "files": manifest,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Candidate copied to {target}; NO Git staging, commit, push, or public deployment performed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
