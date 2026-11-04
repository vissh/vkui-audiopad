# Roadmap for autonomous VK Audiopad development

Based on the [November 3, 2026 audit](readiness-review.md). The goal is for an agent to implement a task and demonstrate correctness without a person manually checking every change. The progress table records current implementation; T01-T18 descriptions define acceptance requirements, not automatically existing capabilities.

Order: reproducible setup -> controlled test boundaries -> defect fixes -> explicit state contracts -> browser verification -> reproducible release. Clarify product behavior before changing it. Large tasks can span sequential PRs if each leaves a usable project.

## Implementation progress

Updated November 4, 2026. Links refer to the implementation in this change set; use Git history for the exact revision.

| Task | Status | Implementation and evidence |
|---|---|---|
| T01 | Implemented | [.node-version](../../.node-version), [package.json](../../package.json), [doctor](../../scripts/doctor.mjs), shared CI/Docker pins. MCP derives from one .mcp.json source for Claude Code/Codex/OpenCode 1.x; [tests](../../scripts/mcp-config.test.ts)/doctor reject full-settings drift. [MCP setup](mcp.md). Clean macOS and isolated Linux Alpine checks/builds passed without verification changing the lockfile. |
| T02 | Base infrastructure implemented | [Vitest](../../vitest.config.mts), [helpers](../../tests/helpers), [React](../../tests/front/atom.test.ts), [storage](../../tests/service-worker/storage.test.ts), [transports](../../tests/offscreen/message-transport.test.ts), [decoding/network](../../tests/common/vk-client.test.ts), [timers](../../tests/service-worker/audio-error.test.ts). Tests/types/tooling lint are included; adapter limits are in testing.md. [Network-policy fault injection](../../scripts/offline-network-policy.test.ts) proves swallowed unexpected fetches still fail the suite. No offline browser e2e yet. |
| T03 | Implemented with offline coverage | Iterative unique candidates, shared missing/media/Mix budget, cancellable waits, terminal snapshot/UI error. [Queue](../../tests/service-worker/playback.test.ts) and [media retry/pause](../../tests/service-worker/audio-error.test.ts) regressions initially failed. No extra player-level network retry. |
| T04 | Implemented with offline coverage | Network cancellation, current operation/revision, serialized commits, post-offscreen guard, playbackId, old Audio/HLS isolation. [Operation](../../packages/service-worker/src/playback-operation.ts), [delivery](../../tests/service-worker/offscreen-ordering.test.ts), [lifecycle](../../tests/offscreen/player-lifecycle.test.ts), [ADR](../decisions/0001-playback-operations.md). |
| T05 | Core implemented; live restart evidence pending | Shared SW toggle intent, synchronous listener registration, readiness and existing-media reconciliation. [ADR 0002](../decisions/0002-startup-recovery.md), [startup regressions](../../tests/service-worker/startup.test.ts). Firefox startup now waits boundedly for its audio module listener, fixing a live observed initialization failure with a controlled late-listener regression. Isolated live Chrome worker termination/restart remains unverified; durable operation recovery is T11. |
| T06 | Core implemented with controlled coverage and scoped Chrome smoke | Bounded/cancellable listener readiness, serialized close/create/send, current idle-document validation and source request/revision guards for HLS/play promises. [ADR 0003](../decisions/0003-offscreen-lifecycle.md), [lifecycle races](../../tests/service-worker/offscreen-lifecycle.test.ts). Real idle cleanup/reload and stale-close rejection observed in Chrome; real HLS decoder/network matrix and Firefox live checks remain. |
| T07 | Core implemented with controlled coverage and Chrome smoke | R08 owner/audio order fixed. R10 insertion/removal/index/shuffle defects now use [pure rules](../../packages/service-worker/src/queue.ts), serialized mutations and hydration/page merging; [ADR 0004](../decisions/0004-queue-mutations.md), [action regressions](../../tests/service-worker/queue-actions.test.ts), [editor tests](../../tests/front/queue-editor.test.ts). Real partial queue paging, play-next, shuffle restore, remove/apply and native drag/apply checked in Chrome. Durable queue edits and browser automation remain T11/T14. |
| T08 | Implemented with controlled coverage and scoped live checks | Correct Map drain, delete/restore registration, navigation generations and pending-restore ordering. Named/guarded VKUI controls, source-specific restore and confirmed mutation outcomes. [ADR 0006](../decisions/0006-library-delete-restore.md), [website comparison](../product/vk-parity.md). Popup closure explicitly retains the queue. Applied queue acknowledgements remain T12. |
| T09 | Partial: session verification and bounded token methods | Inconclusive token/profile checks preserve session/queue, share a cancellable 15-second deadline and expose manual retry. Awaited persistence/cleanup, safe token errors and token-endpoint HTTP checks have controlled coverage. [ADR 0005](../decisions/0005-session-verification.md). audio.delete now uses the shared app ID; delete/restore result validation is fixed under T08. Live A/B accepted both the old and new client_id, so the parameter change is consistency work, not a reproduced refusal. Token methods now reject typed safe errors, share a 15-second budget, refresh/retry auth once and send GET without a body ([ADR 0008](../decisions/0008-vk-api-errors.md)). Add/follow now validate result shapes, reject ambiguous replay, preserve added metadata and show safe guarded UI errors. Shared refresh/account epochs and remaining mutations remain open; cache isolation is implemented under T10. |
| T10 | Core cache/pagination implemented; broader session/browser cases remain | Bounded active-page pagination and explicit retry, per-account QueryClient retirement, complete page keys, original-variable/cursor guards and immutable ID merges. [ADR 0007](../decisions/0007-query-identity-and-pagination.md), [identity regressions](../../tests/front/query-identity.test.ts). All-catalog invalidation after library actions, full token-resolution cancellation and broader Firefox/source evidence remain. |
| T13 | Partial | Doctor requires workspace scripts; --if-present removed; tooling lint/test typecheck added. All four packages now use full TypeScript strictness, explicit any is a lint error and [compiler regressions](../../scripts/type-safety.test.ts) reject weakening. TypeScript is pinned to one version across root/workspaces. Type-aware async lint and FSD composition remain. |
| T12 | Partial | PLAY_TRACK/AUDIO_PLAYER carry playbackId across both transports; explicit play/pause added. Runtime validation, request/response envelopes and sender policy remain. |
| T14 | Partial: authenticated Chrome/Firefox and isolated Firefox runtime smoke | Authenticated catalog/search, playback/Mix, pause/resume, next/previous, three rapid next commands, popup closure, modals and upgrade checked through MCP. [Evidence/limits](testing.md#live-run-november-3-2026). smoke:firefox installs a temporary addon in a fresh headless Firefox via the shared Mozilla MCP and checks actual startup, snapshot transport and applied repeat commands without VK. CI runs this with Firefox 159.0 after both builds. Authenticated Firefox session verification, catalog/search, native playback/Mix/pause and UI-tab reopen now have [scoped evidence](testing.md#authenticated-firefox-follow-up-november-4-2026). Actual Firefox popup, minimum-version/HLS matrix and a full offline UI browser suite remain. |
| T17 | Partial; accessibility gaps remain | Add/follow and existing delete/restore use named VKUI buttons; busy actions preserve focus, reject duplicate activation and show safe errors. Follow Enter/Space round trip checked live. Root render/lifecycle recovery covers providers, keeps storage and exposes focused UI reload; [regressions](../../tests/front/ui-recovery.test.ts) and live injected-fault recovery passed. Primary play/pause has a tested action label; several other player/icon-tab accessible names remain empty in live AX output. Popup/modals inspected; 780x600 UI tab has no whole-page horizontal overflow. Keyboard-only/a11y coverage remains. |
| T18 | Context and extension-skill discovery expanded; incomplete | [Guide](../README.md), [contributing](../../CONTRIBUTING.md), [product](../product/behavior.md), [state/messages](state-and-messages.md), [fixtures](fixtures.md), workflow routes and playback ADR now exist. Project-authored docs/instructions use one English version. [docs:check](../../scripts/check-documentation.mjs) now rejects broken local links/anchors, documented command entrypoints and duplicated Claude instructions, with fault-injection tests. The project-owned extension skill and tooling research route agents to browser-specific contracts; Claude aliases the canonical skills directory and OpenCode uses it directly, with drift/link regressions. Release runbook and full scenario-to-check mapping remain. |

Next tasks: remaining T09 VK error/refresh contracts and T10 cache/pagination; incrementally implement the T13/T14/T16/T18 checks for autonomous work. T05 live restart validation remains pending tool access. Keep the historical audit at 5574e83; record fixes here rather than removing old findings.

Chrome DevTools MCP connected and basic live T03/T04 scenarios passed on November 3, 2026; [testing](testing.md#live-run-november-3-2026) records scope and gaps. Missing MCP workspace roots required staging the public build in permitted system temp. This does not complete T05, T14 automation, Firefox or release checks. Project MCP files remain authoritative; the temporary global Codex registration was removed.

## Stage outcomes

| Stage | Tasks | Exit condition |
|---|---|---|
| Foundation | T01, T02, initial T18 scenarios | A fresh checkout installs/checks as documented; tests control network/time |
| Fixes | T03, T04, T06-T10 | Every fixed defect has a regression; user scenarios terminate predictably |
| Contracts | T05, T11-T13 | Explicit ownership, SW recovery, migrations and message semantics |
| Product verification | T14, T15, T17 | Browser/local-data checks cover core behavior; diagnostics contain no secrets |
| Delivery | T16, remaining T18 | Verified artifacts and source belong to one revision; local/CI checks agree |

Localized independent changes can proceed separately. Protocol, storage and startup edits share contracts and require sequential coordination.

## T01 Make setup reproducible

**Priority:** first. **Basis:** R14, R17, R19. **Dependencies:** none.

Align root runtime metadata, .node-version, README/AGENTS/maintenance, CI and Docker. The verified reference is Node 24.22.2/npm 11.19.1. Make patch upgrades explicit and distinguish npm ci from intentional dependency installation.

Add a small doctor for runtime, workspace links/dependencies and required tools/scripts. MCP diagnostics must distinguish configured from connected; missing MCP must not block ordinary TypeScript checks. Provide installed VKUI declarations/examples as fallback. Correct moduleResolution/strict/client configuration descriptions and replace -ws with explicit --workspaces. Do not upgrade every dependency alongside this work.

**Acceptance:** fresh supported checkout follows setup without repairs; wrong runtime fails clearly; checks do not alter lockfile; MCP is never declared connected without evidence.

**Validation:** isolated install, npm ls --workspaces, check, tests, full build and verify:build.

## T02 Add runtime test boundaries

**Priority:** first. **Basis:** R01-R15. **Dependencies:** T01 preferred, not mandatory.

Extend existing Vitest to SW/offscreen/front using one DOM environment/React Testing Library for UI and Node for pure logic. Do not add another unit runner. Verify aliases/common imports on a clean build.

Provide controlled storage, runtime messages, fetch, Audio, timers and deferred completions. Model storage events, runtime.lastError and async ordering, not only happy-path stubs. Check success/failure at each needed boundary. Extract production adapters only where a real boundary benefits.

Replace the historical AGENTS network/Chrome-test prohibition with offline-adapter testing. Real VK/personal profiles stay out of unit/integration suites; new pure common logic still receives colocated tests.

**Acceptance:** tests can delay/reorder two requests, dispatch storage/media events and fail audio. Production bundles do not contain the harness.

**Validation:** new harness plus the original 35 tests, check, build for config changes. Add defect regressions with their respective fixes.

## T03 Bound traversal of unavailable tracks

**Priority:** P1. **Basis:** R02. **Dependencies:** T02.

Replace recursive unbounded play-new-track/on-audio-error transitions with a shared intent budget, visited IDs and cancellation. Coordinate missing URL and media/HLS errors; fresh commands must not accidentally inherit an old budget.

**Acceptance:** empty, one-unavailable and all-unavailable queues terminate predictably; a valid later candidate starts; no requests follow budget exhaustion; a new command cancels old waits. Define exact transient delays/retry limits.

**Validation:** fake timers, finite fetch counts and terminal-state assertions. Do not enshrine the historical ten-attempt number as a product requirement without rationale.

## T04 Reject obsolete playback results

**Priority:** P1. **Basis:** R01. **Dependencies:** T02; coordinate T03.

Add operation generation/source identity and guards after track, queue, Mix and offscreen preparation awaits. Use AbortSignal where applicable. Mix changes must not mutate a playlist belonging to another snapshot.

**Acceptance:** slow A/fast B ends at B; fast A/slow B ends at B once B completes; late A hydration cannot change B; rapid next/previous cannot restore an old track; cancelled-operation errors do not appear as current failures. Define rapid-command semantics before implementing them.

**Validation:** relevant deferred completion permutations, storage and offscreen effects; full two-browser build for message changes.

## T05 Define playback recovery and ownership

**Priority:** P1. **Basis:** R03, R12. **Dependencies:** T02, T04; later T12 integration.

Document ownership in a short ADR: SW owns queues/user intent, offscreen actual media. Register Chrome listeners synchronously and gate execution through shared readiness. Represent initialization success/failure explicitly. Remove the unconditional playback reset on SW wake-up.

Move direct UI playback writes to commands incrementally. Storage is snapshot/persistence rather than a universal implicit command bus. Define closing offscreen concurrently with play.

**Partial implementation:** toggle controls/hotkeys now share a synchronous SW intent via TOGGLE_PLAYBACK. playbackRequested is a separate UI snapshot; two clicks before the first media event cancel loading/retry, and a third restarts the pending selection. Already launched media resumes without replacing its source/position. Feature handlers send commands directly; atom.ts only observes playback. [Intent regressions](../../tests/service-worker/playback-intent.test.ts), [transport/hotkey cases](../../tests/service-worker/playback-command-transport.test.ts) and [actual UI controls](../../tests/front/playback-controls.test.ts) cover delayed storage/network, cancellation and cross-control intent. Startup/readiness now also has an implementation; see below.

**Startup implementation:** synchronous Chrome registration plus shared readiness; storage changes during load are merged; existing media is queried by requestId over both transports without creating offscreen or autoplay. Matching source/position is restored; missing media clears stale playback identity; mismatch is paused and can be explicitly retried; storage/snapshot failure publishes failed initialization and blocks actions. [ADR 0002](../decisions/0002-startup-recovery.md), [startup tests](../../tests/service-worker/startup.test.ts) and [snapshot transport tests](../../tests/offscreen/player-snapshot.test.ts) document and verify this. Live worker termination/restart remains a separate validation gap. Close/create/play coordination and command listener readiness are now implemented under T06.

**Acceptance:** a pre-load hotkey uses the restored queue; a new SW reconciles with live offscreen; absent offscreen recovers without spontaneous autoplay; init failure is observable. Moving all registration after await is not a solution.

Rapid toggle offline acceptance is covered: preserve play-then-pause intent before the first playing event, cancel pending loading/retry, and share intent across controls. Repeated ACTIVE_TRACK selection before metadata commits remains selection, not toggle. Live evidence is recorded separately in [testing](testing.md).

**Validation:** startup/restart/conflicting-command integration cases, then T14 browser restart.

## T06 Recover offscreen after failures

**Priority:** P2, suitable early localized fix. **Basis:** R07, part of R13. **Dependencies:** T02.

Reset rejected creation guards, define PLAY_TRACK readiness, handle rejected audio.play/fatal HLS and destroy old players correctly. Preserve/test the production prohibition on Audio.crossOrigin.

**Implementation:** [ADR 0003](../decisions/0003-offscreen-lifecycle.md) defines a shared Chrome lifecycle queue, bounded/cancellable listener readiness probes, current document/source/activity validation for idle close, and explicit source reload if play arrives during an issued close. Idle timer no longer destroys media before approval or reclaims unpaused media. Source-local request/revision guards prevent late HLS attachment and obsolete play() rejection from undoing pause/resume. [Lifecycle races](../../tests/service-worker/offscreen-lifecycle.test.ts), [readiness ordering/timeouts](../../tests/service-worker/offscreen-ordering.test.ts), [idle checker](../../tests/offscreen/activity-checker.test.ts), [real transports](../../tests/offscreen/player-snapshot.test.ts) and [Audio/HLS cases](../../tests/offscreen/player-lifecycle.test.ts) cover these boundaries. Physical browser coverage is recorded in testing; controlled HLS is not a real decoder test.

**Acceptance:** creation can retry after rejection; concurrent setup shares one attempt; commands are not lost before ready; play/HLS failures reach SW correctly; destroyed sources cannot emit current events.

**Validation:** Audio/HLS/runtime adapters, then actual MP3/HLS. ERROR/ENDED separation and no crossOrigin require regressions.

## T07 Fix and isolate queue operations

**Priority:** P2. **Basis:** R08, R10, part of R12. **Dependencies:** T02.

Fix owner/audio order in queue_params. Put validated ID parsing near its owner; common extraction requires real shared consumers. Check related requests.

Extract pure insertion/removal/reordering/shuffle/index operations. Distinguish full ID queue from loaded TrackItems. Do not disguise a missing item as index 0 or splice(-1).

**Implementation:** pure queue rules plus serialized commit-time transformations, ID/anchor edits, stale snapshot guards, pending-operation synchronization and a hydration edit journal. Resumed media can retry cancelled queue hydration without replacing Audio. Front editor/metadata pagination now send commands and observe worker snapshots, including same-length reorder changes. [ADR 0004](../decisions/0004-queue-mutations.md) defines ownership and evidence; library mutation timing and durable schemas remain separate tasks.

**Acceptance:** visible [A,B], full [A,B,C], active B, insert D -> D is visible after B; shuffle preserves selection and restoring order works; empty/last-item operations do not crash; no accidental duplicates.

**Validation:** table-driven invariant tests. Add property-based tooling only if ordinary tables cannot cover useful combinations adequately.

## T08 Fix deletion and restoration

**Priority:** P2. **Basis:** R09. **Dependencies:** T02.

Fix Map iteration. Define which operation mutates VK versus local queue, when restoration expires and what popup closure means. Do not combine this localized fix with rewriting every VK mutation.

**Acceptance:** pending delete plus tab change sends DELETE_TRACK; restore prevents it; repeated cleanup is idempotent; popup closure follows the selected contract.

**Validation:** message/cleanup unit and integration tests; delete/restore component controls after T17.

## T09 Define VK/session error contracts

**Priority:** P1. **Basis:** R04, R05, part of R20. **Dependencies:** T02.

Popup session verification is implemented as a bounded subset: transient failures preserve local data, confirmed unauthorized still clears associated data, and manual retry replaces automatic session-query retry ([ADR 0005](../decisions/0005-session-verification.md)). General error/refresh contracts and cross-context isolation are not complete.

audio.delete app-ID consistency and delete/restore success validation are addressed under T08; both old/new client_id values worked in live A/B. Token-method error/HTTP/GET/deadline contracts are implemented in [ADR 0008](../decisions/0008-vk-api-errors.md). Add/follow shape validation and guarded failure feedback now have [adapter](../../tests/front/library-add-follow.test.ts) and [control](../../tests/front/library-action-controls.test.ts) regressions plus live comparisons. For the remaining work, coordinate shared refresh and session ownership, and review the other mutation adapters. Choose one explicit failure contract and review add/delete/broadcast/follow/restore consumers. Define timeout, cancellation, operation-appropriate retry and shared refresh. Never blindly repeat a mutation with ambiguous completion.

Distinguish unauthorized, transient networking, rate limit and format drift. Preserve queues during transient failures. Retain legacy FormData/windows-1251 behavior unless fixtures/evidence justify a change.

**Acceptance:** VK errors cannot look successful; 401/error 5 refresh is bounded; 429/5xx/timeout cannot loop; networking does not log users out; account data stays isolated; GET sends no body. New errors exclude secrets.

**Validation:** controlled network, token/legacy payloads, timeout/cancellation and negative mutation scenarios.

## T10 Fix frontend cache and pagination

**Priority:** P1 for retries, P2 otherwise. **Basis:** R06, R11. **Dependencies:** T02.

The shared list boundary now gates pagination on active page/valid arguments, stops after failure or repeated/cyclic cursor and offers explicit retry without dropping rows. Pagination mutations disable automatic retries. Account-scoped clients, complete query keys, immutable merges and obsolete-page guards are also implemented in [ADR 0007](../decisions/0007-query-identity-and-pagination.md). Cross-window invalidation, token/session epochs and broader browser evidence remain.

Define key factories near request owners with every result-changing input: session for personal data; owner/context for playlists. Never put secrets in keys. Explicitly cancel/clear cache on account changes.

Stop automatic retry after errors; expose retry, reject obsolete pages/repeated cursors and merge immutably with stable-ID deduplication. Use useInfiniteQuery where it reduces custom logic, without requiring a simultaneous full migration.

**Acceptance:** equal playlist IDs across owners remain isolated; account switch hides prior cache; pagination failure has bounded requests; retry works; late pages cannot enter another playlist; cache updates notify UI.

**Validation:** controlled network/IntersectionObserver component or integration tests without VK.

## T11 Version persisted state

**Priority:** P2. **Basis:** R12. **Dependencies:** T05, T07; coordinate T09/T12.

Create a storage key registry with type, owner, default, lifetime and account/update behavior. Remove arbitrary Record from domain ApplicationState and validate snapshots rather than merging unknown keys automatically.

Introduce schemaVersion and sequential idempotent migrations, including the initial transition from unversioned data. Separate session/runtime/settings reset. Verify quota/write failures. Decide queue-preservation behavior before changing update handling.

**Acceptance:** fresh, legacy, malformed, upgraded, repeatedly migrated and account-switched data have known outcomes. Updates preserve settings; incompatible data does not loop. Do not promise downgrade support without a compatible format.

**Validation:** input/expected migration tables and T14 browser upgrade.

## T12 Make messages a validated protocol

**Priority:** P2. **Basis:** R13. **Dependencies:** T02, T05; coordinate T04/T11.

Retain discriminated unions/exhaustive switches. Validate unknown input, add command request IDs, event playback IDs and serialized outcomes. Define reply lifetime, timeouts, missing receivers, unsupported messages and allowed senders.

Make Chrome runtime/Firefox CustomEvent adapters implement the same contract, including command completion/failure. Do not add transport versioning without a compatibility scenario; still handle old/unknown messages explicitly.

**Acceptance:** malformed payloads cause no effect; errors survive serialization; results are observable; obsolete events are rejected; missing receivers cannot wait forever; both transports pass shared contract scenarios.

**Validation:** adapter contract tests, check and full build.

## T13 Align architecture rules and tooling

**Priority:** P2. **Basis:** R14. **Dependencies:** T02; avoid concurrent wholesale FSD restructuring.

Implicit-any overrides are removed; command indexing was already corrected during playback work. Compiler regressions now exercise implicit parameters, nullable access and callback variance under each actual workspace config. Explicit any is an ESLint error. Introduce type-aware no-floating-promises/no-misused-promises with actual failure handling: void is not enough. Start at changed/new boundaries, then remaining code. Keep no-explicit-any as an error; handle exceptional external data as unknown and validate it.

Resolve catalog-gallery composition by merging related slices or composing above them through props. Remove four suppressions while preserving scenarios. Adopt coherent pages-first/extraction guidance in AGENTS; do not mechanically remove widgets. Keep shared public APIs focused instead of a giant barrel.

Require every workspace's typecheck/lint and all-client MCP consistency including VKUI_VERSION. Lint/check owned scripts/configs without touching vendored unmask.js. Explicitly align build targets with supported browsers.

**Acceptance:** new boundary/async violations fail validation; missing scripts are detected; rules are not weakened for green CI; layers/dependencies do not grow without cause.

## T14 Add browser checks with local data

**Priority:** P1 for autonomy. **Basis:** R15. **Dependencies:** T02 and main scenario fixes.

For Chromium, use an isolated persistent extension-capable context, such as Playwright, after proving the exact CI MV3 launch mode. Firefox needs its own supported add-on path, such as web-ext plus compatible WebDriver/BiDi; do not assume a Chromium extension API works there.

Build a test-only local source adapter and short local media fixtures. Production must not contain hidden debug modes/extra permissions. Version sanitized JSON/HTML shapes with provenance, scenario and update procedure; never real cookies/tokens/signed URLs/personal responses. [Fixture authoring guidance](fixtures.md) exists; the complete corpus/browser mode is still open.

**Required scenarios:** first launch/unauthenticated, denied permission, catalog/search, play/pause/next/previous/seek/volume, queue/shuffle/repeat, ordinary/radio/Mix, media error without next storm, popup close/reopen, SW restart, storage upgrade, account switch, two themes and modals. Each needs an observable expected result.

**Acceptance:** both runtime modes execute tests; failures preserve build hash, console, sanitized state and screenshot/trace. No personal credentials required. Known noise is filtered narrowly; new exceptions fail.

**Live VK:** separate opt-in run with a provided session and distinct pass/fail/auth_required/upstream_unavailable statuses. Local fixtures do not establish current upstream compatibility; inaccessible VK is not live success.

## T15 Add safe diagnostics

**Priority:** P2. **Basis:** R20. **Dependencies:** T09/T12 preferred.

Add a bounded local event journal with source, build/commit, request/playback ID, error code, transition and time. Define retention/size. Remove access tokens, cookies, action hashes, private URLs and personal payloads before storing/exporting; test nested redaction too.

**Acceptance:** diagnostics correlate UI/request/SW/offscreen, exports exclude synthetic secrets, storage cannot grow without bound, and UI provides useful error codes/retry where appropriate. External telemetry is unnecessary.

## T16 Build a release from one verified revision

**Priority:** P1 for autonomous delivery. **Basis:** R16, R19. **Dependencies:** T01, T14, T15; localized packaging improvements can precede them.

Build one revision in an isolated checkout/container instead of the dirty working tree. Remove TTY/fixed container-name conflicts. Install reproducibly without host npm install recovery. Pin/review the build image separately.

Retain Chrome/Firefox ZIPs, matching source, checksums, metadata and checks. Validate unpacked artifacts and all manifest/HTML/module resources; use browser/store manifest tools and test supported versions. Normalize timestamps/ordering and compare two builds before promising bit-for-bit reproducibility.

CI needs minimal permissions, timeout, concurrency and diagnostic/artifact publication. Review advisory applicability; do not force npm audit fixes proposing incompatible downgrades. Update Hls.js/MCP/skills/actions in separate compatible changes and pin executable tooling.

**Acceptance:** build does not mutate checkout/lockfile; ZIP/source/checks share one revision; the published candidate is the verified one. Required statuses/branch protections must be enabled server-side with an explicit automatic merge/release policy; this plan does not enable it.

## T17 Verify UI and accessibility

**Priority:** P2. **Basis:** R18 and parts of R13/R15. **Dependencies:** T02; visual cases use T14.

Replace clickable SVG in TooltipIconButton with a suitable named VKUI button. Check Tab/Enter/Space, focus, disabled, tooltip and stopPropagation. SignIn permission/auth side effects now run in lifecycle effects; broader permission-state ordering still needs review. An upper React error boundary now covers Application/providers with a native safe recovery screen and UI-only reload; render/effect regressions exercise the real entrypoint. Remaining work includes broader keyboard/a11y coverage and safe handling at individual async/event boundaries.

Exercise modals, themes, long text, empty/pending/error and keyboard-only navigation. Local-data screenshot baselines must be independent of time/randomness. Automated a11y scanning complements keyboard scenarios.

Similar-track actions now retain their named button/focus while pending, reject duplicate activation and expose safe failure/retry feedback. Row action/duration slots preserve hover geometry and restore right-edge placement; embedded VKUI loading indicators keep a fixed center. Controlled regressions and scoped Firefox row/header screenshots are recorded in the testing guide; broader theme, popup and accessibility acceptance remains open.

Measure popup opening/storage-read timing before splitting JS/CSS. Current production front is about 608 kB minified JS/393 kB CSS; this motivates measurement, not a proven performance defect. Compare tab latency before introducing lazy loading.

**Acceptance:** actions are keyboard-accessible; component failures have a recoverable screen; visual changes have baseline/current screenshots; optimization claims have measurements.

## T18 Complete context and autonomous-work guidance

**Priority:** starts with T01 and continues through every stage. **Basis:** R17 and changed contracts. **Dependencies:** document each contract alongside its implementation.

Maintain small documents with distinct responsibilities:

- [Product behavior](../product/behavior.md): scenarios, expected results and browser evidence limits.
- [State/messages](state-and-messages.md): field writers, directions, readiness and invariants.
- decisions/: short ADRs for meaningful alternatives such as transport, storage ownership, auth/retry and VK data sources.
- [Fixtures](fixtures.md): construction, sanitization, upstream drift and maintenance. Corpus/media/browser adapters remain T14.
- Release runbook (not implemented): candidate, failure diagnosis and rollback with storage compatibility.

Keep AGENTS a concise entry point. Link working examples for commands, parsers, pages and migrations as implementations become reliable. Automatically validate links/version relationships/required scripts; relate product scenarios to executable checks. Navigation, language policy, implementation routes and offline documentation-reference/command checks now exist, but not all acceptance criteria are complete.

**Acceptance:** a new agent can complete a normal task without oral project history; each contract has one source, planned commands are clearly labeled and outdated instructions change alongside code. Completed tasks link implementation/evidence; the audit retains its baseline.

## Product decisions before behavior changes

Most engineering fixes need no new product preference. For ambiguous behavior document current semantics, the intended change and its verification. These recommendations are not yet accepted requirements:

| Question | Recommended direction | Owner |
|---|---|---|
| End of ordinary queue with Repeat.NONE | Stop; specify playlist/one repeat separately | T03, T07, behavior.md |
| What survives extension update? | Settings and a valid queue; recheck auth, no new install autoplay | T05, T11 |
| Temporary VK outage | Preserve local session/queue and show a temporary failure | T09 |
| Pending delete when popup closes | Explicit completed/cancelled state; UI lifetime must not decide by accident | T08 |
| Browser support | Current stable plus an explicit tested minimum baseline | T13, T14, T16 |
| Automatic merge eligibility | Predetermined change categories, required statuses and no unresolved failures | T16, GitHub settings |

Preserve existing semantics when a task does not require a disputed choice. Product-rule changes need their own before/after and observable acceptance.

## Autonomous-cycle readiness criteria

- A fresh checkout follows setup and required checks without manual environment repair.
- Significant playback/queue/auth/migration scenarios reproduce without live VK; fixed R01-R11 defects receive regressions.
- Chrome/Firefox actually run in automated checks, not just builds.
- Each async operation defines completion, failure, timeout and cancellation; obsolete completion cannot change current data.
- Failures preserve useful sanitized evidence and distinguish implementation/auth/upstream problems.
- Contract changes update verifiable context; checks are not weakened for green CI.
- Candidate/source/checks share one revision; publication access follows a separately established policy.
- Missing external access stops dependent work honestly while independent tasks can continue.

Test count/coverage alone is insufficient. Checks must detect real failures: obsolete playback, endless requests, false VK success, another account's cache and malformed storage.
