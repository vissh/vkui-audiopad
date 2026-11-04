# VK Audiopad readiness for autonomous development

Historical audit dated November 3, 2026, baseline revision `5574e83`. The objective was to determine whether an AI agent could independently understand a task, modify the project, detect regressions and prepare a verifiable release. Findings and line references below describe that baseline, not the current working tree. Translation does not change their status; current implementation progress belongs to [the roadmap](development-roadmap.md).

**The project supports AI-assisted development but was not ready for reliable operation without continuing supervision.** The main gap was behavioral verification of playback, state and VK integration. Documentation helped generate plausible code, while CI could not distinguish several significant defects from correct implementations.

See [the roadmap](development-roadmap.md) for remediation tasks and [the workflow](agent-workflow.md) for executing them.

## Verified baseline

| Check | Result at the audited revision |
|---|---|
| Working tree before audit | Clean |
| Local runtime | Node 24.22.2, npm 11.19.1 |
| npm ls --workspaces | Passed |
| npm run check | Passed |
| npm test | 35 tests in 3 files; passed |
| ./build.sh | Passed; Chrome and Firefox artifacts built |
| npm run verify:build | Passed |
| npm audit --json | 20 moderate, 0 high, 0 critical; exit 1 |
| npm audit --omit=dev --json | No vulnerabilities; exit 0 |
| Forced --noImplicitAny true | Common/offscreen passed; SW produced TS7053 at listeners/command.ts:19 |

Six defects were additionally reproduced by transpiling source TypeScript modules into an isolated Node VM with controlled storage, networking, messages and clocks. This establishes logic behavior for given inputs, not browser behavior.

This audit did not perform a clean dependency install, Docker release, authenticated VK run, real playback or Firefox launch. GitHub branch protection and permissions were not inspected. Building two directories does not prove two working browser runtimes.

## Preserve these strengths

- A small npm monorepo with understandable front/SW/offscreen/common boundaries.
- React, VKUI, TanStack Query and TypeScript are sufficient; a new platform or major framework is unnecessary.
- Discriminated messages and exhaustive switches provide compile-time router coverage.
- FSD is linted, and most data access is separated from UI.
- CI builds/tests, checks the dependency tree/public registry and inspects build output.
- Architecture instructions capture the Firefox bridge, VK encodings, opaque tokens and actual audio invariants.
- MCP configs are versioned; dependency and FSD-skill updates arrive as PRs.
- Defects can be localized without a full rewrite.

## Capability assessment

| Agent capability | Baseline readiness | Main gap |
|---|---|---|
| Find a package and start a change | Mostly ready | Stale instructions; no shared product behavior description |
| Check types/imports | Partial | Weakened strictness, permitted any, FSD exceptions, missing async error checks |
| Verify user behavior without an account | Not ready | No integration/component/browser coverage, VK fixtures or test mode |
| Change player/state safely | Not ready | Races, multiple storage writers, missing recovery/migration contracts |
| Diagnose failures automatically | Partial | Investigation guide but little structured/reproducible evidence |
| Prepare a reproducible release | Partial | Working-tree/TTY dependency; ZIP, source and checks not linked |
| Accept/deliver changes unsupervised | Not ready | Prior guarantees and an explicit automatic merge/release policy missing |

P1 means fix before expanding autonomy; P2 is the next priority. This is priority for the audit objective, not a claim that every P1 continuously affects users. "Reproduced" means an isolated diagnostic scenario; "code inspection" means static evidence.

## Playback and data findings

### R01 An old command can supersede a newer one

**P1, reproduced.** packages/service-worker/src/actions/play-new-track.ts:57, :79, :84; listeners/messages.ts starts independent actions with void.

With delayed A and fast B, B plays first, then A's completion rewrites activeTrack and starts A. Diagnostic commands [A,B] produced playback [B,A] and final A. Late full-queue hydration can also overwrite another playlist's queue.

Introduce an operation generation and check it after each await before state/audio effects. Cancel obsolete networking where possible; fetch cancellation alone cannot protect other completions. Offscreen events need source-load identity.

Acceptance: the latest current intent wins for every completion order; obsolete events/hydration cannot change its queue.

### R02 Unavailable tracks bypass the player error limit

**P1, reproduced.** packages/service-worker/src/actions/play-new-track.ts:59.

