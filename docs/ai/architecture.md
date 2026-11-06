# VK Audiopad architecture

Read this before cross-package work. [State/messages](state-and-messages.md) explains ownership; [product behavior](../product/behavior.md) describes user scenarios.

## Runtime contexts

Three packages provide separate runtime contexts; common supplies their shared library:

```text
front (popup or tab) -- commands --> service-worker -- commands --> offscreen
       ^                                  ^                       Audio/HLS
       | Chrome storage snapshot          | playbackId events         |
       +----------------------------------+---------------------------+
```

- **Front** renders index.html through the manifest's action.default_popup; the same page can open in a tab. Closing a popup destroys that UI instance, not the audio context. Persistent UI/playback fields are restored from storage; the QueryClient and temporary atoms are recreated.
- **Service worker** orchestrates playback, queues, playlist resolution, VK playback requests and badges. Chrome can terminate it when idle. applicationState is a mutable memory snapshot loaded through state.ts/storage.ts, not durable storage itself. Chrome registers handlers synchronously; shared readiness gates actions until storage and existing media reconcile. See [startup ownership](../decisions/0002-startup-recovery.md) for behavior and limits.
- **Offscreen** owns Audio and hls.js. Its source-local requested state prevents late HLS startup after pause. One Audio is active at a time; changing sources replaces the element and destroys old HLS/listeners. Media events return to the SW as AUDIO_PLAYER_* messages.
- **Common** contains domain/protocol types, VK clients, converters and utilities. It has no independent runtime process.

Catalog queries can run directly from front through common clients. Session verification/refresh and persistence have one background owner; [ADR 0009](../decisions/0009-session-owner.md) defines its validated request/reply contract. The SW is not a proxy for every VK method or catalog request.

### Firefox runtime

Firefox has no Chrome offscreen Documents API. offscreen.html also loads service-worker.js, so both packages run in one background page.

- service-worker/src/index.ts checks document availability and offscreenDocumentSupport() to avoid starting SW listeners twice.
- Runtime messaging does not provide the required communication between scripts in the same page. sendBackgroundMessage/addBackgroundMessageListener in common/utils.ts use CustomEvents on the #custom-events element. The SW enables this bridge when offscreen support is absent.
- commonUtils.isFirefox() currently always returns false. Do not use it for new transport decisions.

build.sh installs the appropriate public/environment-{chrome,firefox}.json as environment.json. offscreenDocumentSupport() fetches and caches its offscreen-document-support flag. Check both runtime modes when changing browser APIs, globals or message lifecycle.

## Messages

[common/types.ts](../../packages/common/src/types.ts) defines MessageTarget, MessageType and discriminated ServiceWorkerMessage/OffscreenMessage unions. SW and offscreen routers use exhaustive switches with assertUnreachable. A new union member must have a receiving branch; weakening types defeats this check.

Front sends through shared/lib/send-message.ts. Toggle controls send TOGGLE_PLAYBACK to SERVICE_WORKER; SW flips synchronous intent and publishes playbackRequested separately from played. Boolean PLAY_OR_PAUSE still expresses an explicit state. PLAY_TRACK and AUDIO_PLAYER_* carry playbackId, allowing obsolete events to be discarded. [ADR 0001](../decisions/0001-playback-operations.md) owns the concurrency contract.

Serialize errors across message boundaries with serialize-error. Static types are not runtime validation. Startup uses a correlated, timed snapshot exchange over both transports. Current wrappers/routers do not provide a unified command completion response or sender policy; see T12 and [the state guide](state-and-messages.md).

## State and frontend composition

