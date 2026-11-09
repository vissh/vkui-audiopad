# Maintaining project and agent documentation

Builds and static checks do not establish that prose is up to date or that release ZIPs are reproducible. Update descriptions with the behavior they describe; scheduled CI handles dependency/skill refreshes, not factual review of every document.

## Ownership

| Source | Purpose and update process |
|---|---|
| AGENTS.md | Short repository rules for agents/contributors; update with architecture/workflow changes. CI does not rewrite it. |
| docs/README.md and product/behavior.md | Onboarding/navigation and current user scenarios. Update when entry points, behavior or evidence changes. |
| ai/architecture.md and ai/state-and-messages.md | Runtime boundaries, storage ownership and command lifecycle. Update in the same PR as affected code. |
| ai/ui-debugging.md | React MCP setup, profiling comparisons, UI modality diagnosis and production restoration. Update with tooling and UI-debugging behavior. |
| ai/testing.md | Test harness, browser procedure, console baseline and dated live evidence. Preserve evidence scope/date. |
| decisions/ | Design rationale/constraints; link rather than copying budgets and invariants into every guide. |
| ai/readiness-review.md / ai/development-roadmap.md | Historical baseline / current implementation status. Preserve R/T IDs and audit evidence; update progress in the roadmap. |
| .agents/skills/feature-sliced-design + skills-lock.json | Vendored FSD skill. Monthly Update agent skills action opens a PR; manual update: npx skills update -y -p. Never edit it by hand. |
| .agents/skills/browser-extension-development | Project-owned extension workflow; update with runtime/tooling contracts. Not managed by skills-lock or the vendor updater. .claude/skills links to the shared directory; OpenCode skills.paths includes it. docs:check rejects separate copies/broken aliases and validates project-skill links. |
| .mcp.json -> .codex/config.toml + opencode.json mcp | One source for pinned VKUI/Chrome/Firefox DevTools MCP settings, including React third-party discovery. Edit source, run mcp:sync and commit outputs. Doctor/check/tests reject drift. See [MCP](mcp.md). |
| CLAUDE.md | Imports @AGENTS.md; do not duplicate the rules. |
| npm dependencies / GitHub Actions | Dependabot opens monthly dependency/action PRs. |
| releases.md / .github/workflows/release.yml / scripts/*release* | Release version preparation, checks, atomic commit/tag push, assets and retry policy. Update together when delivery changes. |

## Language and avoiding drift

Project-authored documentation and agent instructions use English only. Actual UI labels, quoted errors, code identifiers and external/vendored content retain their original language. Do not maintain English/Russian copies of the same guide. Conversation language is independent of repository language.

Maintain one owning document per contract. Other documents should give a short route and link. Keep current behavior, proposals and historical findings distinct. On renaming a heading/file, update incoming links and verify anchors; language changes must preserve task IDs, evidence, commands and compatibility limits.

## CI

CI runs on master pushes and PRs: Node from .node-version -> npm from packageManager -> npm ci -> npm run check -> npm test -> full build -> verify:build -> isolated Firefox runtime smoke (Firefox 159.0 installed by setup-firefox). The browser smoke uses a fresh headless profile and a probe-only build copy, without VK login; npm test remains the offline suite. It also checks public registry URLs and audits critical advisories. Update the explicit Firefox pin in ci.yml when changing the tested browser baseline and repeat the smoke; this is not the extension minimum-version declaration. Blocking merges on red CI requires required statuses configured in GitHub; the workflow does not set that policy.

Update agent skills runs on the first day of each month and workflow_dispatch, opening a PR if the vendored skill changed. Dependabot handles npm/action updates monthly. An update PR still needs compatibility review and green checks.

Release extension runs only through workflow_dispatch on master, with a new version supplied through the form. Its read-only build job prepares a local version commit, repeats the check/test/build/Firefox-smoke sequence and retains the candidate plus a Git bundle. A separate contents-write job verifies the downloaded checksums/commit identity, pushes the same version commit and tag atomically without force, then attaches the candidate to a draft or published GitHub Release. A moving master, conflicting tag or server-side branch restriction stops publication. See the [release runbook](../releases.md). Store submission and server-side protection policies remain manual.

## Runtime and preflight

- Update .node-version, packageManager and engines together with clean-install/full-check evidence. Same-major newer Node minor/patch versions are supported locally; the pin reproduces CI.
- `node scripts/doctor.mjs --runtime-only` works before node_modules and runs during preinstall. Unsupported versions fail with an actionable message.
- Doctor additionally checks binaries, workspace links/required scripts, direct root/workspace dependencies using npm ls --workspaces --include-workspace-root --depth=0, frontend VKUI_VERSION and all MCP client settings. It uses no network, starts no MCP and rewrites no configs.
- Doctor does not validate every transitive peer range. eslint-plugin-react declares ESLint support through 9 and currently works with 10 via existing @eslint/compat; npm ls --all separately exposes that limitation.
- CI/Docker install the pinned npm. Docker may use temporary /tmp/vk-audiopad-toolchain without changing host npm.
- npm ci reproduces the lockfile; npm install is for dependency changes. CI does not run mcp:sync because regeneration would hide drift. The read-only check is npm run mcp:check.

Do not commit private registry URLs. Root .npmrc selects the public registry; CI rejects nonpublic resolved entries. allowScripts retains esbuild's intentional install permission; do not allow all scripts to get past installation. Fix failures introduced by a change instead of disabling checks.

## minimatch security override

The root override pins transitive `minimatch@^10` to `11.0.1` for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The affected copies belong to ESLint, `@eslint/config-array`, `@typescript-eslint/typescript-estree` and `eslint-plugin-import-x`. The advisory affects versions `>=7.0.0 <11.0.1` and allows excessive CPU/memory use during glob preprocessing at `optimizationLevel >= 2`.

Version 11 removes `makeRe` and other APIs. Keep `eslint-plugin-import-x` at `4.18.1` or a compatible newer version, which supports minimatch 11. The other affected consumers use the retained `Minimatch`/`match` and `minimatch` APIs. The separate minimatch 3 dependency used by `eslint-plugin-react` is outside this advisory's affected range.

Remove the override once upstream dependency ranges select fixed versions. Revalidate with a clean install, `npm audit`, `npm run check`, `npm test`, the full build and `npm run verify:build`. Review major-version API changes before broadening this override.

## Updating VKUI

1. Install the selected version with `npm install @vkontakte/vkui@<version> -w @vk-audiopad/front`.
2. Use vkui MCP migration tools or https://vkui.io/migrations/; repair affected UI/API usage.
3. Update VKUI_VERSION only in .mcp.json to match the frontend dependency, then run npm run mcp:sync.
4. Run check/test and full build where required; inspect actual UI for visible changes.
5. Update architecture/decision notes if the migration changes a contract.

## Documentation validation

`npm run docs:check` runs offline and is part of `npm run check`, including CI. It reads the root README/AGENTS/CONTRIBUTING/CLAUDE guides and Markdown under docs/, using a CommonMark parser and GitHub-style heading slugs. It checks local Markdown/image/reference-link targets, heading fragments (including duplicate/Unicode headings), declared HTML anchors and repository-relative paths. CLAUDE.md must remain the single @AGENTS.md import. The project-owned extension SKILL.md is also checked, including shared Claude/OpenCode discovery paths. Vendored skills and external URL availability are excluded.

Inline code and bash/sh/shell fences are checked for `npm run <script>` (including selected/all workspaces), `node scripts/<file>` and `./<file>.sh` entrypoints. These examples run from the root. The checker never executes them. Prose, arbitrary shell syntax, dynamic paths and undocumented commands are not a shell program to interpret; format executable examples in this supported form. Validation does not prove that a command succeeds or that documentation's behavioral claims are true.

Update links when headings/files move and update commands with package scripts in the same change. [Regression tests](../../scripts/check-documentation.test.ts) intentionally break references, anchors, entrypoints and shared instructions. Keep this check read-only; do not silently rewrite links or ignore failures in CI.

## Type-safety baseline

All four production packages use TypeScript strict mode without implicit-any overrides. Root tooling and workspace compilers pin TypeScript 6.0.3; update them together. `scripts/type-safety.test.ts` compiles deliberately unsafe examples under the actual workspace options, checking implicit parameters, nullable access and callback variance. Turning off strictness must not silently produce green validation. Explicit any is a workspace lint error; prefer unknown plus runtime validation at external boundaries.