A null fetchTrackInfo result recursively selects next after 500 ms and wraps at queue end. This branch bypasses on-audio-error.ts limits. A one-unavailable-track scenario issued 13 requests before the diagnostic harness stopped it; the implementation had no stop condition.

Use bounded traversal, visited IDs, a shared budget, cancellation on new intent and a terminal error. onError's 300 ms delay is fixed; calling it backoff is inaccurate.

Acceptance: a fully unavailable playlist stops after finitely many attempts, explains why and stops issuing requests after a user command.

### R03 Handlers execute before state restoration

**P1, code risk.** packages/service-worker/src/index.ts:33, state.ts:6.

loadState runs without awaiting; listeners are then registered. The first hotkey/message may see defaults rather than the persisted queue. Restoration forces played=false without querying a live offscreen player; memory synchronization is attached after that write.

Use a shared readiness promise: register Chrome handlers synchronously, then gate async execution and retain event lifetime in a supported way. Delaying registration itself can lose the wake-up event. Reconcile snapshot and offscreen instead of unconditionally treating playback as stopped.

Acceptance: commands during storage loading use restored state; SW restart with live offscreen preserves consistent playback.

### R04 A VK error can be treated as mutation success

**P1, code inspection.** packages/common/src/vk-api-client.ts:98; front/src/features/delete-from-my-music/api/delete.ts:33.

The token client returns {error: ...} as a normal result except for its special error-5 refresh. apiDelete and setBroadcast do not check for failure. UI can execute a success callback after VK rejected the action. The delete URL also passes client_id=${vkApiClient.API_VERSION}, i.e. 5.163, instead of app ID 6287487.

Choose an explicit error/Result contract; distinguish HTTP, authorization, rate limit, format and operation failures. Fix delete parameters. GET support needs separate implementation because request currently attaches a body for any method.

Acceptance: failed refresh and ordinary VK errors do not trigger UI success; exact request parameters are verified offline.

### R05 Temporary network failure clears user state

**P1, code inspection.** front/src/features/sign-in/lib/api.ts and lib/storage.ts:10.

fetchWebToken maps network/parsing exceptions to error.type=exception. updateWebToken calls logout/clearStorage for any such error. Opening a popup during a temporary failure can delete queue/session data without VK confirming logout.

Separate unauthorized from temporary unavailability. Preserve local data and offer reconnection for temporary failures; explicit unauthorized needs its own transition. Deduplicate concurrent refreshes under the session owner.

Acceptance: a timeout does not destroy the queue; unauthorized is distinct; account switching clears prior-user data.

### R06 Pagination failures can trigger endless mutation retries

**P1, code inspection.** front/src/shared/ui/infinity-content/InfiniteContent.tsx:24.

If the sentinel remains visible, hasMore stays true and a request exhausts retry, isPending returns to false. The effect starts another mutation without respecting isError, creating an unbounded outer retry. Mutation errors are not separately passed to Content.

Stop automatic pagination on error/repeated cursor, expose explicit retry, respect active screens and replace generic any argument contracts. Consider useInfiniteQuery where it simplifies page merging.

Acceptance: persistent page failure does not generate a request stream; retry is explicit and a page is not appended twice.

### R07 Failed offscreen creation blocks later attempts

**P2, reproduced.** service-worker/src/offscreen/setup.ts:18.

creating resets only after successful await. A rejection leaves a rejected promise cached. Two sequential attempts produced only one createDocument call; the second immediately reused the old error.

Reset in finally, retain concurrent creation deduplication and coordinate create/close/listener readiness.

Acceptance: a later attempt creates the document after an initial failure; concurrent successful setup calls create one document.

### R08 Queue parameters reverse owner and audio IDs

**P2, reproduced.** service-worker/src/fetchers/queue-params.ts:4.

For 456_123 the request uses audio_id=456 and owner_id=123. Converters/other calls use owner/audio order; expected audio_id=123 and owner_id=456.

Fix ordering and extract a small validated composite-ID parser where justified. Check start_playback/listened_data without changing their contract.

Acceptance: every request uses the same composite-ID semantics, including negative owner IDs.

### R09 Clearing deleted tracks sends no messages

**P2, reproduced.** front/src/features/restore/model/deleted-tracks.ts:16.

deletedTracks is a Map, but Object.values(deletedTracks) returns an empty array. Adding one entry and clearing produced zero DELETE_TRACK messages instead of one, then discarded the Map contents.