[shared/lib/atom.ts](../../packages/front/src/shared/lib/atom.ts) provides atom(), lsAtom() for localStorage strings, and storageAtom() for asynchronous Chrome storage loading/events and mutation hooks. React reads use useSyncExternalStore through useAtom/useAtomValue. Server data uses TanStack Query, provided by app/SessionQueryProvider.tsx with a separate client/tree per stored userId; page fetchers generally live in pages/*/api/fetchers.ts.

Important UI state: entities/active-track, entities/session (userId), entities/modal and shared/model/active-tab-atom.ts. Theme uses localStorage rather than the similarly named Chrome storage default. SW state.ts/storage.ts hold the in-memory snapshot and persistence wrappers; listeners/storage.ts still turns several control changes into side effects. Current-queue edits and metadata page merging now go through SW commands and the serialized writer; [ADR 0004](../decisions/0004-queue-mutations.md) separates loaded metadata, full IDs, restore order and transient hydration edits. Full field responsibilities are documented once in [state/messages](state-and-messages.md).

Changing stored userId intentionally remounts the query-provider subtree, retiring both its private cache and transient React state ([ADR 0007](../decisions/0007-query-identity-and-pagination.md)). AppModalRoot consumes modal requests with saveHistory=false and lets VKUI allocate a fresh instance ID. Reusing the modal kind as its ID can swallow a reopen while the old instance is still animating out; [modal regressions](../../tests/front/modal-reopen.test.ts) cover repeated opening and reopening during close with the real VKUI manager.

Pages.tsx mounts each main page on its first visit and retains visited pages until the account/UI tree retires. Memoized page and catalog boundaries skip unchanged inactive content. Catalog merging/enrichment retains references during loading-state changes. Track rows observe their own played/paused/inactive snapshot and queue existence through selective useSyncExternalStore hooks. Media-time and unrelated queue-metadata updates do not rerender every row. [Render-isolation regressions](../../tests/front/render-isolation.test.ts) cover page retention, changed track identities and restore-window expiry.

React 19 runs only in front, but root devDependencies also contain @types/react and @types/react-dom for UI dependency resolution. Removing them requires clean-install/typechecking evidence. All packages currently use moduleResolution: bundler; the historical explanation based on node resolution is obsolete.

The shared InfinityContent is a typed pagination boundary: active page, explicit list scope/cursor, one automatic attempt per cursor and manual retry after failure/stall. It does not own query keys or merge responses. Page-owned account/source keys, retirement and immutable cursor-guarded merges follow [ADR 0007](../decisions/0007-query-identity-and-pagination.md). Broader token/session invalidation remains T09/T10.

Offline integration adapters live under tests/helpers/. Test-only aliases resolve common to source; production continues resolving common/dist. See [testing](testing.md) for adapter limits.

### UI failure boundary

The entrypoint wraps Application (including its providers) in app/ApplicationErrorBoundary.tsx. Render/lifecycle failures produce a provider-independent native recovery screen; root onCaughtError logs only a fixed safe diagnostic. Recovery reloads the UI document, without storage cleanup or extension/runtime reload. Event-handler/async failures remain the action owner's responsibility. [Entrypoint regressions](../../tests/front/ui-recovery.test.ts) inject render/effect failures and verify safe output, focus and unchanged storage.

## VK integration

Both clients live in common:

- vk-api-client.ts uses token-based api.vk.ru/method/* endpoints (app ID 6287487), typed safe errors and a shared 15-second request budget with one auth refresh/retry; [ADR 0008](../decisions/0008-vk-api-errors.md). Credentials come from the background session owner. Token methods capture/check userId plus sessionEpoch and reject retired-account completion; legacy/account-wide invalidation remains T09/T10.
- vk-client.ts scrapes internal vk.ru endpoints, preserving FormData and windows-1251 -> UTF-8 handling. Its legacy reconnect refreshes cookies via vk.ru before retrying a 401.
- Front features/sign-in requests verification through common/session-client.ts and renders safe retry/sign-in outcomes. service-worker/session.ts owns token/profile checks, shared refresh, session epochs and serialized cleanup/persistence. [ADR 0005](../decisions/0005-session-verification.md) preserves transient/confirmed outcomes; [ADR 0009](../decisions/0009-session-owner.md) defines cross-context ownership and remaining account/cache limits.
- service-worker/src/fetchers/unmask.js is vendored minified audio_api_unavailable URL decoding. Do not edit/format it.

Playback: SW track-info resolves the URL (including unmask; Mix uses token API) -> PLAY_TRACK with playbackId -> new offscreen Audio with HLS/direct source -> media events with that ID -> guarded SW storage snapshot -> observing UI. start-playback.ts notifies VK of playback; it does not resolve media URLs.

The November 2026 catalog uses opaque tokens. Server HTML for /music/catalog/* and /artist/* is a SPA shell without sectionId. Resolve a token from showAllLink or the appropriate catalog.getAudioArtist/catalog.getAudio call, then pass it to the existing legacy load_catalog_section endpoint. Keep getCatalogBlocks downstream parsing. Read [the integration guide](vkru-scraping.md) before changing formats or adding data.

## Builds and distribution

Vite builds each package. Every ./build.sh invocation rebuilds common first, even when its dist already exists, then builds the requested consumers and assembles Chrome/Firefox distributions. A partial build reuses other consumer outputs; use a full build after cross-package changes. [Build-script regressions](../../scripts/build.test.ts) verify ordering, fresh common output and failure propagation. Node is pinned in .node-version; npm in root packageManager. Doctor checks local setup without networking.

public/manifest.js generates manifests with browser differences, extension version, permissions, commands and CSP. public/rules/vkcom.json contains declarativeNetRequest rules. dist/ is generated and untracked.

to-publish.sh uses Docker node:<.node-version>-alpine and scripts/container-build.sh for the pinned npm, creates browser ZIPs and a git archive for Mozilla review. It still cleans local artifacts/dependencies and can package a dirty working tree against HEAD source. Release isolation is T16; use build.sh for everyday work.

## Front map

| Layer | Current contents |
|---|---|
| app | Application, VKUI providers/layout, Pages.tsx routing and SessionQueryProvider |
| pages | general, explore, my-music, albums, artist, search-result, current-playlist, playlist-tracks |
| widgets | player, navigation, album-list, track-list, banner/catalog/recommended galleries, vk-mix |
| features | User actions: playback, shuffle/repeat, search, queue/library editing, restore, sign-in, broadcast |
| entities | active-track, album, modal, recommended-playlist, session, track |
| shared | api, atom/message helpers, model, types and reusable UI wrappers |

Imports go downward through FSD layers and through public index.ts APIs; @conarti/eslint-plugin-feature-sliced enforces boundaries. Use the installed FSD skill for structural decisions. Existing widgets do not require mechanical removal; unresolved cross-imports/composition are tracked under T13.

## Playback invariants and pitfalls

- Consumers need common/dist before typechecking. check builds it; manual workspace commands may not.
- service-worker.js runs both as a Chrome SW and a Firefox background-page script. Browser API changes must work in both.
- Node type declarations affect timer types. Use ReturnType<typeof setTimeout>, not number.
- Internal VK response formats can change without any repository change. Compare relevant responses and sanitized fixtures rather than guessing from the live site's classes.
- Do not set Audio.crossOrigin in offscreen. VK Mix media can come from *.okcdn.ru without CORS headers; anonymous crossOrigin caused immediate media error code 4. VK host_permissions do not imply CDN CORS support.
- Offscreen idle cleanup is a request, not local destruction. Chrome setup/readiness/send/close share one queue; document/source/activity identities reject stale close requests. See [ADR 0003](../decisions/0003-offscreen-lifecycle.md).
- Media error must remain AUDIO_PLAYER_ERROR, never ENDED. Missing URLs and media errors share the bounded, cancellable operation budget; exact limits/delays live in the ADR.
- A green build and working popup do not establish SW restart recovery, all queue semantics or Firefox playback. Track evidence and gaps in testing/roadmap.
