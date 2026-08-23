<!-- nysa-agents:repo-standard:start -->
## Repository baseline (managed)

- Verification: run `scripts/verify` plus `scripts/repo-check` and `scripts/secret-scan` before declaring a code change complete. When enabled, remote full CI records broad verification as deferred rather than passed.
- The protected default branch is `main`. Create short-lived branches matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`; never push or merge without explicit approval.
- Never print credentials or raw secret-bearing configuration. Redact values by key name and credential-bearing URL before sharing output.
- Put disposable agent scratch and generated reports in gitignored `.context/`.
- Keep tracked cross-session truth in `context/memory.md` under `Current truth` and `Log`; promote stable knowledge instead of keeping raw transcripts.
- Stable documentation belongs in the declared documentation roots: `docs/`. Update the relevant document when its truth changes.
- Startup-critical rules belong in `AGENTS.md`; narrower subtree differences belong in scoped instruction files.
- Scoped instruction files: none.
<!-- nysa-agents:repo-standard:end -->