Iterate the Map and verify delete -> tab change and delete -> restore -> tab change. Clarify deferred deletion/popup closure semantics: the Map exists only in popup memory.

### R10 Queue IDs and visible tracks diverge at a page boundary

**P2, reproduced.** service-worker/src/actions/add-to-queue.ts:45.

Visible [A,B], full IDs [A,B,C], active B: adding D after B yields IDs [A,B,D,C], but tracks.length > addToIndex excludes D at index 2, leaving UI [A,B].

Define full-queue versus loaded-page representation. Insertion must preserve visibility/order regardless of pagination/shuffle. Also check empty queues and deletion of the last track: next.ts indexes arrays without a length guard.

### R11 Cache keys do not represent data identity

**P2, code inspection.** front/src/pages/playlist-tracks/model/hooks.ts:16; general/explore/my-music hooks.

['blockPlaylist', playlist.id] collides for different owners sharing a local ID. Personal pages use constant keys without userId, and QueryClient is not explicitly cleared on account switch. My-music mutates cached results before setQueryData.

Use semantic key factories for user, owner, playlist, block and result-changing context. Cancel/reset relevant queries on session changes. Update immutably; a late prior page cannot enter a new result.

Acceptance: different owners with playlist.id=1 remain isolated; B sees no A cache; pagination notifies subscribers.

### R12 State has no explicit owner or version

**P2, architecture gap.** common/src/types.ts ApplicationState, SW storage.ts, front shared/lib/atom.ts.

Front/SW write shared fields directly; storage changes are both commands and data. SW read-modify-write relies on an asynchronously synchronized mutable snapshot. Incoming data is cast without validation; ApplicationState permits arbitrary keys through Record. Updates remove runtime state while retaining settings/controls; no schema migrations exist.

Make SW the playback/queue owner and offscreen the actual audio owner; UI sends commands/reads snapshots. Settings can remain separate. Introduce this per operation without replacing every atom at once. Version/validate persisted data; queue preservation after upgrade should be a product choice, not a side effect of clearStorage.

### R13 Audio/message errors disappear at boundaries

**P2, code inspection.** offscreen/src/handlers/play-track.ts:13, :27, handlers/play-or-pause.ts; front shared/lib/send-message.ts; both routers.

audio.play promises are discarded and fatal Hls.Events.ERROR has no handler. Most async commands use void without shared failure handling. Message types do not validate input; commands lack request IDs/results, events lack playback IDs, and transports differ between Chrome/Firefox.

Add runtime guards, serialized command outcomes, play/HLS rejection handling and correlation IDs. Define allowed senders and equal transport semantics. Failure must become observable state, not an unhandled rejection.

## Development and operations findings

### R14 Instructions are stricter than the tooling

**P2, verified through configs/commands.** common/offscreen/SW override strict with noImplicitAny=false; enabling it exposes one SW TS7053 error. Explicit any is a lint warning. Checked front rules lack no-floating-promises/no-misused-promises. Root --if-present silently skips an accidentally removed workspace check.

widgets/catalog-gallery/ui/CatalogGallery.tsx has four same-layer imports hidden by eslint-disable. This violates repository rules but does not justify removing widgets wholesale. Merge related slices or lift composition through props. The FSD skill recommends pages-first while brief instructions direct new features to features; a coherent local rule is needed.

Lint covers src only, leaving build/Vite/root scripts without equivalent checks.

### R15 CI barely verifies application behavior

**P1 for autonomy, verified.** Only three common test files/35 tests cover conversion, links and utilities. Runtime commands, storage, React UI, HLS and browser lifecycle lack coverage.

There is no sanitized VK-response corpus, component suite or local-data browser harness. AGENTS historically forbids network/Chrome tests because adapters are missing; replace that boundary with controlled offline adapters.

verify-build checks key files/fields, not all imports/icons/rules/runtime compatibility. CI builds both browsers without launching either. Required merge statuses are GitHub settings, not something the workflow enables itself.

### R16 Release artifacts are not tied to a verified revision

**P1 for autonomous delivery, code inspection.** to-publish.sh:9, :18, :28.

The script deletes local dependencies/builds and uses a shared fixed-name container with docker run -it. This is awkward for CI/parallel worktrees. Extension ZIPs use the working tree while Mozilla source uses git archive HEAD; uncommitted edits produce different source sets. Host npm install afterward can change the lockfile.

