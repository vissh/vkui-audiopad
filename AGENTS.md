# AGENTS.md — instructions for AI agents

**VK Audiopad** is a Chrome/Firefox player extension for VK Music (vk.ru).
Manifest V3, strict TypeScript, React 19 + VKUI 8, Feature-Sliced Design.

New to the project? Start with [docs/README.md](docs/README.md), then read the documents relevant to your task. Repository documentation and agent instructions use **English as the single maintained language**. Keep Russian UI labels when quoting the actual interface; do not create parallel translated copies. Existing UI localization and vendored skill content have their own sources.

## Commands

Run commands from the repository root: npm workspaces with one root `node_modules`.

Node is pinned in `.node-version`; npm is pinned exactly by `packageManager` in the root `package.json`. CI and Docker use these pins. Local development also supports newer Node patch/minor releases in the same major; use the exact pin to reproduce CI. Before installing dependencies, run `node scripts/doctor.mjs --runtime-only`.

```bash
npm ci               # install dependencies from the lockfile
npm run doctor       # runtime, tools, workspace/dependency and shared MCP checks
npm run mcp:sync     # generate Codex/OpenCode settings after editing .mcp.json
npm run mcp:check    # check MCP settings without writes; included in doctor/check
npm run smoke:firefox # opt-in real Firefox runtime smoke after a full build; no VK login
npm run docs:check   # local Markdown links/headings, runnable examples and shared instructions
npm run release:package # package a checked, fully built clean Git revision -> dist/release
npm run check        # required fast check: common build, typecheck and lint
npm test             # Vitest: common and offline runtime/React/tooling tests
./build.sh           # full extension build -> dist/chrome_extension and dist/firefox_extension
./build.sh front     # rebuild common + one consumer: front|offscreen|service-worker
npm run eslint:fix   # fix workspace lint violations
```

- `npm run docs:check` checks maintained root/docs Markdown without network access. It validates local link/image targets and heading anchors, npm scripts and node/shell entrypoints in inline/shell examples, plus CLAUDE.md importing AGENTS.md. Third-party skills and external URL availability are outside this check.
- `npm run check` is the required minimum before reporting completion. It does not run behavioral tests.
- Use `npm install` only for intentional dependency changes. Do not update the lockfile during ordinary verification.
- Run `./build.sh` for Vite, manifest or public asset changes, or to verify the full build. Follow it with `npm run verify:build`.
- Release assets and version tags: use the manual GitHub workflow; see [release runbook](docs/releases.md). Store submission remains manual.
- Chrome: `chrome://extensions` -> Developer mode -> Load unpacked -> `dist/chrome_extension`. Firefox: `about:debugging` -> This Firefox -> Load Temporary Add-on -> the manifest in `dist/firefox_extension`.
- Open the repository root in your editor, not an individual package.

## Packages

| Package | Responsibility |
|---|---|
| `packages/common` | `@vk-audiopad/common`: types/message protocol, VK clients, converters and utilities. Vite library + declarations. Production consumers resolve its `dist/`; **build common first** with `npm run build:common`. |
| `packages/front` | Popup UI (`index.html`): React 19, VKUI 8, TanStack Query, strict FSD. The same page can run in a browser tab. |
| `packages/offscreen` | Chrome offscreen document: Audio + hls.js. In Firefox it runs as a background page with the SW code. |
| `packages/service-worker` | MV3 background orchestration: playback, queues, playlists and VK integration. |

Before cross-package work, read [architecture](docs/ai/architecture.md) and [state/message ownership](docs/ai/state-and-messages.md).

Before player changes, read [ADR 0001](docs/decisions/0001-playback-operations.md): playback commands, cancellation, playbackId and the shared error budget. Send play/pause to the SW; writing `played` to storage is not a command. For startup/recovery read [ADR 0002](docs/decisions/0002-startup-recovery.md): synchronous registration, shared readiness and existing-media snapshots. Offscreen readiness and idle close/create/send follow [ADR 0003](docs/decisions/0003-offscreen-lifecycle.md).

