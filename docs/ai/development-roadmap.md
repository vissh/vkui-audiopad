# Roadmap for autonomous VK Audiopad development

Based on the [November 3, 2026 audit](readiness-review.md). The goal is for an agent to implement a task and demonstrate correctness without a person manually checking every change. The progress table and T01-T18 sections separate implemented contracts from remaining acceptance work.

Order: reproducible setup -> controlled test boundaries -> defect fixes -> explicit state contracts -> browser verification -> reproducible release. Clarify product behavior before changing it. Large tasks can span sequential PRs if each leaves a usable project.

## Implementation progress

Updated November 9, 2026. Links refer to the current implementation; dated browser evidence identifies the specific build checked. A tag or green CI does not complete the remaining autonomy criteria.

| Task | Status | Implementation and evidence |
|---|---|---|
| T01 | Implemented | [.node-version](../../.node-version), [package.json](../../package.json), [doctor](../../scripts/doctor.mjs), shared CI/Docker pins. MCP derives from one .mcp.json source for Claude Code/Codex/OpenCode 1.x; [tests](../../scripts/mcp-config.test.ts)/doctor reject full-settings drift. [MCP setup](mcp.md). Clean macOS and isolated Linux Alpine checks/builds passed without verification changing the lockfile. |
| T02 | Base infrastructure implemented | [Vitest](../../vitest.config.mts), [helpers](../../tests/helpers), [React](../../tests/front/atom.test.ts), [storage](../../tests/service-worker/storage.test.ts), [transports](../../tests/offscreen/message-transport.test.ts), [decoding/network](../../tests/common/vk-client.test.ts), [timers](../../tests/service-worker/audio-error.test.ts). Tests/types/tooling lint are included; adapter limits are in testing.md. [Network-policy fault injection](../../scripts/offline-network-policy.test.ts) proves swallowed unexpected fetches still fail the suite. No offline browser e2e yet. |
| T03 | Implemented with offline coverage | Iterative unique candidates, shared missing/media/Mix budget, cancellable waits, terminal snapshot/UI error. [Queue](../../tests/service-worker/playback.test.ts) and [media retry/pause](../../tests/service-worker/audio-error.test.ts) regressions initially failed. No extra player-level network retry. |
| T04 | Implemented with offline coverage | Network cancellation, current operation/revision, serialized commits, post-offscreen guard, playbackId, old Audio/HLS isolation. [Operation](../../packages/service-worker/src/playback-operation.ts), [delivery](../../tests/service-worker/offscreen-ordering.test.ts), [lifecycle](../../tests/offscreen/player-lifecycle.test.ts), [ADR](../decisions/0001-playback-operations.md). |
| T05 | Core implemented; live restart evidence pending | Shared SW toggle intent, synchronous listener registration, readiness and existing-media reconciliation. [ADR 0002](../decisions/0002-startup-recovery.md), [startup regressions](../../tests/service-worker/startup.test.ts). Firefox startup now waits boundedly for its audio module listener, fixing a live observed initialization failure with a controlled late-listener regression. Isolated live Chrome worker termination/restart remains unverified; durable operation recovery is T11. |
| T06 | Core implemented with controlled coverage and scoped Chrome/Firefox smoke | Bounded/cancellable listener readiness, serialized close/create/send, current idle-document validation and source request/revision guards for HLS/play promises. [ADR 0003](../decisions/0003-offscreen-lifecycle.md), [lifecycle races](../../tests/service-worker/offscreen-lifecycle.test.ts). Real idle cleanup/reload and stale-close rejection observed in Chrome; native Audio/Mix/pause and UI-tab reopen checked in Firefox. Real HLS decoder/network and minimum-version matrices remain. |
| T07 | Core implemented with controlled coverage and Chrome smoke | R08 owner/audio order fixed. R10 insertion/removal/index/shuffle defects now use [pure rules](../../packages/service-worker/src/queue.ts), serialized mutations and hydration/page merging; [ADR 0004](../decisions/0004-queue-mutations.md), [action regressions](../../tests/service-worker/queue-actions.test.ts), [editor tests](../../tests/front/queue-editor.test.ts). Real partial queue paging, play-next, shuffle restore, remove/apply and native drag/apply checked in Chrome. Durable queue edits and browser automation remain T11/T14. |
| T08 | Implemented with controlled coverage and scoped live checks | Correct Map drain, delete/restore registration, navigation generations and pending-restore ordering. Named/guarded VKUI controls, source-specific restore and confirmed mutation outcomes. [ADR 0006](../decisions/0006-library-delete-restore.md), [website comparison](../product/vk-parity.md). Popup closure explicitly retains the queue. Applied queue acknowledgements remain T12. |
| T09 | Shared session owner and bounded token methods implemented; legacy/account-wide work remains | Inconclusive verification preserves session/queue and exposes explicit retry ([ADR 0005](../decisions/0005-session-verification.md)); safe token-method errors, deadlines and one auth retry follow [ADR 0008](../decisions/0008-vk-api-errors.md). [ADR 0009](../decisions/0009-session-owner.md) centralizes background refresh/verification/persistence, shares refresh work across contexts and guards token-method completion with userId/sessionEpoch. Three initial regressions reproduced duplicate refresh, stale token overwrite and prior-account response acceptance. Add/delete/restore/follow validate confirmed results; remaining legacy mutations, account-wide cancellation and cross-window invalidation remain. |
| T10 | Core cache/pagination implemented; broader session/browser cases remain | Bounded active-page pagination and explicit retry, per-account QueryClient retirement, complete page keys, original-variable/cursor guards and immutable ID merges. [ADR 0007](../decisions/0007-query-identity-and-pagination.md), [identity regressions](../../tests/front/query-identity.test.ts). Playlist mutations invalidate the initiating account's library, catalog, detail and show-all queries. Cross-window propagation, full legacy/token-resolution cancellation and broader source evidence remain. |
| T11 | Planned | No schemaVersion, migration registry or durable queue-edit recovery yet. UPDATE still clears runtime data while retaining settings. [Storage task](#t11-version-persisted-state). |
| T12 | Partial | PLAY_TRACK/AUDIO_PLAYER carry playbackId across both transports; explicit play/pause added. Session requests validate sender/input/replies and provide correlated bounded results/cancellation ([ADR 0009](../decisions/0009-session-owner.md)). General playback/queue validation, results and sender policy remain. |
| T13 | Partial | Doctor requires workspace scripts; --if-present removed; tooling lint/test typecheck added. All four packages now use full TypeScript strictness, explicit any is a lint error and [compiler regressions](../../scripts/type-safety.test.ts) reject weakening. TypeScript is pinned to one version across root/workspaces. Type-aware async lint and FSD composition remain. |
| T14 | Partial: authenticated Chrome/Firefox and isolated Firefox runtime smoke | Authenticated catalog/search, playback/Mix, pause/resume, next/previous, three rapid next commands, popup closure, modals and upgrade checked through MCP. [Evidence/limits](testing.md#live-run-november-3-2026). smoke:firefox installs a temporary addon in a fresh headless Firefox via the shared Mozilla MCP and checks actual startup, snapshot transport and applied repeat commands without VK. CI runs this with Firefox 159.0 after both builds. Authenticated Firefox session verification, catalog/search, native playback/Mix/pause and UI-tab reopen now have [scoped evidence](testing.md#authenticated-firefox-follow-up-november-4-2026). Actual Firefox popup, minimum-version/HLS matrix and a full offline UI browser suite remain. |
| T15 | Planned | Safe typed errors cover some boundaries; no bounded cross-context diagnostic journal/export with tested redaction yet. [Diagnostics task](#t15-add-safe-diagnostics). |
| T16 | Partial: UI-driven version commit, GitHub release workflow and revision-bound packaging | [Workflow](../../.github/workflows/release.yml) accepts a new version, prepares its local commit and checks/tests/builds/smokes it. A separate write job pushes the verified commit/tag atomically and creates the release from the retained candidate. [Packaging](../../scripts/package-release.mjs), [preparation](../../scripts/prepare-release.test.ts) and [publication](../../scripts/publish-release.test.ts) tests cover ZIP/source identity, version guards, moving master, rejected tag, retries and existing releases; [runbook](../releases.md). First hosted run, full store/resource lint, minimum-version matrix, bit reproducibility and legacy Docker helper isolation remain. |
| T17 | Partial; accessibility gaps remain | Add/follow, delete/restore and similar use named guarded VKUI buttons; busy actions preserve focus, reject duplicate activation and show safe errors. Follow Enter/Space and [similar row/header spinner placement](testing.md#similar-action-layout-and-loading-november-4-2026) checked live. Root render/lifecycle recovery covers providers, keeps storage and exposes focused UI reload; [regressions](../../tests/front/ui-recovery.test.ts) and live injected-fault recovery passed. Player/icon-tab names, independent controls, landmarks, inactive panels and keyboard behavior now have controlled axe and live checks. Default-palette contrast and spoken VoiceOver/NVDA verification remain open. Popup/modals inspected; 780x600 UI tab has no whole-page horizontal overflow. Full spoken-AT/browser acceptance remains open. |
| T18 | Context, release guidance and extension-skill discovery expanded; incomplete | [Guide](../README.md), [contributing](../../CONTRIBUTING.md), [product](../product/behavior.md), [state/messages](state-and-messages.md), [fixtures](fixtures.md), [release runbook](../releases.md), workflow routes and playback ADR now exist. Project-authored docs/instructions use one English version. [docs:check](../../scripts/check-documentation.mjs) rejects broken local links/anchors, documented command entrypoints and duplicated Claude instructions, with fault-injection tests. The project-owned extension skill and tooling research route agents to browser-specific contracts; Claude aliases the canonical skills directory and OpenCode uses it directly, with drift/link regressions. Hosted release verification, rollback/storage compatibility and full scenario-to-check mapping remain. |

Lyrics follow-up: the player now exposes an availability-gated VKUI reader using audio.getLyrics, with cancellation, account/track cache identity and safe retry. [Product contract](../product/behavior.md#track-lyrics), [API tests](../../tests/common/audio-lyrics.test.ts), [Player DOM tests](../../tests/front/lyrics.test.ts) and [Chrome tab/popup evidence](testing.md#lyrics-reader-november-4-2026) describe the implemented scope. Synchronized lyrics are not part of this reader; this does not close the broader T09/T10/T14/T17 items.

## Next implementation increments

Shared session ownership, bounded token methods, catalog/playlist parity, React profiling and the core keyboard/semantic fixes are implemented. Choose the next change from the remaining acceptance work below. Preserve T/R IDs for links to the historical audit.

| Order | Task | Remaining result and verification |
|---|---|---|
| 1 | T12 validated command results | Extend the session request/result pattern to playback and queue commands. Validate malformed/sender/missing-receiver/late-result cases through both transports. |
| 2 | T11 versioned storage | Define migrations for fresh, legacy and malformed snapshots, quota/write failure and queue preservation across UPDATE. |
| 3 | T14 offline browser UI | Exercise the actual extension frontend/runtime against local data/media in CI, with sanitized failure artifacts and both browser contexts. |
| 4 | T05/T06 lifecycle and compatibility | Verify isolated Chrome worker termination during playback, native HLS failures, Firefox toolbar-popup lifetime and declared minimum versions. |
| 5 | T09/T10 remaining mutations/cache | Complete legacy account-wide cancellation and broadcast/result contracts. Propagate confirmed library changes across open UI windows. |
| 6 | T15 diagnostics | Add bounded correlated local events with tested redaction, retention and export. |
| 7 | T13/T17 async and accessibility | Add type-aware async lint and resolve remaining FSD composition. Complete spoken VoiceOver/NVDA verification and review default-palette/image contrast. |
| 8 | T16 delivery | Exercise the hosted release workflow and failure recovery. Complete store/resource lint, browser minimum-version and reproducibility checks. |
| Continuous | T18 maintained context | Keep contracts, evidence, [UI debugging](ui-debugging.md), release guidance and scenario-to-check routes synchronized. |

Implemented product scope is owned by [behavior](../product/behavior.md), including catalogs, playlist editing/covers, Mix settings and sources, friends/curators, radio, player controls and accessibility. The [dated parity](testing.md#catalog-and-playlist-parity-follow-up-november-7-2026), [performance](testing.md#startup-and-interaction-performance-november-8-2026) and [accessibility](testing.md#accessibility-and-collage-checks-november-8-2026) checkpoints retain their original build/scope limits. The audit at 5574e83 remains historical evidence.

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

Implemented. Runtime pins, doctor, workspace checks and generated MCP settings follow [maintenance](maintenance.md) and [MCP setup](mcp.md). [Configuration regressions](../../scripts/mcp-config.test.ts) cover client drift and the React discovery flag.

Maintain these contracts during dependency/tool changes. Fresh supported checkout setup and checks must preserve the lockfile.

## T02 Add runtime test boundaries

Implemented for controlled Node/jsdom scenarios. [The test harness](testing.md#automated-tests-without-vk) provides storage, runtime, fetch, Audio, timers and deferred-completion adapters. Unexpected fetches fail even when product code catches them. Production consumers use common/dist, and tests resolve common/src.

The remaining browser/local-media suite belongs to T14. Extend existing adapters for each regression and retain their stated limits.

## T03 Bound traversal of unavailable tracks

Implemented under [ADR 0001](../decisions/0001-playback-operations.md). Unique traversal, cancellable delays and the shared missing/media/Mix budget terminate unavailable queues and publish safe feedback.

[Playback](../../tests/service-worker/playback.test.ts) and [audio-error regressions](../../tests/service-worker/audio-error.test.ts) cover finite attempts, cancellation and explicit retry. Native HLS compatibility remains under T06.

## T04 Reject obsolete playback results

Implemented under [ADR 0001](../decisions/0001-playback-operations.md). Operation revisions, serialized commits, post-await guards and playbackId isolate obsolete track, queue, Mix and media completions.

Preserve [deferred playback cases](../../tests/service-worker/playback.test.ts), [delivery ordering](../../tests/service-worker/offscreen-ordering.test.ts) and [source lifecycle tests](../../tests/offscreen/player-lifecycle.test.ts) when changing this path.

## T05 Define playback recovery and ownership

Core implementation follows [ADR 0002](../decisions/0002-startup-recovery.md). Synchronous registration and bounded readiness reconcile an existing media snapshot without autoplay. The SW owns queue/intent, and the audio context owns actual media. Toggle commands share requested intent independently of delayed storage/media observation.

[Startup](../../tests/service-worker/startup.test.ts), [snapshot transport](../../tests/offscreen/player-snapshot.test.ts) and [intent tests](../../tests/service-worker/playback-intent.test.ts) cover controlled recovery and early commands. Remaining acceptance requires isolated Chrome worker termination/restart during playback. Durable operation recovery belongs to T11, and general applied-command replies to T12.

## T06 Recover offscreen after failures

Core implementation follows [ADR 0003](../decisions/0003-offscreen-lifecycle.md). Shared lifecycle serialization, bounded listener readiness, current-document idle checks and source-local revision guards handle close/create/play and late HLS/play callbacks.

[Lifecycle races](../../tests/service-worker/offscreen-lifecycle.test.ts), [activity checks](../../tests/offscreen/activity-checker.test.ts) and [Audio/HLS tests](../../tests/offscreen/player-lifecycle.test.ts) cover controlled failures. Native Chrome idle cleanup and Firefox runtime have scoped evidence. Remaining acceptance includes real HLS decoder/network failures and minimum browser versions.

## T07 Fix and isolate queue operations

Core implementation follows [ADR 0004](../decisions/0004-queue-mutations.md). Pure rules and serialized mutations distinguish full IDs from loaded metadata, preserve selection/order and merge hydration edits. The UI observes worker snapshots, and current-queue editing supports dragging plus keyboard movement.

[Queue rules](../../packages/service-worker/src/queue.ts), [action regressions](../../tests/service-worker/queue-actions.test.ts) and [editor cases](../../tests/front/queue-editor.test.ts) are the owning checks. Applied acknowledgements and durable edits remain T12/T11.

## T08 Fix deletion and restoration

Implemented under [ADR 0006](../decisions/0006-library-delete-restore.md). VK mutation lifetime is separate from local queue cleanup. Navigation expires pending restore state, and popup closure retains the queue. Controlled and scoped live checks cover late results, restore ordering and safe failure.

Preserve the [parity reference](../product/vk-parity.md) and delete/restore regressions. General applied queue-command replies remain T12.

## T09 Define VK/session error contracts

**Priority:** P1. **Basis:** R04, R05, part of R20. **Dependencies:** T02.

Popup session verification is implemented as a bounded subset: transient failures preserve local data, confirmed unauthorized still clears associated data, and manual retry replaces automatic session-query retry ([ADR 0005](../decisions/0005-session-verification.md)). General error/refresh contracts and cross-context isolation are not complete.

audio.delete app-ID consistency and delete/restore success validation are addressed under T08; both old/new client_id values worked in live A/B. Token-method error/HTTP/GET/deadline contracts are implemented in [ADR 0008](../decisions/0008-vk-api-errors.md). Add/follow shape validation and guarded failure feedback have [adapter](../../tests/front/library-add-follow.test.ts) and [control](../../tests/front/library-action-controls.test.ts) regressions plus live comparisons. Shared refresh/session ownership now follows [ADR 0009](../decisions/0009-session-owner.md). Remaining work includes the other mutation adapters, legacy/account-wide cancellation and cross-window cache invalidation. Choose an explicit failure contract, operation-appropriate retry and observable outcome for each boundary. Never blindly repeat a mutation with ambiguous completion.

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

Discriminated unions, exhaustive switches and event playback IDs are implemented. Session requests already validate unknown input and return correlated bounded outcomes. Extend these guarantees to playback and queue commands with validated payloads, command request IDs, serialized results, reply lifetimes and sender policy. Cover timeouts, missing receivers and unsupported messages.

Make Chrome runtime/Firefox CustomEvent adapters implement the same contract, including command completion/failure. Do not add transport versioning without a compatibility scenario; still handle old/unknown messages explicitly.

**Acceptance:** malformed payloads cause no effect; errors survive serialization; results are observable; obsolete events are rejected; missing receivers cannot wait forever; both transports pass shared contract scenarios.

**Validation:** adapter contract tests, check and full build.

## T13 Align architecture rules and tooling

**Priority:** P2. **Basis:** R14. **Dependencies:** T02; avoid concurrent wholesale FSD restructuring.

Implicit-any overrides are removed; command indexing was already corrected during playback work. Compiler regressions now exercise implicit parameters, nullable access and callback variance under each actual workspace config. Explicit any is an ESLint error. Introduce type-aware no-floating-promises/no-misused-promises with actual failure handling: void is not enough. Start at changed/new boundaries, then remaining code. Keep no-explicit-any as an error; handle exceptional external data as unknown and validate it.

Resolve catalog-gallery composition by merging related slices or composing above them through props. Remove four suppressions while preserving scenarios. Adopt coherent pages-first/extraction guidance in AGENTS; do not mechanically remove widgets. Keep shared public APIs focused instead of a giant barrel.

Workspace typecheck/lint, owned tooling checks and all-client MCP consistency including VKUI_VERSION are enforced. Keep vendored unmask.js outside formatting/type changes. Remaining build-target acceptance needs the supported-browser matrix in T14/T16.

**Acceptance:** new boundary/async violations fail validation; missing scripts are detected; rules are not weakened for green CI; layers/dependencies do not grow without cause.

## T14 Add browser checks with local data

**Priority:** P1 for autonomy. **Basis:** R15. **Dependencies:** T02 and main scenario fixes.

Build on the existing Chrome extension MCP flow and official Mozilla MCP runtime probe. Add an isolated local-data frontend/media path in each browser after proving the exact CI launch and popup support.

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

**Partial implementation:** the manual [GitHub workflow](../../.github/workflows/release.yml) prepares a version commit from master and gates its atomic commit/tag push and release creation on checks, tests, both builds, artifact verification and Firefox smoke. Packaging, matching HEAD source, identity and checksums have [controlled tests](../../scripts/package-release.test.ts); [publication tests](../../scripts/publish-release.test.ts) use isolated local Git remotes and a controlled release-API adapter. The [runbook](../releases.md) owns versioning, store uploads and retry policy. Hosted execution remains to be confirmed after merging the workflow; the remaining requirements below are not claimed complete.

Build one revision in an isolated checkout/container instead of the dirty working tree. Remove TTY/fixed container-name conflicts. Install reproducibly without host npm install recovery. Pin/review the build image separately.

Retain Chrome/Firefox ZIPs, matching source, checksums, metadata and checks. Validate unpacked artifacts and all manifest/HTML/module resources; use browser/store manifest tools and test supported versions. Normalize timestamps/ordering and compare two builds before promising bit-for-bit reproducibility.

CI needs minimal permissions, timeout, concurrency and diagnostic/artifact publication. Review advisory applicability; do not force npm audit fixes proposing incompatible downgrades. Update Hls.js/MCP/skills/actions in separate compatible changes and pin executable tooling.

**Acceptance:** build does not mutate checkout/lockfile; ZIP/source/checks share one revision; the published candidate is the verified one. Required statuses/branch protections must be enabled server-side with an explicit automatic merge/release policy; this plan does not enable it.

## T17 Verify UI and accessibility

**Priority:** P2. **Basis:** R18 and parts of R13/R15. **Dependencies:** T02; visual cases use T14.

Named VKUI action buttons, keyboard handling, independent controls, panel/list semantics and modal focus have implementation and regression coverage. Playlist triggers suppress restored-focus hints, and row actions distinguish pointer from keyboard focus. SignIn permission/auth side effects now run in lifecycle effects; broader permission-state ordering still needs review. An upper React error boundary now covers Application/providers with a native safe recovery screen and UI-only reload; render/effect regressions exercise the real entrypoint. Remaining work includes spoken VoiceOver/NVDA verification, default-palette/image contrast review, deterministic local-data browser screenshots and safe handling at individual async/event boundaries.

Exercise modals, themes, long text, empty/pending/error and keyboard-only navigation. Local-data screenshot baselines must be independent of time/randomness. Automated a11y scanning complements keyboard scenarios.

Similar-track actions now retain their named button/focus while pending, reject duplicate activation and expose safe failure/retry feedback. Row action/duration slots preserve hover geometry and restore right-edge placement; embedded VKUI loading indicators keep a fixed center. Controlled regressions and scoped Firefox row/header screenshots are recorded in the testing guide; broader theme, popup and accessibility acceptance remains open.

The [startup and interaction comparison](testing.md#startup-and-interaction-performance-november-8-2026) now records before/after per-tab React costs and separate production traces. Main pages mount on first visit and retain visited state. Selective row observers, stable catalog merges, 30-second query freshness and viewport preview loading reduce measured startup/interaction work. The [November 9 audit](testing.md#additional-performance-and-design-audit-november-9-2026) identified the initial full queue mount, its action/tooltip tree and forced layout. [Deferred action preparation and row containment](testing.md#deferred-track-actions-and-scroll-november-9-2026) now reduce that rendering cost in a controlled 278-track browser benchmark. Authenticated catalog startup and longer-session retained DOM still need comparable follow-up measurements. Warm five-tab returns reuse queries and have low React cost, while retained DOM growth still needs longer-session measurement. Preserve keyboard/screen-reader discovery and draft/focus lifetimes when evaluating bounded queue rendering. Measure current production artifacts and repeat comparable scenarios before further splitting JS/CSS.

The [November 8 accessibility/collage follow-up](testing.md#accessibility-and-collage-checks-november-8-2026) covers named independent controls, valid list/panel structure, route focus, keyboard queue ordering, native seek input, hidden skeletons and system accessibility preferences. It preserves the normal pointer appearance. Home now uses legacy HTML only after an initial token-catalog failure, and collage parsing retains all server thumbnails even when `photo` repeats their first tile.

**Acceptance:** actions are keyboard-accessible; component failures have a recoverable screen; visual changes have baseline/current screenshots; optimization claims have measurements.

## T18 Complete context and autonomous-work guidance

**Priority:** starts with T01 and continues through every stage. **Basis:** R17 and changed contracts. **Dependencies:** document each contract alongside its implementation.

Maintain small documents with distinct responsibilities:

- [Product behavior](../product/behavior.md): scenarios, expected results and browser evidence limits.
- [State/messages](state-and-messages.md): field writers, directions, readiness and invariants.
- decisions/: short ADRs for meaningful alternatives such as transport, storage ownership, auth/retry and VK data sources.
- [Fixtures](fixtures.md): construction, sanitization, upstream drift and maintenance. Corpus/media/browser adapters remain T14.
- [Release runbook](../releases.md): version workflow, verified candidate/assets, atomic commit/tag publication, retry policy and reference identity. Hosted execution, delivery policy and validated rollback/storage compatibility remain T16/T11.

Keep AGENTS a concise entry point. Link working examples for commands, parsers, pages and migrations as implementations become reliable. Automatically validate links/version relationships/required scripts; relate product scenarios to executable checks. Navigation, language policy, implementation routes and offline documentation-reference/command checks now exist, but not all acceptance criteria are complete.

**Acceptance:** a new agent can complete a normal task without oral project history; each contract has one source, planned commands are clearly labeled and outdated instructions change alongside code. Completed tasks link implementation/evidence; the audit retains its baseline.

## Product decisions before behavior changes

Most engineering fixes need no new product preference. For ambiguous behavior document current semantics, the intended change and its verification. Preserve accepted contracts below; recommendations on unresolved rows are proposals, not implemented requirements.

| Question | Status and direction | Owner |
|---|---|---|
| End of ordinary queue with Repeat.NONE | Unresolved: recommend stopping; current ordinary queue wraps. Specify playlist/one repeat separately before changing it. | T03, T07, behavior.md |
| What survives extension update? | Unresolved: recommend settings and a valid queue, recheck auth, no new install autoplay. Current UPDATE clears runtime/queue data. | T05, T11 |
| Temporary VK outage | Implemented verification contract: preserve local session/queue on inconclusive failure and show explicit retry. Shared background refresh follows ADR 0009; legacy/account-wide isolation remains open. | T09, ADR 0005/0009 |
| Pending delete when popup closes | Accepted and implemented: retain the local queue; the restore window ends. Navigation instead applies deferred queue deletion; successful restoration cancels it. | T08, ADR 0006 |
| Browser support | Unresolved: recommend current stable plus an explicit tested minimum baseline. Manifest minimum declarations alone are insufficient. | T13, T14, T16 |
| Automatic merge eligibility | Unresolved: define eligible changes, required statuses and failure policy, then enforce server-side. | T16, GitHub settings |

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