Build one revision in an isolated directory/container without TTY or host-environment mutation. Include commit, version, lockfile, checksums, source and validation evidence. Verify packaged ZIPs and publish that same candidate.

### R17 Extensive context lacks product contracts

**P2, documentation inspection.** Implementation maps exist, but shared user/failure scenarios are missing: queue end, empty playlist, shuffle/repeat, transitions between radio/Mix/ordinary playlists, popup closure, account switch, offline and SW recovery.

Concrete drift at the baseline: architecture describes Node 20/moduleResolution node while CI/Docker use Node 24 and configs use bundler; VKUI maintenance updates only OpenCode despite two configs; testing says the model cannot view images. AGENTS recommends isFirefox although it always returns false. engines/packageManager and client environment setup are not pinned. .mcp.json does not establish tool availability in every agent.

Provide short navigation, scenarios with observable outcomes, storage ownership and ADRs. Examples should reference real code and be rechecked when it changes.

### R18 Action controls lack keyboard semantics

**P2, code inspection.** front/src/shared/ui/tooltip-icon-button/TooltipIconButton.tsx:23.

An SVG owns the click action without button, tabIndex or keyboard behavior. A tooltip does not provide Tab/Enter/Space activation.

Use a suitable VKUI button with an accessible name. Check focus, disabled state, modals and two-theme contrast. Visual changes need screenshots/actual-popup inspection, not geometry alone.

### R19 Dependency updates need applicability review

**P2, npm audit evidence on the audit date.** Twenty moderate records spread through the dev tree from minimatch: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). These are not twenty independent vulnerabilities in the shipped player. --omit=dev reports zero.

npm proposes downgrades including ESLint 4 and neostandard 0.0.1; such auto-fixes are unacceptable without compatibility review. Inspect dependency paths and advisory applicability. Hls.js is pinned at 1.4.0; review its maintenance through changelogs/media tests rather than updating blindly.

CI/MCP/skills updates need explicit runtimes, minimal permissions, timeouts and pinned executable versions. The skill updater currently runs unpinned npx skills; actions use tags rather than commit SHAs. These are reproducibility/supply-chain questions, not evidence of compromise.

### R20 Diagnostics do not provide a reliable agent signal

**P2, code/instruction inspection.** Support relies on console, storage and manual probes, with no common event format tying command context to failure source. Approximate CSP/CORB counts vary with VK data.

cast.ts includes raw values in errors; vk-api-client.ts:149 includes an entire unexpected response; UI offers serializeError copying. Without redaction these diagnostics can include tokens, action hashes or personal content. No actual account leak was established by this audit.

Use a small bounded local journal with redaction, request/playback IDs, error code and build hash. Compare baseline source/types instead of ignoring arbitrary CSP noise. Persist complete VK shapes only as sanitized fixtures. External telemetry is not required.

## Architectural direction

Preserve the packages and FSD while strengthening boundaries incrementally:

1. Keep pure queue/playback operations testable without a browser, near the SW owner; move to common only for real shared consumers.
2. SW receives commands, awaits readiness and applies only current operation results through a coherent state contract.
3. Offscreen owns Audio/HLS and reports actual state with playback identity. Chrome runtime and Firefox CustomEvent adapt one protocol.
4. VK clients separate transport, decoding and format errors. DOM parsing stays in a DOM-capable context or takes Document explicitly; common must not accidentally require DOMParser in an SW.
5. Front observes state/sends commands and keys personal queries correctly. Keep the atoms if their contracts/lifecycle are verified.

Start with test boundaries and localized fixes. Replacing state management, transport, FSD and bundler simultaneously expands the unverified change surface.

## What autonomous work means

A normal task can follow task -> implementation -> deterministic checks -> failure analysis -> PR candidate without repeated manual clicking. Automatic merge additionally requires measurable conditions and real server-side enforcement.

VK remains a changing external dependency. Login, CAPTCHA, permission revocation, store decisions and publication credentials require external capabilities; architecture cannot eliminate them. Offline tests should let development continue, and live checks should report auth_required/upstream_unavailable rather than false success.

The practical goal is removing repetitive human operations while leaving explicit product/external decisions. Readiness is established by roadmap scenarios, not AGENTS.md length or the number of agents connected.
