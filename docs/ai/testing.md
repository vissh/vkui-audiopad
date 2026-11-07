# Testing and debugging

This guide covers offline verification and live extension checks. See [the workflow](agent-workflow.md) for choosing checks and [fixtures](fixtures.md) for reusable test data.

## Automated tests without VK

npm test uses one Vitest runner configured in vitest.config.mts. Default environment: Node. React and DOM/Firefox-bridge tests use @vitest-environment jsdom and React Testing Library. Pure common tests remain beside source; integration tests live in tests/, tooling tests in scripts/*.test.ts. typecheck:tests and lint:tooling are included in check.

Test-only aliases resolve @vk-audiopad/common to its source index and @/ to front/src, so tests work after npm ci without building common/dist. Production resolution is unchanged. Integration adapters stay outside production src, and common declarations exclude colocated tests.

Each test gets a fresh module cache and a fetch that rejects unexpected requests through tests/setup.ts. The default fetch also records accidental calls: afterEach fails the test even if product code catches that rejection. Install an explicit adapter for intended network failures; catching the default error is not a fixture. Stub networking explicitly; Vitest restores configured mocks/globals and afterEach restores real timers. Never use personal cookies, real tokens or signed media URLs.

| Helper | Supported behavior |
|---|---|
| tests/helpers/chrome.ts: createChrome | Minimal global Chrome API. Async cloned storage, callback/Promise forms, removal/events, runtime.lastError through failNextStorageOperation. Snapshots cannot mutate storage by reference. Runtime sender/document fixtures, asynchronous sendResponse/Promise replies, unrelated listeners, missing receiver and offscreen create/close. |
| tests/helpers/fetch.ts: controlledFetch | Records requests; resolve/reject each independently in any order. Requests do not complete automatically. |
| tests/helpers/deferred.ts | Controlled Promise completion for races. Use vi.useFakeTimers and advanceTimersByTimeAsync/runAllTimersAsync for time, not real sleeps. |
| tests/helpers/audio.ts: installAudio | Controlled Audio/EventTarget instances and play/pause. Configure play rejection and dispatch media events explicitly. |
| tests/helpers/offscreen.ts | Primitive snapshot fixture and correlated reply adapter for SW lifecycle races; source/document state is explicitly controlled by each test. |
| tests/helpers/playback.ts | Isolates SW state, track/queue/Mix resolution and offscreen sends for playback scenarios. |

These are adapters for needed APIs, not a browser emulator. They model a controlled storage-event ordering and basic sender/async-response behavior; add other significant orderings explicitly. Actual message-port lifetime, worker termination and browser-version behavior need real browser checks. Audio does not decode MP3/HLS or establish CORS behavior. A helper's implementation error must not become a product requirement.

startup.test.ts covers readiness/reconciliation, storage/snapshot failures and media-event ordering; entrypoint.test.ts imports the actual Chrome entrypoint with a pending storage read to verify early listener registration. player-snapshot.test.ts exercises the request/reply against actual offscreen handlers over both transports. storage.test.ts checks changes/removals during the initial read.

The initial regressions cover retrying offscreen creation after rejection and owner/audio order in queue params. Other suites cover storage -> React, ERROR versus ENDED, both transports, delayed retry and legacy windows-1251/reconnect.

playback.test.ts covers reordered responses, cancellation, delayed commit, hydration transfer, rapid next/previous and empty/unavailable/duplicate IDs. audio-error.test.ts covers three attempts per track, five consecutive failed IDs for queues/Mix, duplicate errors, actual-playing reset and cancellation on pause; offscreen-ordering.test.ts exercises actual SW transport with delayed document creation. player-lifecycle.test.ts covers play rejection and late Audio/HLS callbacks; its HLS is controlled, not a decoder.

Mix regressions also cover empty/repeated recommendations, cancellation during the recommendation wait and the shared budget across media errors. Playback preparation diagnostics are checked for safe categories without raw synthetic secrets. [Modal reopen tests](../../tests/front/modal-reopen.test.ts) use the real VKUI manager and settings DOM through open/close animations; jsdom does not establish visual placement or animation appearance. [Build-script tests](../../scripts/build.test.ts) run the actual shell entrypoint with a local fake npm command, proving that partial builds refresh existing common output before consumers.

playback-intent.test.ts covers rapid toggle/cancellation, delayed intent writes, pending-selection resume and terminal failure. playback-command-transport.test.ts covers shared intent across runtime, keyboard and Firefox bridge. playback-controls.test.ts checks terminal feedback, explicit retry/dismissal without UI storage commands, and SW toggle commands without UI playback writes, cancellation between actual header/album controls, separate requested/observed state and a safe error in the actual VKUI Player DOM. It is a jsdom behavior check, not a visual popup smoke. [The ADR](../decisions/0001-playback-operations.md) defines the contract and limits. New tests should assert a user invariant/boundary, including failure, rather than repeat the implementation expression.

Session verification regressions live in tests/front/session.test.ts and session-ui.test.ts: token/profile failures, shared deadline/cancellation, storage ordering/failure, safe status and explicit retry (including no refetch on reconnect). tests/common/web-token.test.ts covers token HTTP status and payload-free parser errors; clear-storage.test.ts verifies awaited settings-preserving cleanup. [ADR 0005](../decisions/0005-session-verification.md) defines the bounded contract.

[Session owner/transport tests](../../tests/service-worker/session.test.ts) cover UI/worker shared refresh, supersession, per-caller cancellation, persisted epochs, invalid senders/payloads and safe correlated replies. Separate module instances model remote UI and local worker clients. Token-method integration tests start the actual session service before calling the client; there is no fallback per-popup token writer. [Race regressions](../../tests/common/session-races.test.ts) cover duplicate refresh and late responses after account/epoch changes. [ADR 0009](../decisions/0009-session-owner.md) owns this boundary; it does not establish general command acknowledgements.

[Offline network-policy regressions](../../scripts/offline-network-policy.test.ts) run tiny isolated Vitest fixtures with the real setup. A swallowed default-fetch rejection must fail the child suite, while explicit adapted networking must pass. No real VK/request credentials are involved.

## Chrome smoke with an authenticated account

[Playback shortcut regressions](../../tests/front/playback-shortcut.test.ts) cover the first Space in both popup/tab contexts without clicking or awaiting tab detection, scroll prevention with navigation/link focus, missing physical key codes, held Space, focused/editable controls, dialogs, modified/composing/handled events and listener cleanup. [Recommendation card regressions](../../tests/front/recommended-playback.test.ts) cover first-track selection without navigation, duplicate-load suppression/focus, shared pause/resume intent, owner identity, empty/failed reads with retry, cancelled late completion and accessible names without tooltips. These are controlled DOM tests. In a real toolbar popup and extension tab, press Space immediately after opening without clicking: playback must toggle without scrolling. Then start a generated Home card, verify selection/native playback and unchanged page, click a navigation tab or link and press Space twice, check typing and focused-button Space, and repeat with a dialog open. Inspect idle/hover/keyboard-focus cards in both themes: the full cover darkens and the icon appears centered; mouse activation followed by pointer exit must hide it again. Hovering the icon must change its color without showing a tooltip. Check pending/failure feedback and leave playback paused.

Check actual chrome-devtools connectivity using [MCP setup](mcp.md). Codex needs its project config.toml; it does not read .mcp.json alone. Doctor proves consistency of generated settings, not live tool availability.

An unauthenticated run misses playback, search, scraping and related failures. For relevant behavior changes:

1. Run ./build.sh and npm run verify:build. The extension path must be inside client-supplied MCP workspace roots or system temp. If project roots were not supplied and installation returns Access denied, stage a copy as described below.
2. install_extension -> new_page at https://vk.ru/ -> **the user logs in themselves**. Cookies must belong to the extension's browser profile.
3. trigger_extension_action -> find the popup in list_pages.
4. Verify data, tabs, playback/progress, switching from search, result sections, settings/support dialogs and closing/Escape. Inspect popup and service-worker consoles.
5. View screenshots for layout/spacing; use geometry scripts as additional evidence. Image-viewing availability depends on the agent environment.

### If MCP has no workspace roots

Chrome DevTools MCP 1.12.0 permits os.tmpdir() even without client roots support. Copy only the built public extension into it, using regular files rather than symlinks:

```bash
node --input-type=module <<'JS'
import { cpSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-smoke-'))
const target = join(root, 'chrome_extension')
cpSync('dist/chrome_extension', target, { recursive: true })
console.log(target)
JS
```

Pass the printed path to install_extension. Reuse that exact directory for upgrade: another path changes the unpacked extension ID and tests a different installation. Keep the directory while Chrome needs the test extension; remove the test extension and directory after they are no longer needed. No MCP access-policy change is needed for this procedure.

Popup focus loss closes the page and invalidates its pageId. Trigger the action and list pages again; the page can appear on the next list call. For longer checks, open the observed chrome-extension://<id>/index.html in a tab and resize it to 780x600. Distinguish this same-UI tab check from an actual popup check. evaluate_script with serviceWorkerId can observe ongoing playback even with the popup closed.

### Reproducing playback failures and layout stability

Use a separate temporary extension installation and a six-entry synthetic radio playlist with unique IDs and `data:audio/mpeg;base64,AA==` as each source. The invalid inline audio exercises native Audio errors through the actual offscreen/SW transport without depending on a CDN. Radio avoids VK track resolution and listening notifications for the synthetic sources. This probe checks media failure recovery; request/URL failures still need the controlled playback adapter tests.

Observe changes to playbackId and the selected ID, carrying the last selected ID forward when a storage event omits unchanged activeTrack. Expect three distinct source IDs per track for the first five tracks, no sixth selection, and terminal played=false, playbackRequested=false, playbackId=null. Repeat through the card's explicit retry, then cancel during a retry wait and verify that no later source appears. Do not infer a successful start from source delivery; use played=true and advancing currentTime in a separate valid-media check.

For feedback geometry, compare the visible navigation/search rectangles and document scrollHeight with the card shown and hidden. Check the real popup at 780×600, both themes, and a wider extension tab. All card children must fit its bounds, and the document must not gain horizontal overflow. Capture only the probe's changed storage fields before the test; restore captured values and remove only keys proven absent beforehand. Keep credentials out of the snapshot, and retain any real queue selected after the probe rather than clearing runtime storage indiscriminately.

### Playback recovery and feedback check (November 7, 2026)

The playback recovery task used an authenticated isolated Chrome profile and a staged full extension build. The real Audio/offscreen/SW path received a six-entry synthetic radio queue with invalid inline audio (no external media requests or VK library mutations). Observed exactly 15 distinct playbackIds: three source loads for each of the first five IDs, no sixth-track load, then played=false, playbackRequested=false, playbackId=null and the five-track error. Clicking “Попробовать снова” in the real card started another bounded 15-load operation from the selected track. The SW warning/error console was empty during that probe. This establishes native media-failure routing. A normal catalog selection subsequently reached played=true, advanced currentTime and cleared playbackError; it was explicitly paused after the check. This does not establish a failed live VK URL recovering successfully on a later retry or real HLS failure recovery.

The real extension tab and actual toolbar popup were checked at 780×600; light/dark cards fit without document overflow. At 1000×700, showing/removing the notice left navigation y=72, search y=124 and document height=1114 unchanged. The card stayed inside the player column with 16 px edge offsets. Initial feedback screenshots used a seeded safe playbackError; the later screenshot used the native synthetic-failure result. Screenshots are task artifacts, not committed personal catalog fixtures. The synthetic selection/queue was replaced by the normal catalog selection, verified to contain no probe IDs, and left paused; the original theme was restored. The current real queue was retained. Firefox build/offline transport checks remain separate evidence; this visual/media-failure probe covered Chrome only.

## Fresh, upgrade and bundle identity

Installation over the same path preserves the extension ID, but reinstall triggers onInstalled(UPDATE) -> clearStorage. The preservation list is taken from common ApplicationControls/ApplicationSettings: volume, shuffle, repeat, durationMode, castToStatus, theme, likeVersion and settingsVersion. Other Chrome storage fields, including queues/playlists/activeTab, are removed. ApplicationSettings is not a storage key. UI theme actually uses localStorage.theme; compare it separately. New-information badges depend on CURRENT_*_VERSION in navigation/model/atom.ts, not the manifest version.

1. **Always verify the bundle.** Manifest version often stays unchanged between local builds. In the popup, inspect script[src] names and match index-*.js against dist/chrome_extension/assets/. For staged files, compare their bytes/checksums with the current build too.
2. **Fresh install:** uninstall_extension -> install_extension, or start from a profile without this extension. Expect no active track/current queue and no unexpected JS errors. VK cookies remain; a Chrome uninstall survey tab is incidental noise.
3. **Upgrade:** install_extension over the same path without uninstall. Compare preserved Chrome settings and localStorage.theme; runtime keys must be removed. When CURRENT_*_VERSION changes, verify the badge appears and is acknowledged by visiting its UI. reload_extension alone does not establish UPDATE behavior; observe storage.

Build-tooling changes need bundle identity. Storage schema/atom/protocol or migration changes need all three. UI notification-version changes need upgrade behavior.

## Firefox smoke through MCP

Use [the shared Mozilla moz-build configuration](mcp.md#firefox-extension-checks), then discover the actual tools/schemas after restarting MCP. The visible persistent automation profile is separate from Chrome and the user's ordinary Firefox profile. Login must happen there; do not copy Chrome cookies or commit a profile.

1. Build both distributions and verify them. Call install_extension with type=path, an absolute dist/firefox_extension path and temporary installation (permanent defaults to false; permanent installs need signing).
2. Call list_extensions filtered to the Gecko ID in the built manifest. Read that installation's UUID; the manifest ID is not the moz-extension URL host.
3. list_privileged_contexts gives the browser context. BiDi navigate_page rejected both about:debugging and moz-extension URLs in the tested public-package flow. Use the supported moz-build evaluate_privileged_script in the reported browser context to open only the intended extension page:

```js
() => {
  const tab = gBrowser.addTab('moz-extension://<installed-uuid>/index.html', {
    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
  })
  gBrowser.selectedTab = tab
  return true
}
```

4. Refresh list_pages until the URL appears, select_page by that URL, then inspect the actual extension-origin UI with snapshots, targeted evaluate_script, screenshots and network/console tools. A newly created tab can initially be reported as about:blank; do not assume a stable page index. Firefox tools use selected-page context, unlike Chrome pageId/serviceWorkerId arguments. Scope take_snapshot with selector and sufficient maxDepth when VKUI's wrapper hierarchy truncates the default tree.
5. An unauthenticated profile should show the VK sign-in modal; it cannot establish catalog/playback parity. The user follows its link and logs into vk.ru themselves. Reload/reopen the UI and check the modal disappears and actual catalog data loads. Confirmed unauthorized cleanup can remove runtime/status storage keys; an absent playbackInitialization field alone is not proof of a startup failure. Inspect startup independently in the isolated runtime probe below.
6. Verify media/queue behavior separately and leave music paused. Firefox background Audio and orchestration share offscreen.html; a targeted runtime.getBackgroundPage can inspect the bridge/native snapshot. Page console capture is not proof that background logs are empty. Read only necessary scalar state; keep credentials, action hashes and signed URLs out of reports.

Before selecting an element from duplicated page trees, check its bounding rectangle. A default first-match search input can belong to a hidden page; fill_by_uid returning success does not establish a search. Use a scoped snapshot of the visible input and verify the stored search tab/results. Reacquire runtime.getBackgroundPage for each separated diagnostic phase: Firefox can unload the background document while paused, leaving cached window/DOM references as dead objects. That diagnostic failure is not itself a playback error.

Measure innerWidth/innerHeight and devicePixelRatio when comparing screenshots: the tested --viewport 780x600 launch produced inner 780x527 at DPR 2, since browser chrome used part of the window. Test an actual toolbar popup separately; an index.html tab is not popup evidence.

### Repeatable isolated Firefox runtime check

```bash
./build.sh
npm run verify:build
npm run smoke:firefox
```

Firefox must be installed; VK login is unnecessary. VKAP_FIREFOX_BINARY can select an absolute binary path. The runner reads .mcp.json through the official SDK, substitutes a fresh headless profile for --auto-profile, copies the build to a temporary directory and adds a probe-only page there. It verifies ready/paused startup, an empty native Audio snapshot delivered runtime -> Audio handler -> same-document reply, and applied repeat states 1 -> 2 -> 0. It also seeds synthetic cached credentials, checks an actual runtime session reply and rejection of stale/malformed operations, then removes those fields. It closes only its own browser and removes its temporary files in finally. It never loads the production frontend or vk.ru, changes production permissions, or writes debug hooks into dist.

This command is separate from npm test; CI runs it after both builds with Firefox 159.0. Firefox/MCP/geckodriver bootstrap can download files and Firefox itself may use its ordinary background services. This is isolated extension-runtime evidence, not a network-hermetic UI suite, VK playback, actual popup, Firefox minimum-version coverage, real decoding/HLS or worker-restart acceptance. Tool failure/unsupported formatting fails the smoke; it does not silently skip Firefox.

## Console baseline

Playback/search can produce roughly 800 inline-handler CSP errors per relevant request set, with extension and fetched VK script-src policies, plus CORB notices. Earlier 7.x/8.x A/B runs identified this as pre-existing vk-client scraping behavior without observed functionality loss.

Compare source/type and volume relative to requests, not an expectation of an empty console. Do not ignore arbitrary CSP messages or newly appearing error categories.

## State and UI diagnostics

Use the [sanitized state read](state-and-messages.md#minimal-diagnostic-read); do not dump complete TrackItem/Playlist/session objects. played=false with an expanding sequence of selected tracks can indicate a failure loop. Check playbackId/playbackError: a terminal failure clears the ID, stops played and shows a safe message. Editing played in DevTools no longer controls playback.

activeTab survives UI closure/reload through Chrome storage. To leave a stuck page during diagnosis, set a valid tab object using ContentTab, for example:

```js
chrome.storage.local.set({ activeTab: { tab: 'general' } })
```

For geometry, compare getBoundingClientRect widths/gaps/overflow, plus body/document width against the viewport. Intentional horizontal galleries differ from whole-page overflow.

For immediate media failures (VK Mix, PR #37): compare an Audio probe with and without anonymous crossOrigin in the extension origin, observing error/playing. Error code 4 with crossOrigin, success without it and a CORS fetch TypeError indicate missing CDN CORS headers. Never retain or print the live signed URL. This is a diagnostic comparison, not permission to add crossOrigin to production audio.

Offscreen is not shown as an ordinary page by this MCP; use sanitized playback state and the SW console. Offscreen assets are offscreen_assets/app-*.js, while assets/index-*.js is front and will not change for offscreen-only edits.

## Modal and tooltip checks

For a dialog opened by a tooltip button, test pointer and keyboard activation, then close through its button, Escape and overlay where supported. Check that focus returns to the initiating control without reopening its tooltip. Move away and hover again, then Tab away/back: normal hints must still work. Keep tooltips hidden while the dialog is open. Verify playback/selection independently; returning focus is not a playback command.

In React tests, dispatch Escape on the focused element or dialog so it bubbles through the modal's actual handler. Use real focus/blur and mouse-out/mouse-over sequences for the trigger. jsdom does not perform floating-element layout, so inspect mounted tooltip nodes with `hidden: true` when asserting that none remain; pair those checks with actual-browser hover/focus behavior and a screenshot. Keep the focused button mounted rather than blurring/replacing it to hide a tooltip. [Lyrics regressions](../../tests/front/lyrics.test.ts) demonstrate close-button/Escape restoration and subsequent hint activation; browser checkpoints below distinguish a UI tab from the real toolbar popup.

## Troubleshooting entry points

| Symptom | First check |
|---|---|
| Common imports/types cannot resolve | Run doctor, then build common or use check. Production consumers require common/dist even though source-alias tests can pass without it. |
| Tests see the change but the browser does not | Rebuild affected production packages, verify the loaded bundle against dist, then reinstall/reload the correct extension. A manifest version match is insufficient. |
| Installed extension has no page in list_pages | Trigger its action and list again. A popup exists only while open; do not reuse a closed pageId. |
| Catalog is empty or sign-in appears | Verify the actual MCP browser profile's VK session and host permission. A logged-in ordinary Chrome window may be another profile. Do not clear user data to diagnose a temporary network failure. |
| Tracks switch immediately without playing | Inspect sanitized playback state/error and media/CORS behavior; use the bounded-budget scenarios to distinguish missing URLs from stale-event or media failures. |
| A unit test attempts a real request | Add the intended controlled fetch response/failure. Do not disable the default unexpected-fetch rejection or add personal credentials. |
| Playback stops after SW wake-up | Inspect playbackInitialization/playbackError and compare existing Audio snapshot ownership/time with storage. Startup must not create offscreen or replay persisted intent. Popup closure/extension reload does not prove live SW restart recovery. |

For live reports, distinguish a verified pass, a reproduced failure, missing authentication/tool access and upstream unavailability. An unavailable VK request is not a successful behavioral check and does not by itself prove an implementation regression. Keep the exact scenario and available evidence with its result.

## Manual review of playback changes

| Change | Manual scenario and expected result |
|---|---|
| Play/pause command placement | Header button, selected track row and active album icon still pause/resume through SW. The atom-to-feature refactor itself adds no visual element. |
| Observed playback state | Start a track, pause, wait for confirmation, then resume. Time should stop and resume from the same position. Two quick header toggles while paused must end paused with stable time; a third must resume. The pause action may appear before actual media starts. Test cancelling a pending selection from the header as well. Repeated track selection before metadata commits remains a selection command. |
| Stale-operation protection | Select A, then quickly B, or press next several times. A late response must not restore the old selection. Controlled ordering is more reliably verified in offline tests. |
| Bounded unavailable/media failures | In a controlled failing source, candidates stop after queue/budget exhaustion; played=false, playbackId=null and a safe error appear. Disabled gray rows may not be clickable and are not a reliable way to invoke this scenario. |
| Persistent error text | A negative-colored Footnote below the player header displays playbackError only while non-null; clearing it removes the extra block. It is a conditional status message, not a page footer or a new permanent control. |
| Audio lifecycle | Close/reopen the popup during playback. Music continues. Pause for more than 5 minutes; idle document reclamation retains selection/queue, and next play reloads the source. This does not verify SW restart recovery. |
| Pending HLS pause | Pause while HLS is attaching: a later attachment must not start Audio. Controlled delayed callbacks cover this deterministically; ordinary playback is not evidence for that race. |

To inspect only the error layout in the extension page console, keep playback paused, remember the current playbackError, then set a synthetic value:

```js
await chrome.storage.local.set({ playbackError: 'Тест отображения ошибки' })
```

After inspection restore the previous value (normally null). This proves UI rendering only; it does not exercise retries, failure classification or media stopping. A jsdom Player test also verifies the status appears and disappears without requiring a live VK failure.

## Manual session outage/retry check

1. Load the current verified build in an authenticated profile. Start a track to create a real queue, then pause. Record session/queue/selection equality through in-browser hashes or booleans; never print tokens, full storage or signed URLs.
2. Emulate Offline for the extension UI page and reload that page. Do not reinstall/reload the extension: UPDATE has its own cleanup policy. Expect a status below the player with “Не удалось проверить подключение к VK” and “Повторить”, no sign-in modal, and unchanged session/device/queue/selection.
3. Restore networking. Focus “Повторить” and press Enter. It is disabled/loading during the check; successful verification removes the status, retains associated data and refreshes the same-account token. Controlled tests establish duplicate-click and cancellation ordering.
4. Catalog failures are separate queries; session retry does not reset their cache (T10). Reload the UI if needed to restore the catalog. Remove temporary diagnostics and leave network normal/music paused.

## Known issues

- The narrowly described CSP/CORB baseline above.
- Several player buttons/icon tabs lack accessible names and appear as empty button/tab AX entries. Confirmed in the live run; T17 owns the fix.

## Live run: November 3, 2026

Chrome DevTools MCP 1.12.0, Chrome/156.0.0.0, local working tree, extension 3.3.8. Loaded front assets/index-B-qD-COf.js matched the fresh build; offscreen was offscreen_assets/app-BNdBQXcL.js. This was an authenticated personal-session run, not offline e2e or proof of release readiness.

| Scenario | Observation |
|---|---|
| Install in a profile without extensions | Successful from the permitted system-temp copy; catalog loaded, no initial active track/current queue |
| Actual popup | Data displayed, screenshot inspected, JS bundle matched |
| Ordinary track | played=true, increasing currentTime, playbackError=null; continued after popup closure |
| Pause/resume | Position stayed at 87 seconds between reads; resume retained playbackId and advanced from that position |
| Next/previous | Selection changed both ways, new playbackId, time restarted |
| Tabs/search | Home, My music, Explore and Current playlist opened; search returned tracks, albums, playlists and lyric matches |
| Search playback | Replaced current selection and played; queue hydrated to 712 entries |
| Three rapid next commands | Three DOM clicks in one call selected expected index 3; playback continued without playbackError |
| Modals/theme | Settings/support opened and closed; Escape closed settings; light theme selected by keyboard |
| Same-path upgrade | Same ID; likeVersion/settingsVersion and localStorage.theme=light survived; activeTrack/currentPlaylist/audiosIds/playbackId/currentTime/played removed; popup showed an empty player |
| VK Mix | Start/next produced two different playing tracks with isVkMix=true, progressing time and no playback error |
| Layout | Popup and UI tab inspected; at 780x600, body/documentElement widths were both 780, with no whole-page horizontal overflow |

No SW error/warn messages were found after tested actions. Popup inline-handler CSP volume grew with requests. The separate UI tab recorded 794 such messages plus `Manifest: property 'icons' ignored, type array expected`. The warning's source remains uninvestigated; do not automatically add it to ignored errors.

Not checked: Firefox, volume (MCP slider click timed out), seek, shuffle/repeat, hotkeys, natural end, SW restart with live audio, offline/media failure and attempt-budget exhaustion. These remain T05/T14/T17 scenarios and offline coverage where implemented. System theme was restored and music paused afterward. Screenshots do not replace keyboard/accessibility validation.

## Live toggle follow-up: November 3, 2026

Fresh Chrome DevTools installation of the current toggle-intent implementation in an authenticated profile; tested the extension UI in a tab at 780x600, not a newly inspected popup. Loaded front assets/index-DghGlv3A.js matched the build; offscreen was offscreen_assets/app-ByLl9rtp.js. check and all 157 offline tests passed; Chrome/Firefox build output verified.

| Scenario | Observation |
|---|---|
| Fresh installation/catalog | Catalog loaded, initial player had no active runtime data; play action had an accessible name |
| Normal playback | requested=true, played=true, progressing time and no playbackError |
| Two header clicks in one JavaScript task from paused media | All 12 samples over 1.2 seconds had requested=false/played=false; position stayed at 12 and playbackId was unchanged |
| Three header clicks in one task | requested=true/played=true; same playbackId; position advanced from 12 to 13 |
| Select B while A plays, then immediately pause from the header | Old playbackId remained, requested=false/played=false; position stayed at 65 across a further 1.2-second interval |
| Resume cancelled selection | B, rather than A, became the selected playing track; time advanced and playbackError stayed null |
| Same-path installation/UPDATE | Extension ID unchanged; test volume 0.37 survived; playbackRequested and other runtime selection keys were removed; empty player did not request playback. Test volume was then removed to restore the prior missing-key default |
| UI | Screenshot of paused player inspected; expected play action visible |

The SW console had no errors/warnings in the tested flow. Page console retained the known inline-handler CSP messages and the previously recorded Web Manifest icons warning. Playback assertions above observe the SW snapshot/UI; they do not directly inspect the offscreen Audio element. Deliberately delayed network/storage, retry cancellation and cross-control/hotkey ordering are controlled offline tests. Firefox live playback, SW restart recovery, actual-popup layout and exhaustive media-failure handling were not checked in this follow-up. Music was paused before the upgrade and left stopped afterward.

## Startup/recovery follow-up: November 3, 2026

The core readiness/recovery implementation is covered offline, including the actual Chrome entrypoint, both snapshot transports, surviving playing/paused media, missing/mismatched sources, commands before restoration, initialization failure and events around the snapshot boundary. At this follow-up, check, all 176 tests in 24 files, both browser builds and verify:build passed. Do not treat the historical toggle run as restart evidence.

Chrome smoke of the startup implementation used the same staged extension ID and matched front assets/index-DKmobo-P.js and offscreen_assets/app-DagTXRMD.js. After same-path installation the catalog loaded and there was no autoplay; UPDATE cleanup removed runtime keys, including playbackInitialization, as designed. Starting a track produced played/requested=true and progress. A correlated GET_PLAYER_SNAPSHOT query returned the real Audio source identity with paused=false/playing=true and finite time/duration; after UI pause the same source reported paused=true/playing=false. The worker console had no errors/warnings. Music was left paused.

**Not verified live:** terminating only the SW while keeping offscreen Audio alive. The available Chrome DevTools MCP rejected navigation to chrome://serviceworker-internals/ (chrome: URLs are disallowed), so this run could not use its Stop control. No extension reload, synthetic storage write or popup closure is counted as a substitute. A future live check needs an allowed way to stop just the worker; compare playbackId, actual Audio position/flags, queued wake-up action and progressing time after recovery. Firefox remains offline-only. This startup-only run preceded T06 lifecycle coordination; see the later lifecycle follow-up for current evidence.

## Offscreen lifecycle follow-up: November 3, 2026

The T06 lifecycle build (front assets/index-DKmobo-P.js, offscreen_assets/app-B-FBo8HK.js) was installed over the same staged extension ID in the authenticated Chrome profile. Native Audio snapshots were queried without source URLs or personal metadata.

| Scenario | Observation |
|---|---|
| Close request during actual playback | Request rejected; document identity unchanged and Audio still playing |
| Real paused idle timer | At 305 seconds the document still existed; at 371 seconds it was absent and playbackId was null, both playback flags false and playbackError null |
| Play after idle reclamation | New offscreen existed, a new playbackId played, time advanced from the reloaded source; no playbackError |

After adding the HLS request/revision guards, the final build used offscreen_assets/app-DTg8u_2e.js (same front asset). Reinstalled that full build and rechecked actual playing/paused/requested flags, two header clicks in one task from paused media, and rejection of a close request for a recently active paused document. The same document/source survived; Audio ended paused=true/requested=false/playing=false at the same position after double toggle. SW had no errors/warnings. The suite passed all 196 tests in 26 files, check, both builds and verify:build. Music was left paused.

The six-minute timer was observed in the lifecycle build before the final HLS guard additions; it was not repeated for another six minutes in the final build. Close/API completion races and deliberately late HLS callbacks/rejected play promises are controlled offline regressions. A real HLS decoder/network matrix, Firefox live playback and isolated live SW termination/restart remain unverified. These checks do not establish the unrelated queue/delete/session/release roadmap acceptance.

## Queue follow-up: November 3–4, 2026

T07 fixes were checked with all 237 tests in 29 files, check, both browser builds and verify:build. Controlled cases include the five initially failing queue regressions, late hydration/URL/storage completions, shuffled restore order and actual page handlers with child controls adapted. Live evidence below uses the extension UI in a tab, not a fresh popup or Firefox run.

The initial queue smoke loaded front assets/index-D0xWMX5-.js and offscreen_assets/app-BqkIGr9t.js in the same authenticated Chrome profile. The home collection had only seven IDs, so it did not establish partial-queue behavior. Selecting from My music yielded 18 loaded TrackItems and 91 full IDs; current-playlist scrolling merged the next page to 68 loaded items while keeping the complete queue at 91.

| Scenario | Observation |
|---|---|
| Play-next on an existing non-active item | Moved immediately after the active ID in both collections; count preserved, one copy, playbackId unchanged |
| Enable/disable shuffle | ID membership/selection preserved, backup created, exact canonical order restored and media source unchanged |
| Real editor remove/apply | Draft did not write storage before apply; apply removed the item from metadata/full IDs, updated selection index and kept the paused media source |
| Real drag/apply | Corrected MCP targeting to the actual drag handle; draft changed before apply, stored/full order changed after apply and active index matched its ID |
| Source preservation during drag | The first long inspection outlasted idle reclamation; its null playbackId was not attributed to reordering. Recreated/paused Audio and repeated native drag/apply promptly: playbackId stayed unchanged, played=false and no playbackError |
| Layout/console | Paused current-playlist screenshot inspected; no worker errors/warnings in tested actions |

For VKUI 8, the AX text “Перенести ячейку” can identify a visually hidden span rather than the pointer target. Inspect the current DOM and drag the actual .vkuiCellDragger__host. In this run, temporary distinct role/button labels on the real handles exposed usable MCP UIDs; all temporary attributes were removed afterward. A tool's “successfully dragged” response alone did not prove reordering: verify the draft, then apply and check the stored order.

A final pagination review bound onSuccess to its mutation variables, not the hook's latest render, so a delayed page cannot relabel itself with a newer base offset. The final build loaded assets/index-DNAxkWTO.js (same offscreen asset). Reinstalled and rechecked real paging from 18 to 68 loaded items, retaining 91 full IDs with no loaded duplicates, playbackError or worker errors/warnings; Audio was paused. Delayed response/failure permutations remain controlled tests; the edit journal is not durable storage, and this smoke does not cover live worker restart or a full VK/Firefox matrix. Music was left paused and shuffle disabled.

## Session verification follow-up: November 4, 2026

The popup-verification subset of T09 passed check, 272 tests in 33 files, both browser builds and verify:build. The authenticated Chrome run used the same staged extension ID and front assets/index-CrHt6hw0.js (offscreen_assets/app-DTHUMqRU.js). The loaded front filename and staged bytes matched the build. This was a 780x600 UI tab check, not an actual popup or Firefox run.

Normal verification loaded the catalog without a status/sign-in modal. Created a real seven-ID queue through playback and paused. After Offline plus UI-page reload, in-browser SHA-256 comparisons showed unchanged userId, webToken, deviceId, currentPlaylist, audiosIds, activeTrack and playbackId. The retry banner appeared below the paused player; its screenshot was inspected and no sign-in dialog appeared.

Restored networking, focused the retry button and pressed Enter. The banner disappeared; the token refreshed, while userId, deviceId, queue, selection and playbackId stayed unchanged. Audio remained paused. The catalog query had separately failed offline; a subsequent normal UI reload restored it without changing the queue. No whole-page horizontal overflow was observed. The worker had no errors/warnings; the sampled page messages retained the known inline-handler CSP and Web Manifest icons baseline. Temporary hash diagnostics were removed; networking was normal and music paused at handoff.

This run does not establish account switching/cache isolation, all VK errors, Firefox live behavior or isolated worker restart. HTTP 429/5xx, deliberately stalled requests/ignored abort and storage failures use controlled regressions. The final frontend build assets/index-DAmwqWLg.js adds explicit no-refetch-on-reconnect, tested offline through the real query hook. Staged its bytes and reloaded only the UI (the worker/offscreen code was unchanged). Repeated offline reload and keyboard retry: the banner appeared then disappeared, associated session identity/queue/selection stayed equal, and music remained paused. Normal UI reload restored the catalog afterward; temporary diagnostics were removed.

## Library delete/restore follow-up: November 4, 2026

[ADR 0006](../decisions/0006-library-delete-restore.md) and [the parity reference](../product/vk-parity.md) record the behavior and sanitized endpoint/shape comparison. With the user's explicit authorization, deleted/restored one library track on the actual website and inspected the requests. Both website UI round trips restored the row; a subsequent normal reload still showed the track. The website uses token methods (5.289); its delete response contains audio_ids and restore returns a matching audio object.

Installed the extension build front assets/index-DqTnVQus.js, offscreen_assets/app-DTHUMqRU.js (staged front bytes matched). Started another track to create a seven-ID queue, paused, then deleted/restored the target through actual extension controls. Its legacy requests returned HTTP 200 / payload code 0. Screenshot inspected: muted metadata at opacity 0.52, enabled restore plus, no whole-page horizontal overflow. Restoration removed the muted state, left all seven queue IDs and music paused. The first pointer attempt did not issue a request because hover changed geometry; the final CSS retains duration geometry while revealing controls, and the final-build click below issued the request directly.

A separate A/B used the same track/host/version (api.vk.ru, 5.246), changing only client_id between historical 5.163 and app ID 6287487. Both deletions succeeded; each was immediately restored and identity-checked. The old parameter is therefore not a reproduced failure in this environment. Retain app ID for consistency. API 5.246 returned numeric delete response 1; fixtures also cover the website's newer audio_ids shape.

The final build front assets/index-LIiCrfjD.js was staged and loaded by UI-page reload; worker/offscreen behavior was unchanged. Deleted the same target: queue stayed at seven during restoration. Navigated to My music: queue dropped to six, selection stayed unchanged, the expired restore row disappeared and music stayed paused. Restored the VK library item through audio.restore and checked the returned identity. The deliberate local queue removal remains; restoring after the window expires does not reinsert it. No library item was intentionally left deleted and temporary diagnostics were removed.

Check, all 304 tests in 36 files, both browser builds and verify:build passed for this change. Duplicate/failed/late request ordering, HTTP failures, UI closure and no ambiguous legacy replay have controlled regressions. This is scoped authenticated Chromium evidence, not Firefox, duplicate-library parity, cross-window cache isolation or a completed command-acknowledgement protocol.

## Pagination outage/retry follow-up: November 4, 2026

The first bounded-pagination build (front assets/index-Czxl3Odn.js) exposed a live-only gap: TanStack's default online mode paused the mutation before its fetch, leaving a spinner while offline. Added a real-offline-manager regression and configured pagination reads with networkMode=always and retry=false. They now fail visibly instead of queuing an automatic reconnect replay.

The final frontend assets/index-BWsNaAoh.js was staged byte-for-byte and loaded in the authenticated 780x600 UI tab. My music had no continuation in this dataset, so its bottom scroll did not establish the pagination failure scenario. Switched to Explore online, then emulated Offline and scrolled to its continuation sentinel. One POST failed with ERR_INTERNET_DISCONNECTED. Loaded content remained; the safe retry banner replaced loading. Repeated bottom observation across subsequent tool calls showed no extra fetch/XHR requests; screenshot inspected.

Restored networking, focused “Повторить” and pressed Enter. The banner disappeared and list height grew from 3045 to 4239. The network showed both the initial Explore query refetching under its existing reconnect policy and a successful continuation request; this run does not isolate recovery from that independent refetch. Music stayed paused, queue count stayed six (the preceding deliberate library-test queue state), playbackError was null and no whole-page horizontal overflow appeared. Network was left normal. This verifies extension retry behavior; it does not claim a paired VK website outage test, all list shapes, late-response isolation, immutable merges or Firefox behavior.

Check, all 326 tests in 39 files, both builds and verify:build passed. [Pagination regressions](../../tests/front/pagination.test.ts) cover hidden pages, explicit/duplicate retry, unchanged and cyclic cursors, scope changes, concurrent attempts and actual offline mutation behavior. Session-aware query keys/cache clearing and stale-page merging remain the next T10 subset.

## Query identity/cache follow-up: November 4, 2026

The next T10 subset passed check, all 339 tests in 42 files, both browser builds and verify:build. [ADR 0007](../decisions/0007-query-identity-and-pagination.md) owns per-account clients, full page identity, original-variable/cursor guards and immutable ID merges. Two initial regressions reproduced cross-account General key reuse and equal playlist IDs mixing owners before the fix.

Staged front assets/index-8GBeguVB.js matched build bytes and loaded in the existing authenticated UI tab (same offscreen_assets/app-DTHUMqRU.js). After reload, session verification and Explore loaded without status errors; bottom scroll increased content height from 2943 to 4239. Opened Home and a recommended playlist: 100 visible rows, no error/stall. Searched “Daft Punk”: 36 visible results and no error; its show-all opened the playlist view with 20 rows, and bottom pagination merged to 120 rows without a stall. These are real read-only VK data flows through the new keys/guards. Music remained paused, the six-ID deliberate test queue was retained and the worker had no errors/warnings in the checked flow.

A second real account was not used. Account switching, ignored abort, retirement and late mutation completion are controlled tests with synthetic users; actual browser cookies and shared token refresh epochs remain outside this evidence. Live checks did not exercise every albums/catalog shape, all duplicate combinations, cross-window library invalidation or Firefox. Initial query errors still use their existing UI/retry policy.

## Token API error-contract follow-up: November 4, 2026

The bounded token-client subset of T09 passed check, all 358 tests in 44 files, both browser builds and verify:build. [ADR 0008](../decisions/0008-vk-api-errors.md) separates implemented method errors/deadlines/one auth retry from remaining shared refresh/account ownership. Nine initial regressions demonstrated false success, HTTP/body misclassification, GET body, empty-token replay and second-error-5 success before implementation.

Installed the complete build (front assets/index-BGUYwS0C.js, offscreen_assets/app-KlgKXwIM.js) over the same staged extension ID; staged front bytes matched. UPDATE cleared the preceding test queue under the existing update policy. Session verification and Home loaded. Clicking the Mix heading itself did nothing; the actual unnamed Mix play button started token-based Mix: played/requested=true, position 2, isVkMix=true and no playbackError. Header pause then produced played/requested=false, no error. Opened the artist page from a visible artist name: 18 visible rows, no status/format error, playback stayed paused. Worker console had no errors/warnings in this flow.

Deliberate 401/5/429/5xx, malformed responses, ignored abort, storage failure and timeout/refresh ordering are controlled offline tests, not induced production failures. Real refresh contention, account switching, every mutation consumer and Firefox remain unverified. Network was normal and music paused at handoff. The Mix button's missing accessible name remains T17; successful playback is not accessibility acceptance.

## Library add/follow follow-up: November 4, 2026

Compared website add/delete and playlist follow/unfollow requests, confirmed results and reversal; [the parity reference](../product/vk-parity.md#addfollow-observation-november-4-2026) records sanitized shapes. Website error-5 refresh was observed during follow; deliberate failure/concurrency permutations remain offline tests.

Initial extension front assets/index-CuGPKKN2.js, same offscreen_assets/app-KlgKXwIM.js: added the paused token-source Mix track through the player header. Title/artist remained visible. Header deletion used exactly the returned library owner/audio ID and succeeded; the temporary copy was removed. Followed Discovery with Enter and removed the subscription. This run revealed native disabled blurred the initiating follow button to BODY during its request.

The final build assets/index-CKAkLE1S.js was staged byte-for-byte and loaded by UI-page reload in the existing authenticated 780x600 tab; worker/offscreen code was unchanged. Focused the actual Discovery follow button and pressed Enter: its name became “Удалить плейлист из моей музыки”, document.activeElement remained that same button and it was enabled after completion. Pressed Space without refocusing: the original Add label returned, focus remained and the temporary subscription was removed. Both actions retained the search tab and paused playback. Screenshot inspected: visible album actions, no whole-page horizontal overflow. The initiating busy control now uses aria-disabled/aria-busy with a synchronous action guard instead of native disabled; other disabled controls remain native-disabled.

Check, all 371 tests in 47 files, both browser builds and verify:build passed. Controlled regressions cover malformed/partial outcomes, ambiguous legacy replay, safe error feedback, duplicate/concurrent actions, owner-key collisions, focus and account-scoped player copies. This is scoped UI-tab Chromium evidence; actual-popup/Firefox, cross-window library invalidation, shared account epochs and exhaustive duplicates/source semantics remain open. Music was left paused, temporary additions/subscriptions removed.

## UI recovery follow-up: November 4, 2026

Two entrypoint regressions first failed without a boundary: thrown render and effect errors escaped with no recovery screen. The fixed entrypoint passed check and all 374 tests in 48 files, both browser builds and verify:build. Tests also verify healthy content, safe diagnostics without the original synthetic error, focused reload, and no storage writes/cleanup/network in the isolated fault scenario.

Staged final front assets/index-CLkCDpq1.js byte-for-byte (CSS assets/index-CijCOD1t.css, unchanged offscreen_assets/app-KlgKXwIM.js). Reloaded only the authenticated 780x600 UI tab. Through DevTools, temporarily replaced the mounted boundary's child element type with a throwing synthetic component and forced render; no fault hook is shipped in the product. The actual root boundary caught that render failure and displayed its native recovery screen. Screenshot inspected after fixing the initial fallback's white viewport surround: final fallback fills the viewport, has a visible focus outline and no horizontal overflow. The reload button held focus.

Before recovery, exact in-browser comparisons showed unchanged stored userId, currentPlaylist, audiosIds, activeTrack and played. Pressed Enter: ordinary player/catalog UI returned, the same saved-state hash remained equal and music stayed paused. Reload removed the temporary injected component and diagnostic baseline. This is an injected production-build render failure, not a claim to reproduce an organic VKUI defect. Lifecycle failures are controlled tests; actual-popup/Firefox, failures before mount and detached async/event failures remain outside this evidence.

## Firefox MCP/startup follow-up: November 4, 2026

Research and actual tools/list confirmed Mozilla's public 0.10.7 package can install a temporary addon, but BiDi rejects about:debugging and moz-extension navigation in that flow. The official moz build plus explicit system-access environment exposed list_extensions and supported browser-context evaluation. Installed the actual Firefox distribution, opened its own UI through that API and inspected the sign-in modal screenshot. Effective viewport was 780x527 at DPR 2. The page showed confirmed sign-in, not a transient failure banner or React recovery screen; the link opened vk.ru successfully in the same dedicated profile. This checkpoint does not claim authenticated Firefox music playback.

The initial background snapshot failed initialization even though its Audio listener answered a later read. A controlled late-listener regression reproduced the missed first request: the orchestrator can start before the other module registers. Firefox startup now uses the existing 50-ms read-only readiness probes within the 2-second deadline; absent listeners still fail boundedly. This does not add VK retries or replay playback commands. Confirmed unauthorized UI cleanup can separately remove runtime/status storage keys, so the signed-out UI is not the isolated startup acceptance check.

The new npm run smoke:firefox passed with real Firefox 159.0 in a fresh headless profile, without the production frontend/VK login. It installed a temporary copy of the actual built runtime, observed ready/paused state, received an empty native Audio snapshot through runtime plus the same-document reply bridge, and observed applied repeat states 1 -> 2 -> 0. Its own browser and temporary files were closed/removed afterward; the visible persistent session is separate. Front assets/index-CLkCDpq1.js and offscreen_assets/app-KlgKXwIM.js were unchanged; Firefox service-worker.js SHA-256 was 3599674848c8878bc1321847eee1aaff5e3ed7ac74595c56ed397495beb04c1b.

Check, all 387 tests in 48 files, both browser builds, verify:build and project-skill validation passed. CI now runs the same runtime smoke with pinned Firefox 159.0 after build verification; remote execution is separate from the local evidence above. Authenticated catalog/media/HLS, real toolbar popup, minimum-supported Firefox and Chrome isolated worker restart remain outside this checkpoint. [Tooling research](extension-tooling.md) records official Chrome skills reviewed and the project-owned discovery/compatibility choices.

## Authenticated Firefox follow-up: November 4, 2026

After the user signed into vk.ru in the persistent MCP profile, the previously open extension tab still showed sign-in and had no local user/token. Its session query disables refetch-on-focus/reconnect. UI reload verified the session: stored user/token became present, the sign-in modal disappeared, catalog data loaded, playbackInitialization was ready and playbackError null. This is expected reopen/reload behavior, not automatic detection in an already mounted signed-out tab. Resource timing confirmed token acquisition, account.getProfileNavigationInfo and the legacy catalog route; no credential/body values were retained.

Used the same build as 0e72d38: front assets/index-CLkCDpq1.js, offscreen_assets/app-KlgKXwIM.js and the worker checksum in the preceding section. The UI ran in a real moz-extension tab, not a localhost mock or toolbar popup. Actual native Audio snapshots were read through the same-document bridge with correlation and temporary-listener cleanup.

| Scenario | Observation |
|---|---|
| Library playback | Real row click created a seven-ID queue; played/requested became true and time progressed without playbackError |
| Native Audio and pause/resume | A live native snapshot reported playing=true/paused=false, then time increased from about 23 to 48 seconds on the same source; header pause yielded paused=true/playing=false/requested=false, source identity unchanged and failed=false |
| Paused UI reload | Exact SHA-256 comparison of saved userId, activeTrack, currentPlaylist, audiosIds, played and playbackRequested matched before/after; queue stayed seven, catalog returned, sign-in stayed absent |
| Close/reopen UI during playback | Closed the index.html tab and opened a new one; playbackId stayed equal, time advanced to 36 seconds, both playback flags stayed true, queue stayed seven and no sign-in modal appeared; paused from the reopened header afterward |
| Search | Filled the actual visible input with “Daft Punk”; stored tab/query changed, 36 visible rows and track/album/playlist/lyrics sections loaded while queue stayed seven and playback paused |
| VK Mix | Actual Mix button issued audio.getStreamMixAudios; isVkMix and played/requested became true. Native Audio reported playing=true/paused=false/failed=false with progressing time and finite duration; header pause produced native paused=true and both stored playback flags false, no playbackError |
| Layout and diagnostics | Playing and paused screenshots inspected; measured final viewport 925x527 at DPR 2, no whole-page horizontal overflow. Page console tool reported no captured errors; this does not prove coverage of background console events |

The first attempted search targeted a hidden duplicate input; its tool acknowledgement was not counted as a successful search. Scoped the visible input, repeated through its current UID and checked the actual results above. A long temporary diagnostic command was truncated by the interactive PTY before reaching MCP; short calls restored the harness. Prefer native MCP tools or the repository SDK runner instead of large JSON lines in an interactive terminal. These were test-driver issues, not reproduced extension failures. Temporary DOM markers/window diagnostic functions were removed. The session remains available and Mix was left paused; no library additions/deletions were performed in this follow-up.

This adds scoped authenticated Firefox 159.0 evidence. It does not identify every stream format or establish HLS/decoder failure handling, actual-popup keyboard/layout, account switching, Firefox minimum-version compatibility, library mutation parity or isolated Chrome worker restart. The preceding 0e72d38 CI run also passed all 387 offline tests, check, both builds and the headless Firefox runtime smoke on Linux ([run](https://github.com/vissh/vkui-audiopad/actions/runs/41788782258)). This follow-up changes evidence/docs only; it does not add a new runtime fix.

## Similar action layout and loading: November 4, 2026

Compared master 5574e83 and the current row layout. The duration hidden with visibility retained roughly 33 px after the action buttons; master's actions replace duration at the right edge. Actions and duration now share a grid slot, preserving hover/focus geometry while restoring the trailing theme spacing (2 px in the tested theme). Neutralized SimpleCell's nested last-IconButton negative margin. The old Spinner24 animated the outer SVG; sampled center offsets reached about 19 px. Similar now uses the guarded async button and VKUI Spinner's internal path animation. IconButton's inherited SVG padding must also be reset for the embedded spinner, otherwise flex shrinking makes its drawing disappear.

Loaded final front assets/index-DLXW0C2g.js and assets/index-7193IY3a.css in the authenticated Firefox 159.0 extension tab, 925x527 at DPR 2. Held only the similar read behind a temporary fetch gate. The row button retained its exact rectangle and focus; the visible 16 px spinner had zero center offset in six samples, and its animation target was the path. Screenshot inspected for both row and header pending states; the header also retained its rectangle/focus and zero spinner offset. Row actions had 8 px gaps, with the final button ending 2 px before the tail edge. Released requests completed with actual VK results. Earlier pending Enter check produced no duplicate request. No library mutations were used.

Check, all 389 tests in 49 files, both browser builds and verify:build passed. [Similar control regressions](../../tests/front/similar-controls.test.ts) cover duplicate activation, focus retention, row propagation, empty results, safe failures and retry. The duplicate-request case failed against the original SimilarButton. Live evidence is scoped to the Firefox UI tab and tested theme/viewport; actual popups, Chrome rendering, reduced-motion and other themes remain separate checks.

## Lyrics reader: November 4, 2026

Compared the authenticated website Home tracks PREY FOR ME/3 and Δnthem Of Haze. [The parity reference](../product/vk-parity.md#lyrics-observation-november-4-2026) records only method/field/shape observations. No live lyrics, credentials or complete track responses were saved as fixtures. The static reader uses VKUI ModalPage/Text and Icon24ArticleOutline; it does not reproduce the site's player within its lyrics dialog.

Check, all 408 tests in 51 files, full Chrome/Firefox builds and verify:build passed. [Controlled API tests](../../tests/common/audio-lyrics.test.ts) cover exact request identity, stanza breaks, malformed/empty results, VK 104 versus other errors and cancellation. [Player DOM tests](../../tests/front/lyrics.test.ts) cover no availability/no request, lazy single reads, safe literal text, explicit retry, cache reuse, close cancellation, late results after track replacement and account cache retirement. Token conversion now preserves has_lyrics; missing/false/true values have common tests.

Installed the byte-matched build from a permitted system-temp directory into the authenticated Chrome MCP profile. Loaded front assets/index-Slxb5uqr.js and assets/index-9UZGhM6c.css; offscreen remained app-KlgKXwIM.js. In the actual extension tab at 780x600/DPR 2, selected PREY FOR ME/3 through its real Home row: playback began, the lyrics action appeared and its reader loaded 101 lines. Paused through the header, opened the focused action with Enter, inspected the screenshot, and closed with Escape: focus returned to “Показать текст”, playback stayed paused and there was no whole-page horizontal overflow. The dialog was 680x560 with an internal scroll container; its text used 20 px type with stanza breaks. A later playing read retained played=true while currentTime advanced from 3 to 14 seconds. Reopening used the same cached read (one audio.getLyrics request in that tab). Paused afterward. Selected Δnthem Of Haze through its Home row: its lyrics flag was clear and no lyrics button appeared; paused afterward.

Triggered the actual toolbar action and confirmed Chrome runtime contextTypes=POPUP, separately from the UI tab. The real popup was 780x600, loaded the same front bundle and paused selection, and fetched/rendered the 101-line reader. Screenshot inspected; no whole-page overflow. Enter opened it, close received focus, and Escape closed the dialog while keeping the popup open and returning focus to the lyrics button. The popup console and sampled worker console had no error/warning messages. The UI tab's 379 error/warning messages were the documented scraped-inline CSP and manifest-icons categories; all pages were checked for new categories, with none found.

This is authenticated Chromium tab and actual-popup evidence in the tested dark theme. Firefox lyrics UI, other themes/minimum browser versions and synchronized/seekable lyrics remain outside this checkpoint. No library mutation was used; music was left paused.

### Timestamped lyrics follow-up

Daft Punk's One More Time (Radio Edit) returned a valid audio.getLyrics response without lyrics.text: lyrics.timestamps held 90 entries, including 87 string lines and three interlude=true markers without a line. The original parser rejected this as a format failure; new synthetic timestamp cases first failed against it. The parser now accepts both representations, preserves repeated lines/order, maps explicit interludes to blank lines and still rejects malformed entries. The Player DOM regression includes the no-line interlude shape. The button now uses Icon24TextTtOutline.

Check, all 421 tests in 51 files, both full builds and verify:build passed. Staged the final front bundle assets/index-BMt-7i73.js byte-for-byte, reloaded the authenticated 780x600 Chrome UI tab and selected the real One More Time Home row. The reader rendered all 90 lines/blank markers without the load-error state; screenshot inspected. The new text_tt icon was present, playback stayed paused, no whole-page overflow appeared, and Escape returned focus. Separately triggered the actual toolbar popup and confirmed its POPUP runtime context: it loaded the same bundle/icon and independently rendered the 90-line result without error. Escape kept the popup open and restored button focus; its console had no captured errors/warnings. No library changes were made, and music was left paused. Firefox lyrics UI and other theme/browser combinations remain outside this live follow-up.

### Lyrics tooltip follow-up

The paused Chrome popup reproduced “Показать текст” remaining mounted after modal closure while focus had returned to its trigger. The lyrics action now controls its tooltip and suppresses exactly the next focus-triggered show caused by closing the modal; normal subsequent hover/keyboard focus remains enabled. Other TooltipIconButton consumers keep their uncontrolled default. Two Player DOM cases (close button/Escape) first failed on the original implementation's lingering tooltip, then passed while checking subsequent hover and explicit focus. The jsdom assertions include hidden tooltip nodes because the test environment does not perform floating-element layout.

Check, all 423 tests in 51 files, both builds and verify:build passed. Staged assets/index-CHZb8XEP.js, reloaded the authenticated 780x600 Chrome tab, opened with Enter and closed with Escape: focus returned to the lyrics action with no tooltip. Tab then Shift+Tab deliberately returned to it and showed its tooltip again. Separately confirmed the actual toolbar popup context, opened its reader and clicked “Закрыть текст”: dialog/tooltip were absent while the same action retained focus. Screenshot inspected after closing; hovering it again showed “Показать текст” normally. Music remained paused. This is scoped Chromium evidence; Firefox tooltip behavior remains unverified live.

## Shared session owner follow-up: November 4, 2026

Three initial token-method regressions reproduced duplicate refresh, a late refresh overwriting a newer account token and successful data from a retired account. Session writes/verification/refresh now have one background owner; [ADR 0009](../decisions/0009-session-owner.md) records the result/cancellation contract, persisted identity and limits. The existing sign-in UI keeps safe outage/retry behavior through that owner. Offline tests use synthetic accounts and controlled completion; no personal credentials are fixtures.

Check, all 417 tests in 51 files, both builds and verify:build passed. The real isolated Firefox 159.0 probe passed with front assets/index-nrA9qi_2.js and offscreen_assets/app-y0TgiRgD.js in the built distributions; final Firefox service-worker.js SHA-256 was ea3a8462b184da630e6e1f0386b35683eff453942b57d1a6fa97fb347a93f60f. It confirmed cached session reply correlation through runtime.sendMessage, rejected a retired epoch and malformed refresh, and still passed startup/native Audio snapshot/repeat checks. This probe loads a temporary extension page, not the production UI, and uses only synthetic cached credentials; it does not establish live VK token/profile acquisition or authenticated playback through the new owner.

Authenticated VK verification through the new owner in both runtimes, actual popup behavior and isolated Chrome worker termination remain separate checks for this build. General playback/queue acknowledgements, legacy request account isolation and complete local-data browser UI coverage remain open. Runtime-only smoke success must not be reported as authenticated session or playback acceptance.

## Session owner integration with current master: November 7, 2026

Updated the owner branch onto master c40a998, retaining the merged lyrics reader, release workflow and playback/modal/build fixes. The original lyrics fixtures initially failed 28 cases because they had no background session receiver, or changed userId while leaving another account's credentials. The adapted API and Player DOM suites use separate background/UI module instances through the real controlled runtime request/reply adapter. They retain parsing, lazy/cache, focus, cancellation and retry assertions; new cases reject lyrics after either account or epoch retirement without replay.

Check, all 490 tests in 58 files, both builds and verify:build passed. The isolated Firefox 159.0 smoke passed startup, native Audio snapshot, repeat commands, correlated cached session replies and stale/malformed request rejection without personal credentials.

Installed the final Firefox distribution and opened its actual extension-origin UI tab in the existing authenticated MCP profile: front assets/index-CtjM4Pmz.js, offscreen_assets/app-y0TgiRgD.js, Firefox 159.0, viewport 780x527 at DPR 2. A real verify request through runtime.sendMessage returned a valid authenticated snapshot with matching user/epoch; no token/identity values were retained. Catalog content loaded and no sign-in, transient-failure or recovery screen appeared. Selected One More Time and PREY FOR ME/3 through visible Home rows; playback progressed with no playbackError and was paused through the header. The latter reader loaded 101 lines, its screenshot was inspected, and there was no whole-page horizontal overflow. Escape closed it and restored trigger focus. Reopening reused the single audio.getLyrics request. No live lyrics text or private response was copied into fixtures/evidence.

A further real verification during playback preserved currentPlaylist, audiosIds, activeTrack, deviceId, played, playbackId and sessionEpoch by exact in-browser comparison. An earlier paused verification coincided with playbackId clearing while queue, selection, position and paused state remained intact; background recreation was not instrumented, so its cause and lifetime behavior were not isolated. This is not worker-restart or paused-background-retention evidence. Music was left paused, the reader closed and the temporary row marker removed. Sampled page console contained no captured errors/warnings; background console coverage is not established by that result. Actual toolbar popup, Chrome auth through this owner, minimum browsers, deliberate auth expiry/outage and broader account/worker lifecycle cases remain separate checks.

## Issue 11 controls: November 7, 2026

The tab shortcut and generated recommendation-card controls have controlled DOM coverage in the linked suites above, including out-of-order card loads: only the latest card selection may dispatch playback. Check, all 510 tests, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. The Firefox probe covers startup/snapshots/session/repeat, not these frontend interactions.

An isolated headless Chrome profile loaded the actual extension origin with the built frontend (assets/index-CJdmozTf.js and assets/index-DLxQD5x4.css). A temporary staged bootstrap supplied synthetic session/catalog/empty-playlist responses; production source, permissions and runtime bundles had no fixture hooks. Inspected card screenshots in light/dark themes at 1000x700 and 780x600: play buttons remained visible at 44x44 px with no whole-page horizontal overflow. A real Space key in the tab dispatched one TOGGLE_PLAYBACK without scrolling; Space in the search field inserted a space without another command. A card click retained Home/focus and displayed safe empty-playlist feedback. Space with the real settings dialog open dispatched no playback command. The actual action popup reported a POPUP runtime context and tabs.getCurrent() returned undefined; Space on its page sent no global toggle. The test extension was uninstalled afterward. The final card-load supersession guard and settings hint ordering have offline coverage; the screenshots precede those non-card-layout changes.

This is controlled Chromium UI evidence, not authenticated VK catalog/media playback, live Firefox frontend coverage or minimum-browser verification. The connected Chrome profile was busy and Firefox MCP startup failed; an independent isolated Firefox runtime smoke succeeded. No personal credentials, VK payloads or library mutations were used.

### Issue 11 hover and navigation-focus follow-up

The first shortcut implementation ignored anchors and ARIA tabs even though they do not consume Space. Three new regressions failed for retained link/tab focus and missing physical key codes; the handler now recognizes those cases while preserving editable fields and controls with their own Space action. Recommendation cards now reveal a centered 48 px white play/pause button and a full-cover 40% black overlay on hover or visible keyboard focus. Pointer activation clears the keyboard-only reveal, so focus retained after a mouse click does not keep the overlay visible outside hover.

The isolated Chromium extension-origin UI used assets/index-Dc0QSekJ.js and assets/index-BM32JQnk.css with the same synthetic session/catalog fixture boundary described above. On a deliberately scrollable page, clicking the real Home tab and pressing Space twice dispatched two toggles while scrollY remained 0 and focus stayed on tab-general. Overlay opacity was 0 at rest and 1 on hover, its bounds matched the full 165x200 card, and the 48x48 button's center offset was exactly 0 on both axes. Clicking the button then moving the pointer out restored opacity 0 despite retained button focus. Three real Tab presses reached the first card action and revealed it with visible focus; Space activated that button without another global toggle. Light/dark screenshots were inspected at 1000x700 and 780x600. All 513 offline tests passed; both builds and verify:build passed.

Live comparison with the authenticated VK website was unavailable: the connected Chrome profile was busy, Firefox MCP failed to start, and Computer Use rejected the current browser URL. The full-cover hover treatment follows the requested visual behavior; this checkpoint does not claim pixel-identical website parity or authenticated media playback.

### Immediate popup Space and album glyph follow-up

The earlier tab-only guard deliberately skipped toolbar popups, so pressing Space immediately after opening one still scrolled. Three controlled regressions reproduced that omission and the asynchronous tab-lookup gap. The app now installs the same synchronous playback shortcut in both UI contexts. Recommendation controls retain accessible play/pause names with their tooltip forced closed; a focus/hover regression checks that no tooltip or native title appears. The album's Icon36Play/Icon36Pause glyphs render at 48 px inside a transparent 56 px control, with white-to-secondary-text hover feedback instead of a white circular background.

An isolated actual Chrome toolbar popup reported POPUP context, tabs.getCurrent() undefined, BODY focus and a scrollable document before any click or key. Its first Space started a local silent WAV through the real SW/offscreen Audio path: played/requested became true and time advanced. A second Space paused it; position remained stable over 650 ms, playbackError stayed null and scrollY stayed 0. This test used synthetic session/catalog/queue data, a staged WAV and a temporary worker fetch adapter for VK playback bookkeeping. No live VK request or credential was needed. The final UI assets/index-BONK25Ta.js and assets/index-BQeVwMIn.css were checked again after reload: Space resumed/paused without clicks, the SVG measured 48x48, background was transparent, icon hover changed white to rgb(118,120,122), and there were no tooltip nodes or title. Popup screenshots were inspected and playback was left paused. Check, all 514 offline tests, both builds, verify:build and isolated Firefox 159 runtime smoke passed. This adds native local-media popup evidence, not authenticated VK playback or Firefox popup verification.

### Recommendation glyph background correction

The previous hover screenshot still showed a circle: setting the IconButton background transparent did not remove VKUI's separate Tappable state layer. Existing album controls use a bare glyph with color-only feedback. Recommendation controls now explicitly pass hoverMode=none and activeMode=none through the shared wrapper, removing that layer and press ripple while retaining accessible button semantics, pending/error guards and color feedback. Other controls retain their default VKUI modes. The focus outline is rectangular rather than circular.

A controlled hover/press regression first failed on the actual vkuiTappable__stateLayer node; it now passes for both play and pause. All 515 tests and check passed, as did both builds and verify:build. An isolated Chromium extension tab at 780x600 loaded assets/index-Bncxnerx.js and assets/index-DOe8fCtz.css with synthetic catalog/session data. With the pointer directly over the glyph, its state-layer count was 0, its background was transparent, and its color was rgb(118,120,122). The count remained 0 after a real click; the header play button retained its ordinary state layer. Full-page and cropped hovered-card screenshots were inspected, showing no circle or tooltip. This is local controlled UI evidence; no new authenticated VK comparison was performed.

## VK layout reference

In an automated browser, /audios<id> can load catalog data only in an active foreground tab with reload due to SPA lazy behavior. It can serve as a layout reference; measure its tiles through the same geometry methods.

## Equalizer live smoke — November 6, 2026

The working-tree Chrome/Firefox builds used front asset `index-CCyUrHyJ.js`; full build and verify:build passed. Chrome used a stable staged directory under the permitted system temp root. Firefox 159.0.1 installed the actual temporary extension and opened its installed UUID origin, with background and UI sharing the Firefox bridge.

- Chrome: fresh settings defaulted to disabled/neutral; enable, bass preset, ArrowRight band adjustment, custom-preset display and reopen persistence were observed in the 780x600 extension UI tab. Reinstallation over the same staged path retained EQ settings. Direct-track playback with processing reached active status, played=true, increasing time (4 to 71 seconds) and no playbackError. Off/on retained position; pause left both playback flags false and time stable. Screenshots confirmed all five compact rows, reset and status fit the modal's scrollable layout.
- Firefox: initial settings were disabled; enabling published waiting through the real bridge. Playback with processing reached played=true, active and increasing time (5 to 10 seconds). Selecting the bass preset while playing persisted `[6, 4, 0, -1, 0]`, retained active status and reached 56 seconds without playbackError. The final player was paused with both flags false at 60 seconds.
- Existing page-console CSP/manifest noise and two warnings from an earlier failed Chrome build were present; console emptiness is not claimed. The live run found and fixed Chrome offscreen storage access and expected native play rejection during local-media conversion. Offline regressions now cover both boundaries.

These observations establish the tested extension-origin UI and runtime path, not an audible frequency-response measurement, every VK CDN, minimum browser versions or live HLS coverage. CORS denial, time/size limits, source replacement and pending-play rejection have controlled tests. The current cross-origin processing limits and ownership are in [ADR 0010](../decisions/0010-equalizer.md).

## Settings equalizer disclosure, intermediate design — November 6, 2026

The redesigned settings build uses front asset `index-DlKOEbjW.js`. Chrome was installed from the stable staged system-temp path; Firefox 159.0.1 used the built extension's actual UUID origin. The Sound, Appearance and Controls groups remain in one settings modal, with no additional player-toolbar icon.

Chrome's 780×600 extension UI tab showed zero band controls when the switch was off, with the saved Bass curve still summarized in the row. Enabling mounted five vertical sliders and preset/reset/status controls. The shared modal scroll area measured 520 px visible / 799 px content when expanded; scrolling reached Appearance and Controls while the Settings header remained visible. The Chrome shortcut URL fits its 320 px single-line read-only field without content overflow. Closing and reopening settings retained enabled Bass gains. Mouse dragging and keyboard adjustment had already been checked against the same vertical-slider implementation; the current grouped-settings/pointer regressions cover the final placement and disclosure lifetime.

Firefox's actual extension UI showed the same groups, zero faders while off and five while on. ArrowUp changed 60 Hz from +6 to +7 dB, and closing/reopening retained +7 dB; the final bundle loaded that same persisted curve. Browser-specific shortcut guidance and the separate-tab link remained present. Music was not started during these layout checks.

This grouped design was superseded by the persistent tabs below. Controlled tests verify persistence, bounds, pointer capture, keyboard operation, conditional mounting and modal reopening. The earlier processing checks and CDN limits remain separate evidence.


## Final settings navigation and presets — November 6, 2026

The final production bundle is `index-BrbGtvY5.js` in both browser distributions. Check, all 410 tests in 53 files, the full build and verify:build passed. The [design study](../product/equalizer-design.md) records primary streaming-service references and the resulting choices.

Chrome's 780×600 extension UI tab showed a 430×560 dialog at (175, 20), unchanged across Sound, Appearance, Controls, bypass and reopening. The enabled Sound body measured 456 px visible / 456 px content. All three navigation tabs remain visible in the header. The preset dropdown visibly scrolls within its own bounded menu; keyboard selection changed the active curve. A manual band adjustment enabled Save, persisted My Preset, and recalling it after Classical restored exactly the saved gains. Closing/reopening retained the curve and bypass state; bypass mounted zero vertical sliders.

Firefox 159.0.1 loaded the same final bundle at its actual installed extension origin. In its 780×527 viewport the dialog was capped to 430×495 at (175, 16); its Sound body measured 391 px visible / 454 px content. The header tabs remained visible above that scroll area. Appearance and browser-specific Controls retained the same dialog rectangle. Saved the manual curve, selected Classical with the keyboard, recalled My Preset and closed/reopened: the saved gains and selection remained equal. The expanded screenshot was inspected in both browsers. Music remained paused during these final layout checks.

The screenshots have since been replaced by the ten-band follow-up below; this section records the earlier five-band checkpoint. These checks cover extension-origin UI tabs rather than native toolbar-popup focus/lifetime, minimum browser versions or screen-reader operation. The earlier authenticated processing evidence remains separate from these final UI-only changes.


## Ten-band equalizer, Preamp and master integration — November 7, 2026

Integrated master `6c6b5d7`, resolving the shared protocol, settings/modal and documentation conflicts while retaining session-owner and lyrics behavior. The equalizer ADR is now [0010](../decisions/0010-equalizer.md), distinct from master's session ADR 0009. The runtime mock now supplies sender/sendResponse arguments; EQ transport assertions inspect the message payload in both runtime modes.

The final production front asset is `index-CLfeTmIk.js`; check, all 513 tests in 62 files, both browser builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. New regressions cover ten filter frequencies, manual gain at the actual Audio gain node, optional conservative auto-level, neutral bypass, saved Preamp recall/reset, five-band named/custom conversion, malformed/sparse storage and idempotent normalization. The first sandboxed standalone Firefox MCP startup timed out; the normal isolated run with browser-launch access passed, including Audio snapshots, repeat and session replies.

Chrome's final extension-origin UI tab used the verified staged bytes at 780×600/DPR 2. The 680×560 settings frame stayed at (50, 20), with eleven vertical controls and generous band hit areas. Inspected dark and light appearances, presets, -3 dB manual Preamp, explicit auto-level, personal save/recall, bypass and reopening. The Sound content remains internally scrollable if its last pixel or a shorter viewport needs space; navigation stays in the header. Reinstalling over seeded legacy five-band active/personal settings retained those stored values; the final UI mapped the built-in Bass curve to ten bands without writing storage. A manual edit/save then wrote ten bands, preamp/autoGain and the saved manual level.

Before the final sparse-value normalization hardening, `index-ILr1HJDD.js` was also checked through the real Chrome action popup: runtime.getContexts reported one POPUP, viewport 780×600, the same 680×560 frame, eleven sliders and no horizontal document overflow. Its authenticated playback with ten-band Bass/manual -3 dB Preamp reached active processing, currentTime 2 -> 25 seconds and null playbackError, then was paused at 40 seconds. The final change only canonicalizes invalid/sparse values and signed zero; this does not establish an audible frequency-response or clipping measurement.

Firefox 159.0.1's actual extension UI loaded `index-ILr1HJDD.js`. At 780×527 its frame was 680×495 at (50, 16), with all ten frequencies and Preamp; shorter-body scrolling retains pinned navigation. Keyboard-operated Preamp, save/recall and all three tabs were observed. A coordinate click reported success without selecting the intended tab and altered faders; it is not counted as Firefox pointer acceptance. Explicit keyboard focus/Enter selected Appearance and Controls correctly. The final `index-CLfeTmIk.js` distribution separately passed the isolated background-runtime smoke; this does not claim final interactive Firefox playback or popup coverage.

[Dark expanded settings](../product/images/settings-equalizer.png), [collapsed settings](../product/images/settings-collapsed.png) and [light appearance](../product/images/settings-equalizer-light.png) are actual cropped Chrome screenshots with no catalog/account content. Preset migration approximates intent, not exact old frequency response/loudness. Every CDN, live HLS, screen readers, minimum browsers and complete native popup focus/lifetime behavior remain outside this checkpoint.

## Equalizer validation and optional Mix access — November 7, 2026

The follow-up replaces the single personal slot with named presets, removes redundant status text, aligns the theme field and prepares direct media before initial playback. The final front asset is `index-B8_4fmFe.js`; offscreen is `app-D4VdwEiz.js`. Check, all 523 tests in 63 files, full two-browser builds and verify:build passed. After moving the access state above the faders, check, the seven focused UI/modal cases, the full builds and verify:build passed again. The isolated Firefox 159.0 smoke passed startup, native Audio snapshot, repeat commands and validated session replies with the same final offscreen asset.

Controlled regressions cover named save/recall/rename/deletion, legacy migration, settings-preserving clearStorage, initial preparation before play, pause/resume while preparing and obsolete downloads. Permission tests prove that install/reopen do not request access, first enable shows an explanation before requesting, deferral/native refusal preserve enabled EQ and presets, repeated enables do not nag, Give access can retry, and grant sends RETRY_EQUALIZER over both transports without changing playback state. Parent/card focus trapping and restoration are checked with the real VKUI managers. Manifest tests assert required access remains limited to VK and okcdn access is optional in both browsers; Firefox uses optional_permissions for its existing 113 minimum, per [MDN compatibility guidance](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/optional_permissions).

Chrome's authenticated extension UI retained three presets created through the real interface (Мой пресет, Наушники, Колонки), with exact collection equality before/after a same-path update in the preceding runtime build. All three also remained in the final installed bundle. The Appearance label and selector share their left edge with a 6 px gap. Dark/light EQ, collapsed state and Appearance screenshots were inspected. The final permission explanation names the server and purpose; deferral retains enabled=true and all three presets. The unavailable/retry message is visible directly below the switch. Disabling/re-enabling after deferral leaves only the settings dialog open. Grant was observed through the real request action in the automation profile; native Chrome denial UI was not independently exercised. With optional access granted, Mix from vd354.okcdn.ru reached active, played=true, time 6 -> 22 seconds and null playbackError, then was paused.

Firefox 159.0.1 loaded `index-BGS7b6-X.js`, the identical runtime/permission implementation before the access-state placement change. Reopening enabled settings with no okcdn grant did not prompt. Explicit off/on opened the explanation, and Allow opened Firefox's native notification naming access to okcdn.ru domains. Clicking its actual Deny button left permission=false, enabled=true, the migrated named preset intact and the Mix-unavailable/Give access state visible. Give access reopened the explanation and native request; clicking Allow cleared refusal and granted the origin. Mix from vd703.okcdn.ru reached active processing and progressing time with no playbackError. After revoking access and selecting another Mix track, native playback continued with unavailable processing and no error. A subsequent grant/retry on that current source changed status to active while playbackId, audiosIds and currentPlaylist stayed exactly equal across the grant; time progressed 87 -> 101 seconds. Music was paused afterward. The final layout-only bundle was then installed over the same extension.

An earlier sanitized Chrome event trace with the same preparation runtime recorded one initial audio-player-playing event at time 0 for an ordinary track and one for Mix, with loading -> active and advancing time; no startup source-switch play event repeated in those samples. This identifies and removes the original EQ implementation's native-start/local-replacement interruption, not every possible audible stutter. Independent OfflineAudioContext.getFrequencyResponse comparisons checked the compensation estimate against native biquads at 32/44.1/48/96 kHz; at 48 kHz Bass measured approximately +6.886 dB against 7.1 dB compensation, Rock +5.310 against 5.6, and all +12 bands +22.48 against 22.7. This measures filter response, not acoustic output or clipping on real music.

Direct EQ playback can add download latency (15-second / 32 MiB bounds); turning EQ on for an already-native source or retrying access can briefly rebuffer while preserving position. The [ADR](../decisions/0010-equalizer.md) records these limits. Final real-toolbar popup focus/lifetime, minimum browser versions, screen readers, every CDN and live HLS remain outside this follow-up. Cropped [consent](../product/images/settings-mix-access.png) and [refusal](../product/images/settings-mix-unavailable.png) screenshots contain no catalog/account content.

## Equalizer editing, discovery and track status — November 7, 2026

The next follow-up uses front `index-Q2x1B-_p.js` and offscreen `app-DuIG9DCd.js`. Check, all 563 tests in 65 files, full Chrome/Firefox build and verify:build passed. The isolated Firefox 159.0 runtime smoke passed with the final offscreen asset. Focused cases cover default-off compensation while retaining explicit true, numeric release-threshold crossings (including skipped minor/major/four-component versions), UPDATE-only announcement persistence/consumption, edited personal-preset overwrite/copy/delete, same-ID URL hydration, duplicate navigation roots, five-second hint expiry and permission-change dismissal. A controlled native-to-local retry verifies that position 42 is restored and play is held until both metadata and DSP readiness complete.

The connected Chrome profile was busy, so it was left untouched. Firefox 159.0.1 loaded the final front asset at its actual installed extension origin and retained authenticated catalog/settings data. Its DOM confirmed the palette icon and label/input at x=118 with a 6 px gap. The automation browser's selected document was initially inactive and screenshots lagged its DOM, so those frames were not accepted as final visual evidence. No personal Firefox profile was used and no cookies were copied.

An independent headless Chrome profile loaded a system-temp copy of the actual extension via Extensions.loadUnpacked. A staged bootstrap supplied only a synthetic session reply; HTTPS requests were stubbed with empty responses. No fixture hooks entered production source, no real credentials/catalog data were used, and this is not authenticated playback evidence. A synthetic full track/settings snapshot exercised the notification UI. An incomplete initial track fixture caused a frontend render failure; supplying the complete TrackItem shape corrected the harness. Empty catalog fixtures also produced an expected parser diagnostic; console emptiness is not claimed.

In the 780x600 actual extension-origin UI, ArrowUp changed the selected Наушники curve without losing its name or delete action. Save Changes updated its existing stable ID to +7 dB at 32 Hz while retaining one saved entry. The compensation checkbox was off. Screenshot inspection confirmed the Save Changes/rename/delete row, hidden visual preset heading, returned palette icon, compact theme field, and a subdued current-track strip above the EQ group with no trailing period. Theme label/input both measured x=118.

Seeding the persisted announcement state showed one visible gear-anchored Popover despite hidden responsive navigation copies. It consumed the flag and closed after the configured five seconds (about 4.82 seconds remained after screenshot capture). A playing/unavailable synthetic okcdn source with permission=false showed the separate access hint; clicking its real close button dismissed it, and changing to the next source did not repeat it. No whole-page horizontal overflow appeared. The [design screenshots](../product/equalizer-design.md) are cropped from that isolated run. Numeric UPDATE eligibility itself is verified through the real install listener in controlled tests; the manifest version bump remains owned by the release workflow. Native permission UI, latest authenticated retry playback, final toolbar popup and minimum browsers were not repeated in this follow-up; earlier grant/current-Mix evidence remains above. The isolated profile was closed and the authenticated Firefox player remained paused.

### Integration with the current playback controls

Rebased onto master 3bb4f0f, retaining the new Space shortcut, recommendation controls and playback recovery. The settings conflict preserves the Space guidance alongside the tabbed controls. The gear hint explicitly uses a non-modal region, so its presence does not disable the global Space shortcut; an integration regression exercises the actual shortcut hook while the hint is showing. Final check, all 596 tests in 67 files, both builds and verify:build passed. A further controlled failure case retains native converted playback at its position if context preparation rejects, instead of waiting indefinitely for DSP readiness.

The isolated Chromium visual workflow was repeated after integration with front index-D1XYd5tP.js: preset overwrite, palette alignment, separate track-status strip, one visible announcement, five-second expiry, closable missing-access hint, next-track suppression and no horizontal overflow all passed. Screenshots were refreshed from that run; there was no authenticated playback in the isolated Chrome fixture. The final offscreen asset is app-DXg0NQaS.js; the isolated Firefox 159.0 smoke passed startup, native Audio snapshot, repeat and validated session replies with that asset.

## Mix restriction styling and stable notifications — November 7, 2026

The follow-up uses front `index-BWBUKtXa.js` and offscreen `app-C90eXPwV.js`. Check, all 602 tests in 67 files, full Chrome/Firefox builds, verify:build and the isolated Firefox runtime smoke passed. After compacting the final status/warning spacing and fixing menu width, check, the frontend rebuild and verify:build passed again; the offscreen bytes are unchanged.

A controlled regression first reproduced three denied downloads while changing presets on one unavailable source. The corrected owner performs only the original attempt and publishes no new loading/unavailable transition during those edits. Explicit retry performs a second attempt. Real Chrome-runtime and Firefox-bridge tests pass the retry=true configuration through the actual receiving router, preserving automatic current-source retry after permission grant. UI timing regressions cover no presentation/consumption before 1.5 seconds, cancellation on opening Settings or permission grant during that delay, five visible seconds, explicit dismissal, same-ID URL hydration and responsive navigation copies. Message kind remains stable while hiding.

The independent isolated Chromium workflow described above loaded the final actual extension UI with the same synthetic session/track boundary. Screenshots were inspected in both themes: the Mix restriction now has a warning background/left border, lock icon, explicit title and primary Give access button. A compact track-status line and tighter card padding keep frequency labels visible in the 680x560 frame. The missing-access hint title is “Эквалайзеру нужен доступ”. It was absent at 500 ms, appeared after the configured delay, and its five-second lifetime remained intact; explicit close and next-track suppression still passed. Theme field and open dropdown both measured 240 px; Системная, Светлая and Тёмная were fully visible, with palette/label alignment retained. No whole-page horizontal overflow appeared. The fixture's empty-catalog parser diagnostic remains the known isolated-harness limitation; console emptiness and authenticated playback are not claimed.

The project UI-copy rule now omits terminal full stops in messages/helper text, including existing action, sign-in, lyrics, recovery and support copy; dynamic user content and domain/URL punctuation are preserved. Existing exact-copy regressions were updated without weakening their action/failure assertions. The redundant Space explanatory sentence was removed from Settings while its real shortcut remains covered. Earlier authenticated permission/current-Mix evidence and the runtime/size limits remain applicable; this visual pass did not repeat authenticated native permission prompts or minimum-browser checks.


## Deterministic reset and ungranted Mix downloads — November 7, 2026

The follow-up uses front `index-Dd8IerlA.js` and offscreen `app-pLg7pkjf.js`. Check, all 612 tests in 67 files, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. The first sandboxed Firefox MCP launch timed out; the isolated launch outside that sandbox completed startup, Audio snapshot, repeat and validated session checks.

UI regressions cover Reset from an edited personal curve, a neutral personal curve and a personal curve identical to a built-in: the selector always becomes “Ровный звук”, pending naming closes, the collection and compensation/refusal choices remain intact, and the original personal curve can be recalled immediately. Matching built-ins no longer resolve back to a personal entry without an explicit personal selection.

Both runtime transports exercise actual playback and configuration routers with two consecutive ungranted okcdn.ru sources, preset changes, bypass/re-enable and explicit retry: there are zero processing fetches while native Audio plays. A grant allows a new attempt; a rejected permission lookup fails closed. Deferred permission checks cannot deliver an obsolete playback command or superseded EQ settings. The controlled denied-to-granted conversion test restores position 42 and waits for both metadata and DSP before resuming.

An isolated Chromium profile loaded the built extension, with a staged synthetic session/bootstrap and empty catalog fixture. Real settings controls verified Reset, immediate personal recall, neutral personal recall and an unchanged two-entry collection. The real Chrome offscreen document then received a synthetic okcdn.ru WAV source with enabled EQ and no optional grant. CDP served audio without CORS headers: the only media request had resource type Media, no processing Fetch occurred, status became unavailable, and a subsequent Audio snapshot showed playing=true with increasing currentTime. This establishes native-playback fallback for the synthetic source, not authenticated CDN availability or audible filter response. Earlier authenticated Mix/grant evidence remains above; latest live native permission prompts and every CDN were not repeated.