For music action behavior and request comparisons, use [the VK parity reference](docs/product/vk-parity.md). For library delete/restore, also read [ADR 0006](docs/decisions/0006-library-delete-restore.md): VK mutations and local queue cleanup have different lifetimes.

Before scraping or adding vk.ru data, read [the VK integration guide](docs/ai/vkru-scraping.md): two API families, catalog tokens and investigation methods. Token method errors/deadlines/one auth retry follow [ADR 0008](docs/decisions/0008-vk-api-errors.md); a resolved request is a validated success envelope, and mutation adapters still validate their own response shape.

Before queue insertion/removal/reordering/shuffle or current-playlist paging, read [ADR 0004](docs/decisions/0004-queue-mutations.md): complete IDs versus loaded metadata, serialized mutations and hydration edits.

Before session/token changes, read [ADR 0009](docs/decisions/0009-session-owner.md): the background session owner is the credential writer; UI and token-method clients use its bounded, validated request/reply contract. Do not add per-popup refresh writers or replay a request after its account/epoch changes.

For query keys, account changes and pagination, read [ADR 0007](docs/decisions/0007-query-identity-and-pagination.md): per-account caches, original mutation variables, cursor guards and immutable merges.

Before lyrics changes, read [the product contract](docs/product/behavior.md#track-lyrics) and [VK response observations](docs/product/vk-parity.md#lyrics-observation-november-4-2026). Both plain and timestamped responses are supported, including interlude markers. Modal/tooltip verification follows [the testing procedure](docs/ai/testing.md#modal-and-tooltip-checks).

## AI tools

- **Shared MCP settings:** `.mcp.json` is the only source, read directly by Claude Code. `npm run mcp:sync` generates `.codex/config.toml` and the `mcp` section of `opencode.json` for OpenCode 1.x. Do not edit derived MCP settings manually: doctor/check and CI reject command, argument, environment or server-set drift. See [MCP setup](docs/ai/mcp.md) for trust, approval and updates. `CLAUDE.md` imports these instructions without copying them.
- **`vkui` MCP:** component documentation, props, examples and migrations. Use it instead of guessing APIs. Keep `VKUI_VERSION` in `.mcp.json` equal to `@vkontakte/vkui` in `packages/front/package.json`, then run `mcp:sync`.
- **`chrome-devtools` MCP**, with `--categoryExtensions`: install/reload unpacked extensions and inspect consoles. Workflow: full build -> `install_extension` -> `trigger_extension_action` -> `list_console_messages`. Read [testing](docs/ai/testing.md) before live checks: VK login, console baseline, popup lifetime and permitted staging paths.
- **`firefox-devtools` MCP:** official Mozilla moz build for addon installation and browser-context inspection; dedicated visible profile and pinned tools. Read [MCP setup](docs/ai/mcp.md#firefox-extension-checks) and [Firefox testing](docs/ai/testing.md#firefox-smoke-through-mcp). A public-package connection is insufficient to inspect the tested extension origin.
- **Extension runtime skill:** [.agents/skills/browser-extension-development/SKILL.md](.agents/skills/browser-extension-development/SKILL.md) routes manifest, messaging, lifecycle, storage and browser tasks to the owning contracts. Skills have one source under .agents/skills; .claude/skills is a symlink and OpenCode points to the same directory. docs:check rejects discovery drift and broken project-skill routes.
- **FSD skill:** `.agents/skills/feature-sliced-design/`; apply it when changing front structure. Do not edit vendored skill files manually; update through `npx skills update -y -p` (also run monthly by CI).

Configuration does not prove a server is connected in the current session. Without VKUI MCP, inspect installed `@vkontakte/vkui` declarations and existing project examples. Ordinary check/test/build do not require MCP.

## Development rules

### PR history

- **One PR = one commit** relative to its target branch. Include implementation, tests and documentation in that commit. Amend or squash follow-up fixes into it before pushing; do not leave extra commits in an open PR.
- Before rewriting a published PR branch, verify its remote head and preserve unrelated work. Push only the intended PR branch with `--force-with-lease`, never plain `--force`.
- Before handoff, verify the PR commit count and review whether the change needs new behavior, testing or debugging guidance. Update the owning documentation and link it from these instructions when a new task needs a discovery route.

### Frontend FSD

- Layers: `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`. Imports go downward; same-layer cross-imports are forbidden. Do not disable `@conarti/eslint-plugin-feature-sliced` to pass lint.
- Use public APIs through `index.ts`.
- Prefer VKUI components and `@vkontakte/icons` for UI.
- State uses [custom atoms](packages/front/src/shared/lib/atom.ts): `atom` for memory, `lsAtom` for localStorage, `storageAtom` for Chrome storage/events. Server data uses react-query.

### Messages

- Communication uses discriminated unions from `common/src/types.ts`: `MessageTarget` + `MessageType`, with Chrome runtime or the Firefox bridge as transport.
- A new message requires a branch in the receiving router: `service-worker/src/listeners/messages.ts` or `offscreen/src/listeners/messages.ts`. Keep exhaustive switches and `assertUnreachable`.
- Serialize errors crossing a message boundary with `serialize-error`.
- Static message types do not validate unknown runtime input. Validation and command responses remain planned work; see the state/message guide.

### Chrome and Firefox

- `build.sh` chooses `public/environment-{chrome,firefox}.json` as `environment.json`; `offscreen-document-support` selects the runtime mode.
- Chrome uses separate SW and offscreen contexts. Firefox runs both scripts in `offscreen.html`, using CustomEvents for internal communication.
- Use `commonUtils.offscreenDocumentSupport()` for transport selection. `commonUtils.isFirefox()` currently always returns false; do not use it for new logic.

### Sensitive files and conventions

- Do not edit or format `service-worker/src/fetchers/unmask.js`: vendored minified audio URL decoding.
- Treat `common/src/vk-client.ts` carefully: legacy FormData and windows-1251 decoding are easy to break with cosmetic changes.
- Edit `public/manifest.js`, not generated manifest.json. Extension versions are set there, not in package.json.
- Releases follow [the release runbook](docs/releases.md): use the GitHub workflow for version preparation, verified assets and atomic commit/tag publication. Personal Git signing/transport setup is not a contributor prerequisite.
- `public/rules/vkcom.json` contains declarativeNetRequest rules for vk.ru ads.
- TypeScript uses strict mode in all four packages, including implicit-any, nullability and function-variance checks. Explicit any is an ESLint error. Do not weaken compiler/lint settings; executable negative compiler cases in scripts/type-safety.test.ts guard the strictness contract. The vendored unmask.js remains outside lint/type-checking changes.
- ESLint flat configs use neostandard: two spaces, no semicolons, single quotes. Keep code comments minimal and in English.

## Tests and completion

Vitest pure common tests live beside source; offline integration tests live in `tests/`, tooling tests in `scripts/*.test.ts`. React tests use jsdom and Testing Library via `@vitest-environment jsdom`.

New pure common logic needs a test. For network/Chrome/audio logic, use controlled adapters in `tests/helpers/`; unit/integration suites must not use live VK or a personal browser profile. Unexpected fetch fails by default, including when code catches the rejection; intended network failures need an explicit adapter. Tests resolve common source through a test-only alias; production still uses common/dist. Check includes test types and tooling lint.

Use [the workflow](docs/ai/agent-workflow.md) to choose checks and report evidence. Typical routes:

| Change | Main files and verification |
|---|---|
| UI screen/feature | Front page/feature, query fetcher and atoms; `npm run check`, relevant UI test and live visual check |
| Player command | Common protocol, SW action/router, optionally offscreen handler; check, behavioral tests and full build |
| VK data | Common client first, rebuild common, then consumers; check plus format/cancellation tests and appropriate live check |

Update documentation with the code it describes. [Maintenance](docs/ai/maintenance.md) explains owners and updates. [The roadmap](docs/ai/development-roadmap.md) records current progress and acceptance criteria. [The readiness review](docs/ai/readiness-review.md) is a historical audit of `5574e83`; planned tasks do not imply implemented capabilities.
