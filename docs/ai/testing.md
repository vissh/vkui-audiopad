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

## Request diagnostics and recovery (November 11–12, 2026)

The diagnostics task started from freshly fetched origin/master 2c2efff66470d34f8e1a0d4f0d5214622c07bf95 in a dedicated worktree; the final remote check retained that base. The repeated-HTML regression fails against that base's legacy client with Error: respAfterReconnect and passes against the changed client with safe operation/stage/status/Content-Type metadata. The full suite passed 850 tests across 96 files; check, the two-browser production build and verify:build passed. [The recovery policy](error-diagnostics.md) documents the distinctions and remaining adapter limits.

The isolated Firefox 160.0 smoke passed startup, Audio snapshot, repeat commands and validated session replies without VK credentials. A separate temporary addon with a unique test ID used the production assets/index-C9qna2cq.js frontend and a synthetic fetch adapter in UI/background contexts. The adapter returned successful-HTTP text/html containing a synthetic secret for VK requests. Seeded synthetic user/epoch and volume remained unchanged after verification failure and explicit retry. The report showed version 3.4.1, Firefox/160.0, the correct asset, operation=web_token, stage=retry, attempt=2, status=200 and contentType=html; its text excluded the synthetic response secret. The report opened by clicking its summary and the textarea was read-only. At 780×600, the expanded field fit inside the viewport horizontally (x=16, width=748) and a screenshot confirmed readable dark-theme presentation without horizontal page overflow. The temporary addon was uninstalled afterward. This is a controlled upstream-failure check in a real extension, not a reproduction of the original user's VK response or an authenticated music/playback check.

Chrome MCP connected but rejected installation from both the dedicated worktree and temporary staging path because they were outside its configured workspace roots. Chrome visual/popup verification remains unavailable in this session. DOM tests additionally cover catalog reports, safe console output, build identity and provider-independent render-crash recovery. They do not establish every error layout, clipboard behavior or real toolbar-popup lifetime.

## Chrome smoke with an authenticated account

[Playback shortcut regressions](../../tests/front/playback-shortcut.test.ts) cover the first Space in both popup/tab contexts without clicking or awaiting tab detection, scroll prevention with navigation/link focus, missing physical key codes, held Space, focused/editable controls, dialogs, modified/composing/handled events and listener cleanup. [Recommendation card regressions](../../tests/front/recommended-playback.test.ts) cover first-track selection without navigation, duplicate-load suppression/focus, shared pause/resume intent, owner identity, empty/failed reads with retry, cancelled late completion and accessible names without tooltips. These are controlled DOM tests. In a real toolbar popup and extension tab, press Space immediately after opening without clicking: playback must toggle without scrolling. Then start a generated Home card, verify selection/native playback and unchanged page, click a navigation tab or link and press Space twice, check typing and focused-button Space, and repeat with a dialog open. Inspect idle/hover/keyboard-focus cards in both themes: the full cover darkens and the icon appears centered; mouse activation followed by pointer exit must hide it again. Hovering the icon must change its color without showing a tooltip. Check pending/failure feedback and leave playback paused.

Use a dedicated Chrome profile with an authenticated VK account for relevant catalog and playback checks. Browser checks can be performed manually or with an automation tool. Optional automation setup is documented in [MCP setup](mcp.md).

1. Run ./build.sh and npm run verify:build.
2. Open chrome://extensions, enable Developer mode and load dist/chrome_extension as an unpacked extension. Reuse the same directory for upgrade checks.
3. Sign into VK in that browser profile and open the extension from the toolbar.
4. Verify data, navigation, playback/progress, search results, settings/support dialogs and closing/Escape. Inspect the popup and service-worker consoles through browser developer tools.
5. Inspect screenshots for layout/spacing and measure geometry when needed. Record viewport dimensions, browser version and the loaded build.

Popup focus loss closes its document. Reopen it from the toolbar before continuing. For longer checks, open the installed extension's chrome-extension://<id>/index.html page in a tab at 780x600. Verify the real toolbar popup separately. Inspect background playback through the extension's service-worker developer tools.

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
3. **Upgrade:** install_extension over the same path without uninstall. Compare preserved Chrome settings and localStorage.theme; runtime keys must be removed. When CURRENT_*_VERSION changes, verify the badge appears and is acknowledged by visiting its UI. An unpacked developer reload can also emit onInstalled(UPDATE) and clear runtime data. Observe storage and preserve necessary test state before either operation. For frontend-only iteration, replace staged frontend assets and reload index.html without reloading the extension runtime.

Build-tooling changes need bundle identity. Storage schema/atom/protocol or migration changes need all three. UI notification-version changes need upgrade behavior.

## Firefox smoke through MCP

For manual Firefox checks, open about:debugging, select This Firefox and load dist/firefox_extension/manifest.json as a temporary add-on. Use a dedicated profile, sign into VK there and inspect its extension page, toolbar popup and background console.

The optional automation sequence below uses [the shared Mozilla moz-build configuration](mcp.md#firefox-extension-checks) and a dedicated profile. Discover the available tools before starting. Keep authentication in the test profile.

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

Historical playback/search runs recorded roughly 800 inline-handler CSP errors per request set from detached VK HTML parsing. The current parser neutralizes legacy event attributes before parsing. Investigate any recurrence against the current build and request source.

The Web Manifest icons warning was traced to the frontend's rel=manifest link pointing at the extension manifest. That link was removed in the [November 9 audit](#additional-performance-and-design-audit-november-9-2026). Extension icons retain their required size-to-path mapping. Treat a new occurrence as a regression.

External image responses can produce CORB/ORB notices. In the November 9 run, an avatar request to the VK photo CDN was blocked by ORB. Person cells use VKUI's neutral image-failure fallback. Compare the blocked resource and response category with the affected UI. Keep signed URLs and personal payloads out of reports. Arbitrary CSP warnings and new error categories still require investigation.

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
| Catalog is empty or sign-in appears | Verify the test browser profile's VK session and the extension's host permission. A logged-in window in another profile has a separate session. Do not clear user data to diagnose a temporary network failure. |
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
- Default VKUI secondary-text contrast and spoken screen-reader acceptance remain open under T17. See the [accessibility follow-up](#accessibility-and-collage-checks-november-8-2026) for current coverage.

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

Not checked: Firefox, volume, seek, shuffle/repeat, hotkeys, natural end, SW restart with live audio, offline/media failure and attempt-budget exhaustion. These remain T05/T14/T17 scenarios and offline coverage where implemented. System theme was restored and music paused afterward. Screenshots do not replace keyboard/accessibility validation.

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

This is controlled Chromium UI evidence, not authenticated VK catalog/media playback, live Firefox frontend coverage or minimum-browser verification. An isolated Firefox runtime smoke also passed. No personal credentials, VK payloads or library mutations were used.

### Issue 11 hover and navigation-focus follow-up

The first shortcut implementation ignored anchors and ARIA tabs even though they do not consume Space. Three new regressions failed for retained link/tab focus and missing physical key codes; the handler now recognizes those cases while preserving editable fields and controls with their own Space action. Recommendation cards now reveal a centered 48 px white play/pause button and a full-cover 40% black overlay on hover or visible keyboard focus. Pointer activation clears the keyboard-only reveal, so focus retained after a mouse click does not keep the overlay visible outside hover.

The isolated Chromium extension-origin UI used assets/index-Dc0QSekJ.js and assets/index-BM32JQnk.css with the same synthetic session/catalog fixture boundary described above. On a deliberately scrollable page, clicking the real Home tab and pressing Space twice dispatched two toggles while scrollY remained 0 and focus stayed on tab-general. Overlay opacity was 0 at rest and 1 on hover, its bounds matched the full 165x200 card, and the 48x48 button's center offset was exactly 0 on both axes. Clicking the button then moving the pointer out restored opacity 0 despite retained button focus. Three real Tab presses reached the first card action and revealed it with visible focus; Space activated that button without another global toggle. Light/dark screenshots were inspected at 1000x700 and 780x600. All 513 offline tests passed; both builds and verify:build passed.

The full-cover hover treatment follows the requested visual behavior. Compare it with the current website in an authenticated browser and verify media playback as separate acceptance checks.

### Immediate popup Space and album glyph follow-up

The earlier tab-only guard deliberately skipped toolbar popups, so pressing Space immediately after opening one still scrolled. Three controlled regressions reproduced that omission and the asynchronous tab-lookup gap. The app now installs the same synchronous playback shortcut in both UI contexts. Recommendation controls retain accessible play/pause names with their tooltip forced closed; a focus/hover regression checks that no tooltip or native title appears. The album's Icon36Play/Icon36Pause glyphs render at 48 px inside a transparent 56 px control, with white-to-secondary-text hover feedback instead of a white circular background.

An isolated actual Chrome toolbar popup reported POPUP context, tabs.getCurrent() undefined, BODY focus and a scrollable document before any click or key. Its first Space started a local silent WAV through the real SW/offscreen Audio path: played/requested became true and time advanced. A second Space paused it; position remained stable over 650 ms, playbackError stayed null and scrollY stayed 0. This test used synthetic session/catalog/queue data, a staged WAV and a temporary worker fetch adapter for VK playback bookkeeping. No live VK request or credential was needed. The final UI assets/index-BONK25Ta.js and assets/index-BQeVwMIn.css were checked again after reload: Space resumed/paused without clicks, the SVG measured 48x48, background was transparent, icon hover changed white to rgb(118,120,122), and there were no tooltip nodes or title. Popup screenshots were inspected and playback was left paused. Check, all 514 offline tests, both builds, verify:build and isolated Firefox 159 runtime smoke passed. This adds native local-media popup evidence, not authenticated VK playback or Firefox popup verification.

### Recommendation glyph background correction

The previous hover screenshot still showed a circle: setting the IconButton background transparent did not remove VKUI's separate Tappable state layer. Existing album controls use a bare glyph with color-only feedback. Recommendation controls now explicitly pass hoverMode=none and activeMode=none through the shared wrapper, removing that layer and press ripple while retaining accessible button semantics, pending/error guards and color feedback. Other controls retain their default VKUI modes. The focus outline is rectangular rather than circular.

A controlled hover/press regression first failed on the actual vkuiTappable__stateLayer node; it now passes for both play and pause. All 515 tests and check passed, as did both builds and verify:build. An isolated Chromium extension tab at 780x600 loaded assets/index-Bncxnerx.js and assets/index-DOe8fCtz.css with synthetic catalog/session data. With the pointer directly over the glyph, its state-layer count was 0, its background was transparent, and its color was rgb(118,120,122). The count remained 0 after a real click; the header play button retained its ordinary state layer. Full-page and cropped hovered-card screenshots were inspected, showing no circle or tooltip. This is local controlled UI evidence; no new authenticated VK comparison was performed.
## Server playlist implementation: November 7, 2026

[Server playlist UI tests](../../tests/front/server-playlists.test.ts) and [VK adapter tests](../../tests/common/vk-playlists.test.ts) cover the complete queue with unloaded IDs/access keys, empty creation, creation with initial tracks, existing-playlist addition, repeated submit, cancel/reopen, empty playlist navigation, ambiguous failures, list retry, account-scoped invalidation, retired UI completion, malformed/partial responses, raw-offset pagination/filtering and token/account mismatches. Separate owner and frontend module instances exercise the session request/reply contract from ADR 0009, including rejection of late create/add results after an epoch change.

Controlled Chrome UI checks at 780x600 verified title-field focus, creation and return focus, owned-playlist selection, track addition and queue saving with unloaded IDs. Screenshots showed no horizontal document overflow.

For authenticated acceptance, create an empty playlist, save a queue with unloaded tracks, add a track to an existing playlist and confirm each result on VK after reloading. Compare the website and extension dialogs, requests and errors in Chrome and Firefox, including actual toolbar popups. These server and website comparisons remain to be completed. [The parity reference](../product/vk-parity.md#server-playlist-implementation-november-7-2026) records API sources and response-validation rules.

## Home tiles and playlist covers: November 7, 2026

[Catalog interaction tests](../../tests/front/home-catalog.test.ts) cover server order/titles, optional metadata, category navigation, root-pointer resolution, exact cursors, safe URLs/colors, section identity, immutable page merging, retry and owned-playlist artwork/navigation. [Image tests](../../packages/common/src/catalog-images.test.ts) cover photo priority, image sizes, four-cover limits and missing/unsafe metadata. [Listening/category tests](../../tests/front/listening-catalog.test.ts) cover separate navigation/playback, duplicate activation, cancellation and late replies, empty-category retry, varied match values, optional profiles, failed artwork, full-source track selection, legacy metadata and missing-preview retry.

Controlled UI checks in both themes at 780×600 and at 360 px width verified compact category rails, listening cards and playlist covers. Category tiles measured 238×56 px, listening cards 316×336 px, narrow-screen cards 280 px wide and owned-playlist covers 160×160 px. Keyboard Tab reached the separate category play button. The first playlist tile opened creation and returned on cancellation. Neither page had document horizontal overflow. Response fixtures varied titles, match values and artwork, and missing listening images used a neutral VKUI surface.

Check, all 665 tests in 72 files, both browser builds and verify:build passed. Authenticated acceptance must compare current catalog payloads, category playback, playlist persistence and website layout with the extension. Category play currently selects the first supported track collection or playlist from its section, so its behavior requires comparison with VK's radio action.

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

The final production front asset is `index-CLfeTmIk.js`; check, all 513 tests in 62 files, both browser builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. New regressions cover ten filter frequencies, manual gain at the actual Audio gain node, optional conservative auto-level, neutral bypass, saved Preamp recall/reset, five-band named/custom conversion, malformed/sparse storage and idempotent normalization.

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

Firefox 159.0.1 loaded the final front asset at its actual installed extension origin and retained authenticated catalog/settings data. Its DOM confirmed the palette icon and label/input at x=118 with a 6 px gap. Visual checks used the isolated Chromium run described below.

An independent headless Chrome profile loaded a system-temp copy of the actual extension via Extensions.loadUnpacked. A staged bootstrap supplied a synthetic session reply, full track/settings snapshot and controlled catalog responses for the notification UI checks. The fixture setup stayed outside production source.

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

The follow-up uses front `index-Dd8IerlA.js` and offscreen `app-pLg7pkjf.js`. Check, all 612 tests in 67 files, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke passed.

UI regressions cover Reset from an edited personal curve, a neutral personal curve and a personal curve identical to a built-in: the selector always becomes “Ровный звук”, pending naming closes, the collection and compensation/refusal choices remain intact, and the original personal curve can be recalled immediately. Matching built-ins no longer resolve back to a personal entry without an explicit personal selection.

Both runtime transports exercise actual playback and configuration routers with two consecutive ungranted okcdn.ru sources, preset changes, bypass/re-enable and explicit retry: there are zero processing fetches while native Audio plays. A grant allows a new attempt; a rejected permission lookup fails closed. Deferred permission checks cannot deliver an obsolete playback command or superseded EQ settings. The controlled denied-to-granted conversion test restores position 42 and waits for both metadata and DSP before resuming.

An isolated Chromium profile loaded the built extension, with a staged synthetic session/bootstrap and empty catalog fixture. Real settings controls verified Reset, immediate personal recall, neutral personal recall and an unchanged two-entry collection. The real Chrome offscreen document then received a synthetic okcdn.ru WAV source with enabled EQ and no optional grant. CDP served audio without CORS headers: the only media request had resource type Media, no processing Fetch occurred, status became unavailable, and a subsequent Audio snapshot showed playing=true with increasing currentTime. This establishes native-playback fallback for the synthetic source, not authenticated CDN availability or audible filter response. Earlier authenticated Mix/grant evidence remains above; latest live native permission prompts and every CDN were not repeated.


## Catalog and playlist parity follow-up, November 7, 2026

The current authenticated VK website and actual Firefox extension origin were inspected with Firefox 159.0 at 1204×717, DPR 2. Website Explore grew from 2821 to 5181 px after scrolling, exposing charts, further editorial groups, curators and “Музыка друзей”. Native genre tiles measured 198×48 px. Inspected dark-theme screenshots of native categories/radio and the extension's Home, categories, mixed playlist rail and radio grid. The extension had no document-level horizontal overflow in those observations. Native library/show-all formats were inspected alongside token payload schemas without retaining personal responses or credentials.

The actual extension loaded 100 enabled radio stations. A station stream reached played=true, currentTime=14 and no playbackError, then was paused through the header. The original website's radio follow/unfollow round trip returned response=1 and ended unfollowed.

A disposable extension playlist with two selected library tracks preserved description and no_discover across reopening. Renaming, reordering and removing a track were saved and read back, then the playlist was deleted through its explicit confirmation. That run exposed creation's reversed insertion order. The corrected creation was verified with another disposable playlist, whose two tracks reopened in the selected order. Its synthetic 400×400 PNG cover completed upload, photo save and attachment, appeared as a server image on reopening, and was removed through Save. Firefox BiDi rejects file upload to privileged extension contexts, so that cover's File/Change event used a synthetic DataTransfer adapter. The real UI handler, session owner and VK upload/save requests ran normally.

The final category action started an authenticated genre Mix with its returned context, increasing time and no playbackError, then was paused. “Слушайте друг друга” opened a 20-album page, and selecting a friend opened their real catalog without an error. A realized existing browser context retained its 1204×717 viewport while new hidden tabs could report 0×0, so those zero-size measurements were excluded from layout evidence.

Controlled tests cover response formats, owned/followed/album discrimination, complete editor loading, staged changes, duplicate submission, safe failures, show-all inheritance, fractional matches, friend destinations, radio parsing/actions, Mix context, immutable merging and automatic cursor progress/stall. Cover tests cover file/destination validation, epoch retirement, staged attachment retry and avoiding duplicate playlist/photo creation after partial completion. Live playlist/cache behavior in another UI window remains separate.

The Mac was locked during this run. Browser documents reported visibilityState=hidden, which deferred native lazy image/IntersectionObserver callbacks. Screenshots and successful browser-script state checks establish the scenarios above. The final extension scroll nevertheless loaded its continuation, growing from 3161 to 5023 px and displaying curators and friends. A curator card opened its dedicated catalog without an error. Visible-window lazy-scroll timing, the native extension file picker, actual toolbar-popup focus/lifetime, both-theme responsive comparison and minimum browser versions remain unverified for this final build. Controlled intersection tests verify bounded continuation behavior independently of that limitation.

The final build uses front index-6cHrlNI3.js and offscreen app-Czs4hBQf.js. All 696 tests in 73 files, check, both full builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. The final regression also verifies account-scoped cache invalidation after a pending dialog closes and direct metadata resolution for editable playlists beyond the first library page. The preceding index-D6_f8CZH.js authenticated Explore pass loaded its 3161→5023 px continuation and opened a 20-friend grid without horizontal overflow. Token playlist follow cleanup used the corrected owned-copy removal and restored the original five-item library. The extension radio follow/unfollow round trip also ended in its initial unfollowed state. Music was left paused and all disposable playlists were removed.

### Visible-window and toolbar-popup follow-up

After the Mac was unlocked, the same Firefox 159.0.1 profile and authenticated extension origin were inspected with visible documents. Native Explore again grew from 2821 to 5181 px. Extension Explore grew from 3161 to 5023 px and automatically loaded its lower charts, curators and friends. Loaded covers, category artwork, promotional banners and round avatars were inspected in dark and light themes. Light My music retained one five-item mixed playlist rail plus friends, and the separate radio page loaded 100 stations. Wide-tab and 780 px observations had no document-level horizontal overflow.

The actual toolbar action popup was opened through chrome.action.openPopup and inspected through its extension popup view and Firefox's native panel browser snapshot. It measured 780×600 with visibility=visible and focus=true. Opening the playlist editor first reproduced a zero-height popup. VKUI's global modal lock fixed the html element, which removed its content from Firefox's intrinsic popup-size calculation. The application now selects VKUI's contained scroll controller for actual action-popup views while keeping global scrolling in ordinary tabs. [Viewport regressions](../../tests/front/application-viewport.test.ts) cover both controllers, modal locking/unlocking and navigation reset.

The final front bundle is index-CLoWyLM8.js, with unchanged offscreen app-Czs4hBQf.js. Its actual popup retained height 600 and a 568 px editor dialog in both themes. The editor was opened, cancelled and reopened without dispatching saves. Its inner scroll made the complete Save button reachable at y=544–572 within the 600 px viewport. Closing restored a 500 px library scroll position. Selecting another tab reset the contained scroll position to zero. Popup Explore independently reached height 5023 and loaded curators and friends without horizontal overflow. Popup closure removed the old view, and reopening created a focused, correctly sized view. The original system theme was restored and no music or playlist mutations were performed in this follow-up.

Check, all 698 tests in 74 files, both full builds and verify:build passed. The isolated Firefox smoke initially timed out while connecting its MCP subprocess in the sandbox. Repeating the same command with network-capable execution passed startup, Audio snapshot, repeat and session validation on Firefox 159.0. Final Chrome-native popup behavior, the native extension file picker and minimum browser versions remain separate checks.

### Catalog loading and playlist review follow-up, November 8, 2026

The final front bundle is index-BA01UGZr.js, with unchanged offscreen app-Czs4hBQf.js. The preceding index-BATXN8Jj.js visual pass has the same layout; the final guard also lets paused legacy reads release their initial placeholders and keeps one personal library block during token-catalog failure. Review fixes cover inert legacy HTML parsing under extension CSP, coordinated initial catalog skeletons, one Home/Explore continuation owner, smaller friends, separate artist Mix portraits, numeric VKUI album widths, cover edit controls, breadcrumb editing and show-all cache invalidation. Controlled regressions cover quoted HTML attributes and event neutralization, delayed initial sources without a legacy-group flash, both artist image layers and reopening an invalidated album collection after mutation.

Authenticated Chrome checks used the actual extension origin at 780×600, with Slow 4G for initial and continuation observations. Home, My music and Explore showed initial skeletons. Observed script-src-attr violations=0, no visible “Мои аудиозаписи” flash and CLS=0 during the measured openings. Explore grew from 2918 to 4975 px after scrolling, with at most one visible Spinner and the lower curator/friends groups present. Radio showed 12 initial station placeholders, then 100 stations. A baseline CORB issue from an external resource remained separate from script execution diagnostics.

The requested friend's playlist rail measured 164 px cells, 144 px covers and 20 px cover gaps from the first pair onward. The complete personal playlist grid had a 28 px first-pair cover gap and no document overflow. Friend avatars measured 96×96. Artist Mix backgrounds and all six foreground portraits loaded in Firefox. Their source format and native dimensions were compared with the website. Native owned covers have Edit beside Play and Share, while the extension retains the requested two owned-cover actions.

A unique disposable empty playlist was created after caching the complete personal playlist collection. The mixed rail and the reopened full collection both changed from seven to eight items without a page reload. The new playlist's edit icon appeared on its navigation path. The exact test playlist was removed through its editor confirmation. Both views returned to seven items and the test title disappeared. Existing personal playlists were preserved. Playback remained paused.

The actual Chrome toolbar popup measured 780×600 with contained scrolling and no horizontal overflow. Cover edit appeared to the left of Play at the same vertical position, opened a 568 px editor dialog and cancelled normally. Its startup console had no CSP messages. Light radio and dark library/modal views were inspected. The browser emulation was reset afterward. The native extension file picker, full minimum-version matrix and cross-window query propagation remain separate evidence.

Check, all 702 tests in 75 files, both full builds, the subsequent frontend rebuild, verify:build and the isolated Firefox runtime smoke passed. The final CSS refinement retained the tested 780×600 popup dimensions and 568 px editor dialog.

## VK Mix settings and genre playback — November 8, 2026

The follow-up adds the native Home settings dialog with server-supplied mood, recognition and language groups. Inspected the website dialog, single-choice category behavior, Reset/Apply and the genre action format. The catalog calls the context mix_options, but playback sends options to audio.getStreamMixAudios. The native Apply action starts playback directly; it does not call a settings mutation. Per-account vkMixPreferences retain the selection independently of the current queue.

The final frontend is index-BOitJ_Sw.js and the offscreen asset is app-BJ20JMJs.js. The preceding index-CxkYZbPR.js has the same layout; the final build also registers remembered Mix choices among settings retained during update cleanup. Check, docs:check, all 712 tests across 78 files, both full builds, the frontend layout refinement and verify:build passed. The isolated Firefox 159.0 runtime smoke passed after repeating the MCP subprocess outside the network-restricted sandbox. Regressions cover schema validation, one choice per category, preserved genre context, draft cancellation, loading/error/retry/cancellation, per-account preferences, the native options request field and unchanged options on the next SW recommendation.

Authenticated Firefox and Chrome streams reached played=true with increasing time and no playbackError. Chrome's actual 780×600 popup played “Радостно · Новинки”, then “Рок” and “Рок · Спокойно”; the last request retained both additionals=[rock] and vibes=[calm]. Firefox played “Спокойно · Русский”, and Next retained its settings while extending the Mix history. Settings reopened with their selected values. The 420×486 px dialog fits the actual Chrome popup, with an outlet covering the whole 780×600 viewport and no document overflow. Native and extension dark-theme dialogs were visually compared. An explicit VKUI portal prevents the transformed hero from clipping the dialog. Choices were reset and music was paused after the checks. Minimum browsers, all recommendation categories and cross-window simultaneous preference writes remain separate evidence.

### Compact catalog and Mix review follow-up, November 8, 2026

The final frontend is index-BMAHYmRJ.js and the Firefox audio asset is app-9b69GbSr.js. All 717 tests across 78 files, check, docs:check, the full Chrome/Firefox build and verify:build passed. Firefox 159.0 isolated runtime smoke passed after the sandboxed MCP subprocess timed out and was repeated outside that sandbox. Controlled regressions cover account hydration before query-tree mounting, token-first skeleton release, ordinary playlist grid photos, artist Mix entity_id, related-artist routing, pending genre identity and startup removal of stale requested selections.

Authenticated native comparison measured 48 px friends and related-artist portraits in approximately 225 px horizontal cells. Final Chrome My music and scrolled Explore use 48 px avatars beside left-aligned names, with 20 friends available and no document overflow. The FEVER 333 page retained “Вам могут понравиться” with four loaded portraits and internal navigation to another artist. Listening show-all displayed ordinary playlist artwork throughout the scrolled grid. Artist Mix Play measured opacity 0 away from the card and 1 on hover. Actual artist_mix playback carried its separate entity, advanced time and retained a null playbackError in both authenticated browser passes.

A Slow 4G cold Home opening progressed from an empty mounting document to one stable Mix hero with catalog skeletons, then the populated catalog. The observed hero never disappeared, and “Мои аудиозаписи” never appeared. Explore grew from 2970 to 4761 px after scrolling and loaded its lower groups. Its continuation had exactly one loading indicator centered at x=390 in the 780 px popup. The configured Mix summary and reset button shared adjoining bounds. Applying mood, recognition and language preserved existing genre context, and Reset returned to unrestricted options. A Rock → pause → Pop observation found no intermediate active Rock state. Genre hover brightens the background, and shared action buttons disable VKUI’s surrounding hover/press layer while retaining glyph feedback.

The final actual Chrome action popup retained playlist rail y=176 before and during both create and edit at scrollTop=300. Its computed locked top stayed 0, and cancelling restored scrollTop=300. The create dialog remained inside the 600 px viewport. No save was dispatched during this review pass. Radio loaded 100 stations and its follow control measured 40×40 px with zero horizontal or vertical displacement from the card center. Playlist names occupy one ellipsized line and edit controls use a generic tooltip. Music was left paused, temporary Mix choices were reset and network emulation/cache overrides were restored. Existing evidence limits for native file selection, cross-window cache propagation and the minimum browser matrix continue to apply.

### Playlist metadata and React profiling follow-up, November 8, 2026

The final production frontend is index-CDQ3I7MA.js with unchanged app-9b69GbSr.js audio code. The index-BG_6x_e2.js visual pass has the same layout. The final frontend also stops queue metadata work when its view was closed before the storage snapshot returned. Check, all 728 controlled tests across 79 files, full builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. Additional regressions cover original-author attribution, source avatars and counters, metadata resolution for unloaded queue rows, source access keys, exact-equality heading suppression and both sizes of the track Mix control. The offline metadata adapter also checks 100-item batches and malformed input/responses.

Authenticated native inspection found 16 px author avatars and the original source owner for followed library copies. Supplying fields=photo_50,photo_100 with extended=1 returned user photos. Production Chrome's mixed library and its full collection showed distinct personal, followed-author, community and release-artist labels. Seven supplied library avatars loaded at 16×16 px. Native “Оставаться в тренде” cover counters use articles for the track count and headphones for plays. The extension reproduced the first card's 187 tracks and approximately 1.9M plays, alongside its community avatar. Cover Play changed from white to secondary gray on hover without a surrounding button layer.

Saving the actual 278-track queue opened an editor with 278 named rows and artists, with no numbered placeholder titles. Save and edit controls had matching vertical centers. The dialog was cancelled without a server mutation. “Новые имена” retained its navigation heading and omitted the identical group heading. Distinct-heading preservation has controlled coverage.

The native track action sent mix_id=track_mix with the source audio ID as entity_id. The extension's row action and active-player action each started that source-specific Mix, advanced playback time and retained a null playbackError. An authenticated Firefox extension tab independently started track_mix, advanced time and exposed the player action without a playbackError. Native and extension playback ended paused.

The official react-devtools-cdt-mcp 0.1.0 package was installed in the front development workspace. Its 12 registered tools were discovered and executed in an actual extension page. The readable profiling build returned Application, SessionQueryProvider, AccountQueries, QueryClientProvider and catalog component trees. A startup recording contained 59 commits with approximately 80 ms total React render time and a largest commit of 33 ms in CatalogFeed. This instrumented, unminified build is a diagnostic observation and has different execution cost from production.

Production uses a static HTML skeleton plus the account-hydration fallback. In a true Chrome action popup with CPU slowed fourfold, observation progressed from skeleton to application while retaining a 780×600 viewport. There was no empty React state between them. First paint occurred at 76 ms and contentful paint at 368 ms in that run. A separate unthrottled production tab had first paint at 76 ms. These are local measurements rather than a cross-device benchmark. The profiling stage and CPU emulation were restored to production/default settings after inspection. [Tool setup](extension-tooling.md#react-component-profiling) records the repeatable workflow and data boundaries.

### Startup and interaction performance, November 8, 2026

Before/after React MCP recordings used the actual authenticated 780×600 Chrome action popup, the same 278-track queue, default CPU/network settings and a cold UI reload with browser cache retained. The official profiling build records instrumented React render durations. These timings are separate from production paint measurements below.

| Initial route | React render total before / after, ms | DOM elements before / after |
|---|---|---|
| Home | 197.1 / 58.8 | 19,943 / 2,806 |
| My music | 195.0 / 55.6 | 19,109 / 2,291 |
| Explore | 219.7 / 81.3 | 21,588 / 4,741 |
| Radio | 187.0 / 53.6 | 18,423 / 1,576 |
| Current playlist | 164.8 / 151.9 | 17,015 / 16,783 |

Previously the hidden queue mounted on every initial route and consumed 82–117 ms of React time. First-visit page mounting removes that work from other routes and retains already visited pages. The initial 278-row queue mount remains the most expensive route.

| Interaction | Before | After |
|---|---|---|
| Queue play plus approximately 5.5 seconds of clock updates | 103.3 ms React total, 95.9 ms largest commit | 12.0 ms total, 1.5 ms largest commit |
| Four quick returns between loaded Home and Radio | 555 ms React total, 4 catalog reads | 5.7 ms total, 0 catalog reads |
| Explore, twenty 350 px scroll steps | 87.5 ms React total, 31.9 ms largest commit | 41.8 ms total, 29.1 ms largest commit |
| Cold Home request count | 8 | 2 |

Explore continued from 2955 to 4731 px through one continuation read, with lower groups and friends present. DOM counts from differently visited page histories were excluded from the scroll comparison. After 30-second freshness expired, returning Home issued one catalog read with cached content retained and approximately 10 ms total React rendering. Scrolling Home's first listening cards into view started three missing-preview reads. The other three cards remained unloaded. All six cards retained 336 px height before/after preview loading.

A separate ordinary production trace compared published c790d58's index-CDQ3I7MA.js with index-Clvvi5ED.js in the same real popup, same queue and retained browser cache, with CPU slowed fourfold and default network settings. First paint changed from 676 to 224 ms, FCP from 2400 to 784 ms and LCP from 2397 to 782 ms. CLS stayed 0. DOM elements changed from 19,951 to 2,806 and track rows from 304 to 26. Forced-reflow insight totals were 145 and 128 ms. These representative local runs establish the observed change under those conditions. Catalog network completion varied independently. The ordinary build had no React DevTools hook, and CPU emulation was restored afterward.

[Render-isolation tests](../../tests/front/render-isolation.test.ts) cover retained drafts, playback changes affecting only relevant rows, changed local track IDs and restore expiry after navigation, including late delete completion. [Catalog tests](../../tests/front/home-catalog.test.ts) cover freshness, invalidation and expired-data refresh. [Listening tests](../../tests/front/listening-catalog.test.ts) control visibility and verify deferred preview loading. Check, all 735 tests across 80 files, both full builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. The offscreen asset remains app-9b69GbSr.js.

The final production extension tab also retained queue edit mode across a Radio visit, cancelled the draft, switched through My music and Explore, and kept playback paused without document overflow. Explore again grew from 2955 to 4731 px and loaded friends. No JavaScript errors appeared. Chrome retained the external-manifest icons warning and the previously observed external-resource CORB issue. Instrumented heap observations varied with garbage collection, so no production memory reduction is inferred. The scoped CSS containment experiment produced inconsistent rendering benefits and was excluded from the implementation.

### Player and track-action design review, November 8, 2026

The review found mixed playback/track actions, inconsistent icon targets, an inert cover exposed as a button, unnamed transport/sliders and hidden row controls reserving title space. Track actions now follow queue, discovery and saving order, with library removal at the right edge. The player groups transport, track information, discovery/lyrics, saving, playback modes and broadcast/volume. Main action targets are consistently 28×32 px with 24 px glyphs in the player and 20 px glyphs in rows. Play/Pause has a wider 40 px target between Previous and Next.

The actual Chrome action popup retained 780×600 and a 48 px player header in light/dark themes. A temporary synthetic metadata stress case enabled lyrics and long title/artist strings on the paused selection, verifying the complete action set without overflow or button overlap. A 1216×700 extension tab gave the title approximately 357 px within 619 px of track information. The stress metadata was restored afterward. Hover and Tab revealed row actions within their cell, preserved 58 px row height and provided visible keyboard focus. Hover changed the glyph color with transparent button backgrounds. The final popup console had no messages in the inspected opening.

The developer extension reload unexpectedly cleared runtime state during this check. The captured paused 278-track queue and selection were restored from session memory, and subsequent frontend iterations used page reloads. No library mutations were dispatched. Front index-DzpJN6uq.js and unchanged offscreen app-9b69GbSr.js identify the reviewed build. [Control regressions](../../tests/front/playback-controls.test.ts) cover group order, accessible labels, unchanged transport commands and row order for owned/other tracks.

The same popup was inspected on My music, including its scrolled full-width track list, Explore and Radio. The controls kept their grouping across those pages. Check, all 738 tests across 80 files, the full Chrome/Firefox build and verify:build passed. Firefox's authenticated UI was not repeated for this layout-only follow-up.

### Reference-led player layout, November 8, 2026

The user's reference moves shuffle/repeat beside transport, stacks title and artist above progress and keeps track actions beside the metadata. The player now follows that arrangement using the existing actions. Library/playlist saving precedes Mix, similar tracks and lyrics. Time ends the metadata row, while the full center width belongs to progress. A passive volume glyph identifies the separate volume/broadcast area. The fixed header and its VKUI placeholder share a scoped 64 px height, and the startup skeleton reserves that height too. Empty metadata retains two-line space.

Final spacing uses a rounded, bordered frame with symmetric inset padding and a 48 px cover. Title/artist typography reserves 36 px, followed by the 12 px slider area. Cover and center content both begin at y=8 and end at y=56 within the 64 px header. Redundant cover margin was removed. The real 780×600 Chrome popup retained a 360 px progress area. A 1216×700 extension tab expanded it to 796 px. Light/dark inspection and a temporary long-title/artist plus lyrics stress case showed no overlap or document overflow. Final geometry also checked the complete action count through temporary DOM-only stress content, which was removed immediately. The selected track metadata was restored from the retained queue, whose 278 tracks remained paused. Controlled regressions verify left transport/mode order, saving/recommendation order and the shared metadata/action row. Check, all 738 tests in 80 files, both full builds and verify:build passed. The final front asset is index-BKcoKqYN.js. Chrome retained the previously observed external-resource CORB issue, with no JavaScript errors in the inspected popup.

### Glyph spacing, lower time and mute, November 8, 2026

The next review exposed a spacing defect in the preceding layout. The Play SVG retained 8 px of native VKUI padding and overflowed its assigned button width. Skip glyphs remained left-aligned. Transport buttons now center their SVGs with padding removed. Player action glyphs use size-capped containers, and their targets/groups produce equal 12 px glyph-box intervals, including the boundaries between transport/modes and saving/recommendations. The actual 780×600 popup and a 1216×700 light-theme tab both measured [12,12,12,12] across transport/modes and [12,12,12] across the four available track actions. Transport glyph centers were y=32 and track actions y=26. Shared icon-button centering also aligned all five row-action glyphs exactly with their 58 px track row center, preserving equal 12 px horizontal intervals. Time measured 11 px with a 14 px line height and center y=35, matching the artist line. Neither view had document overflow.

The volume icon is now a named mute control sharing the slider's pending draft. Volume and its remembered positive level are written in one storage update. Immediate mute cancels the 50 ms slider debounce. The remembered level survives popup closure and settings-preserving cleanup. In authenticated Chrome, 0.37 changed to 0 on mute, then a UI reload retained the muted state and unmute restored 0.37. The initial effective level of 0.5 was restored after the observation. Playback remained paused and the 278-track queue was retained. The preceding default-level check also created the existing offscreen runtime through the ordinary volume observer.

[Volume regressions](../../tests/front/volume-control.test.ts) cover atomic persistence, remount restore, quick mute/unmute before storage events, pending-slider cancellation, slider unmute, external updates, invalid/missing remembered values, write failure and unmount cleanup. Controlled Chrome and Firefox transport cases run the real storage listener, volume delivery and Audio handler, asserting native volume 0 then 0.37 while preserving playing state, source lifetime and position. [Cleanup coverage](../../tests/common/clear-storage.test.ts) retains the new setting. Check, all 752 tests in 81 files, full Chrome/Firefox builds and verify:build passed. The reviewed front asset is index-B8MQNnrq.js. The external manifest warning and earlier CORB issue remained in Chrome, with no JavaScript errors in the inspected UI.

### Horizontal-scroll arrow focus, November 8, 2026

VKUI 8.4.3 HorizontalScroll supplies aria-hidden=true and tabIndex=-1 to its ScrollArrow buttons. Pointer focus still reaches those buttons. The published build reproduced Chrome's “Blocked aria-hidden on an element because its descendant retained focus” warning after focusing an overflowing rail's arrow and inspecting the accessibility tree.

All application rails now use [the shared wrapper](../../packages/front/src/shared/ui/horizontal-scroll/HorizontalScroll.tsx), which overrides the public arrow slots with aria-hidden=false and tabIndex=0. Focus entering the rail requests VKUI's always-visible arrow mode for keyboard interaction. Stable ref callbacks transfer focus to the named root with preventScroll when the focused arrow unmounts at a boundary. Explicit showArrows=false is preserved, and rerenders/full rail teardown avoid unnecessary focus transfer.

The actual Chrome extension tab, using index-sMnqv6Yj.js, scrolled to both boundaries with accessible focused arrows. Each disappearing arrow transferred focus to its region, with scrollLeft reaching the requested end/start and vertical scrollY staying 742.5. Tab reached the next arrow with opacity 1 and a 2 px focus ring. Enter completed its scroll and returned focus to the region. The accessibility snapshot exposed the region and available arrow. No focused element had an aria-hidden=true ancestor, and the warning did not recur after navigation cleared the old console. The external manifest warning and CORB issue remained. Playback was paused and the 278-track queue was retained.

The actual 780×600 action popup independently reached both boundaries and transferred focus to its region. Its contained vertical scrollTop stayed 51.5 throughout, and the inspected popup console was empty. The popup was returned to the top after the check.

[Five controlled regressions](../../tests/front/horizontal-scroll.test.ts) cover keyboard discovery, both boundary handoffs, retained focus across content updates, full teardown and disabled arrows. Check, all 757 tests across 82 files, full Chrome/Firefox builds and verify:build passed.


## Accessibility and collage checks (November 8, 2026)

The dev-only axe-core dependency supports controlled DOM regressions in [accessibility.test.ts](../../tests/front/accessibility.test.ts). These cover independent track/artist/action controls, album navigation and overlays, mode states, seconds-based seek and percentage volume values, hidden skeletons, radio list semantics, keyboard queue reorder controls and first-response Home loading with a legacy-error fallback. Offline scans disable color-contrast because jsdom does not render colors. Browser contrast checks and spoken screen-reader verification are separate checks.

Use the built extension origin for live checks. Run axe through the Chrome debugger without adding executable assets or weakening CSP. Keep violations summarized by rule and selector. Audit Home, My music, Explore after scrolling, Radio, Current playlist, playlist dialogs and settings. Test ordinary and `prefers-contrast: more` modes separately, plus forced colors and reduced motion. Preserve the normal UI palette and compare mouse-state screenshots after any semantic button conversion. Native button borders, padding and background must be reset explicitly for plain title controls.

Keyboard checkpoints include skip links, tab arrows followed by Enter/Space, independent artist/track actions, seek Home/End/arrows, queue movement, pagination, dialog trapping and Escape restoration. Observe selected route, actual focus and paused playback independently. Track changes may announce politely. Clock ticks must not become live announcements. Repeated retained navigation trees must have unique IDs, inactive pages must be hidden/inert and selected tabs must reference existing panels.

The authenticated native comparison confirmed cover geometry for the existing one-, two-, three- and four-cover playlists. Live extension geometry measured 160-px covers with 80-px halves and column-first four-tile order. Home's successful cold opening made one catalog.getAudio request, with no legacy HTML request or premature catalog continuation. One sampled run delivered the response at 1,640 ms and inserted the first track rows at 1,744 ms. These timings establish request/render ordering and the request-count reduction. Network latency varies. Record repeated comparable runs before claiming startup-time improvements. A pointer-only response can still require getSection before useful content exists.

Chrome keyboard navigation moved focus from Explore to Radio with ArrowRight, then activated Radio with Space while playback stayed paused. Scrolling Explore appended seven group containers and exposed the friends section with zero page-width overflow at 780 px. Native frames and colors introduced during the first semantic-button pass were removed and the corrected mouse-state screenshot was checked. Firefox's authenticated extension page also loaded Home with Russian document language and zero-width native title borders. The actual Chrome action popup reported a 780×600 viewport, a main landmark, zero page-width overflow and transparent, borderless track-title buttons. Tab reached Support and Settings, Enter opened Settings with focus inside, and Escape returned focus to its visible Settings trigger. The settings semantic axe scan returned zero violations. Live audit coverage and any remaining speech/contrast limitations must be reported with the final change.

The normal VKUI palette has known secondary-text contrast failures, retained to preserve the requested appearance. The system high-contrast preference improves those tokens. Remaining verification includes personalized image backgrounds, browser/AT pairings and spoken output. Manual VoiceOver/NVDA validation remains required for comprehensive screen-reader acceptance.

The follow-up passed npm run check, 770 offline tests in 83 files, both extension builds, verify:build and the isolated Firefox 159.0 runtime smoke. The first sandboxed smoke MCP request timed out. Repeating the isolated run with the required process/network access passed.


## Dialog focus, theme polish and React tooling (November 9, 2026)

The pointer-close defect was reproduced in the previously published production frontend. After closing “Добавить в плейлист” and moving the pointer away, focus remained on the trigger with focus-visible=false and row hover=false, but actions stayed visible and the tooltip remained. The updated frontend preserves the restored focus while hiding that tooltip and returning the row duration. Fresh hover and deliberate keyboard focus can expose the actions again. Controlled save, close and Escape regressions use the real VKUI modal manager. The live check covered pointer-close without changing the VK library.

The official React package exposed 12 tools in the actual extension origin. A playlist-dialog pointer-close recording contained 40 commits, approximately 12.7 ms total React render time and a 2.4 ms largest commit. PlaylistList, List and Tooltip accounted for the largest reported work. The current MCP session predates the third-party flag, so this recording used the documented discovery event and returned tool executors. These instrumented totals describe this interaction, with automation idle gaps excluded from any latency interpretation. They do not establish a before/after speedup. Shared settings now enable automatic discovery for restarted clients. A fresh SDK client using those settings successfully listed list_3p_developer_tools and execute_3p_developer_tool with the required execution access. The sandboxed discovery attempts timed out before initialization. The profile output has its own directory, with a regression proving ordinary output and registration remain isolated.

Ordinary Chrome frontend index-CHAfMdJL.js was then restored and its absent profiling hook verified. At 780×600, transport hover used existing neutral icon tokens in both themes. Next matched Previous. Dark Previous/Next changed to rgb(225,227,230), and Play hover to rgb(118,120,122). Light Previous/Next used rgb(44,45,46), and Play hover rgb(153,162,173). Button backgrounds remained transparent. The native dark controls were neutral, while native light used its existing blue. The extension keeps the requested neutral palette.

Native radio uses a 28 px outlined plus, a transparent target and a 60-percent black card overlay. The updated extension uses that presentation and retains its single add action at the card center. Live light/dark checks measured a white 28 px SVG, transparent button and zero center displacement. Screenshots were inspected in both themes. Follow/unfollow request behavior retains controlled coverage, with no live radio mutation in this polish pass. Chrome's theme key was restored to its initial absent value, native VK to System, Firefox's viewport to 780×527 and Chrome emulation to default. Playback remained paused.

Final verification passed npm run check, all 775 offline tests across 84 files, both full extension builds, verify:build and the isolated Firefox 159.0 runtime smoke. The latest UI console contained only the existing external-manifest icons warning. Its service-worker warning/error console was empty. Spoken VoiceOver/NVDA, default-palette contrast acceptance, minimum browser versions and cross-window cache propagation retain their previously recorded limits.


## Additional performance and design audit (November 9, 2026)

The audit used the authenticated production extension tab at 780×600 with the same paused 278-track queue. Each route received a fresh UI document with HTTP cache retained and normal networking. CPU was slowed fourfold for the following single observations. A MutationObserver recorded the first non-hero music-control insertion. That DOM timestamp precedes paint and is a content-arrival proxy. It is separate from LCP and interaction readiness. Counts contain only aggregate data.

| Initial route | First paint, ms | First music control in DOM, ms | Longest task, ms | DOM elements | Fetch/XHR reads |
|---|---|---|---|---|---|
| Home | 88 | 2514 | 188 | 2880 | 1 |
| My music | 68 | 1370 | 154 | 2413 | 3 |
| Explore | 72 | 1552 | 319 | 4813 | 2 |
| Radio | 72 | 920 | 109 | 1594 | 1 |
| Current playlist | 120 | 1040 | 936 | 17073 | 0 |

All five observations had zero recorded layout shift and no document-width overflow. Home used one catalog.getAudio read. Its response took 1735 ms in this sample, so network time dominated content arrival. No hidden queue rows mounted on the other initial routes. These samples characterize current costs and support no speedup percentage.

### Remaining performance work

The initial queue remains the highest-priority rendering cost. A separate normal-production trace at 4× CPU reported LCP 2093 ms, CLS 0, approximately 17,067 DOM elements and 247 ms of forced layout. The queue contained 1359 action buttons. The Chrome DOM insight highlighted a 90 ms layout affecting approximately 20,305 layout nodes and 76–79 ms style recalculations.

In the separate instrumented React build at default CPU, first visiting Current playlist from loaded Home recorded five commits, 141.1 ms total render time and a 110.1 ms largest commit. That commit reported 33.6 ms layout-effect work. Clickable and Tooltip accounted for approximately 28.7 and 22.2 ms aggregated self time in its component report. Instrumented React durations and the production browser trace have different costs.

A prospective queue-rendering change must retain full queue identity, existing metadata paging, keyboard traversal, screen-reader discovery, editable drafts and pending mutation/focus lifetimes. Measure bounded rendering or scheduling with those scenarios before choosing the implementation.

After all five pages were loaded, one rapid five-tab cycle recorded 14 React commits, 11.0 ms total render time, a 2.9 ms largest commit and zero new fetch/XHR reads. Retained pages grew the document to 28,211 elements. This is a memory/layout tradeoff to measure over longer sessions. No heap-leak conclusion was drawn. Explore scrolling recorded 20 commits, 63.8 ms total render time and a 32.9 ms largest commit. Its production feed grew from 10 to 18 groups and from 2956 to 4717 px, including friends. No persistent duplicate continuation indicator or document overflow appeared.

### Design findings and corrections

The review inspected dark/light production views, scrolled library/Explore groups, long player metadata, hover controls and the current queue. Transport/mode glyph intervals measured [12,12,12,12] px, and player track-action intervals [12,12,12] px. Hovered rows remained 58 px high with 28×32 px action targets. Repeated synthetic long title/artist strings ellipsized at 780 px without overlap or document overflow. UI reload restored the real metadata.

The elapsed-time rule targeted an absent vkuiHeadline__host class, leaving the text at 15 px. CurrentTimeButton now supplies a local class for its 11 px text and 14 px line height. A controlled DOM/CSS regression fails with the previous selector. This corrects the earlier typography claim recorded under the November 8 glyph-spacing evidence.

An unavailable friend avatar left an empty circle after an ORB-blocked photo response. Friends and related artists now use Avatar.fallbackIcon with the standard 28 px user glyph inside the existing 48 px avatar. Controlled failure regressions preserve the named clickable cell. The Web Manifest warning was reproduced with a manifest request from the HTML link. Removing that link eliminated the request and warning on a normal UI reload. The HTML-entry regression fails against the preceding source.

The final normal frontend index-B8_4xDRd.js was restored to the stable stage. The real Chrome toolbar popup was identified through extension.getViews and measured 780×600 CSS pixels. Both dark and light checks reported 11 px time with a 14 px line height, zero document overflow and the neutral failed-avatar glyph. The UI tab and actual popup had no warning/error console entries, no rel=manifest link and no manifest network request after reload. A 1216×700 tab was also inspected.

Final checks passed npm run check, all 778 tests across 84 files, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke. The added entrypoint test and the rendered typography test distinguish their prior faulty sources. Default theme, Radio route and emulation were restored, the temporary popup closed and the original 278-track queue stayed paused. The remaining spoken-AT, default-palette contrast and browser-version acceptance limits still apply.


## Player slider presentation (November 9, 2026)

Native inspection found a thin progress track with no visible circular thumb and a time preview at the pointer position. The shared PlayerSlider wraps VKUI Slider and Tooltip for both progress and volume. Pointer previews stay local, use the input step, clamp to the bounds and format as m:ss or a percentage. Keyboard focus retains the real native range and outlines the whole track. Escape dismisses the hint while preserving focus.

[Controlled regressions](../../tests/front/player-slider.test.ts) cover both formats, bounds, read-only hover, Escape/re-entry, keyboard focus, transparent thumb styling, disabled/touch hover and seek commits. The actual CurrentTimeSlider sends one seek on pointer release and handles native keyboard changes through its existing command. The actual VolumeControl exposes a prospective percentage while retaining the stored level and current aria-valuetext. Existing mute/debounce and accessibility suites also passed during focused verification.

The production Chrome UI at 780×600 displayed 1:24 over the center of the 167.81-second timeline and 50% over the volume midpoint. Hover retained stored currentTime=2 and volume=0.5. Both themes had transparent, borderless, shadow-free thumbs with no outline. Progress and volume targets retained 12 px height and the volume rail retained 72 px width. Keyboard ArrowRight changed the displayed seek value to 3, Home reached 0 and End reached 167, with formatted hints and preserved range labels. Volume Home/End reached 0/100 and persisted the level. The original volume/remembered level of 0.5 was restored, and the retained 278-track queue stayed paused.

The real Chrome action popup retained 780×600 CSS pixels. Both hints stayed inside its viewport, with zero document overflow and zero visible circular thumbs. Its warning/error console was empty. An existing Firefox extension tab loaded the same final index-DhETkcln.js frontend and confirmed transparent thumbs, 362/72 px rails and a 50% midpoint preview while its actual volume input stayed at 100. Seeking was disabled there because no duration was loaded. Its live verification covers presentation and volume preview.

Final npm run check, all 784 tests across 85 files, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. Normal production assets were retained. Chrome's original time=2, volume=0.5, remembered volume=0.5, default theme and paused queue were restored, the temporary popup closed and emulation reset. The native Firefox viewport was restored after comparison.

## Deferred track actions and scroll (November 9, 2026)

This comparison used a separate headless Chrome MCP session rooted in the task worktree and a temporary unpacked extension stage. The browser profile had no VK login. A synthetic 278-track queue used empty media/image URLs, stable track IDs and a signed-out account. Front networking was offline and the isolated service worker's fetch adapter rejected requests, preserving the queue during session verification. These measurements isolate rendering cost. Authenticated Home/My music/Explore/Radio response latency and playback were outside this run.

Normal production documents used a 780×600 viewport, 4× CPU slowdown and retained HTTP cache. Each of three runs started with a fresh document on Current playlist and the same full queue. A MutationObserver recorded the first track's DOM insertion. This timestamp precedes paint. The initial production asset was index-DhETkcln.js. The final production asset index-CJNyQ4az.js used deferred action preparation and layout/style containment.

| Metric | Before, three samples | After, three samples |
|---|---|---|
| First track DOM insertion, ms | 995.5 / 887.7 / 886.3 | 532.5 / 543.3 / 548.2 |
| First contentful paint, ms | 1108 / 1028 / 1008 | 608 / 616 / 624 |
| Longest task, ms | 869 / 756 / 757 | 401 / 398 / 401 |
| Initial DOM elements | 14370 | 9278 |
| Loaded track rows | 278 | 278 |
| Initially prepared action buttons | 834 | 30 |

Median first-track insertion fell from 887.7 to 543.3 ms in this fixture. The action count reflects three eligible controls per signed-out synthetic track. Authenticated tracks can expose additional actions. Titles, artists and playback controls remain mounted across all loaded rows.

Rapid scrolling advanced through the entire queue in 30 requestAnimationFrame steps. Baseline maximum frame intervals were 23.4 / 20.4 / 23.0 ms, with total sampled intervals of 483.9 / 474.8 / 476.0 ms. Final cold-pass intervals were 21.1 / 31.3 / 18.6 ms, with totals of 473.6 / 497.9 / 482.7 ms. Every final pass retained all 278 rows, prepared only the nearby action subtrees and recorded zero intervals over 50 ms. These scripted frame samples describe this browser workload.

An intermediate implementation prepared every intersecting action subtree immediately. It improved opening but increased scrolling work. The final callback-only observer schedules preparation after 150 ms of continuous proximity and cancels rows that pass through quickly. Pointer entry/down and focus bypass that wait. The [nine controlled regressions](../../tests/front/deferred-track-actions.test.ts) cover viewport preparation, cancelled preparation, synchronous pointer/keyboard access, retained state/focus, eager editor/restore controls and observer/timer teardown.

Separate instrumented React recordings at default CPU measured the first visit from loaded Radio to Current playlist. The baseline recorded two commits, 128.6 ms total render time, a 101.0 ms largest commit and 31.0 ms layout effects in that commit. The final recording included deferred preparation and recorded eight commits, 47.9 ms total render time, a 41.7 ms largest commit and 19.3 ms layout effects in that commit. Clickable, host elements, TrackCell, Tappable and SvgIconRoot led the final aggregated self-time report. A final first-pass scroll recording, including the settled rows' deferred actions, contained six commits, 11.3 ms total render time and a 5.9 ms largest commit. React instrumentation and production browser timings have separate costs.

Separate normal-production traces with 4× CPU recorded LCP of 2352 ms before and 1352 ms after. Both recorded CLS 0.13 in this offline error-banner fixture. Trace-event totals for Layout fell from 88.0 to 59.2 ms and UpdateLayoutTree from 253.6 to 180.5 ms. Paint totals were 24.3 and 30.7 ms. These single traces supplement the repeated document/scroll samples.

An intermediate content-visibility experiment omitted distant playback buttons from Chrome's accessibility snapshot. Final CSS uses layout/style containment and preserves the complete loaded playback list in that snapshot. The smaller experimental opening times are excluded from the final table.

The actual action popup was identified through extension.getViews and retained 780×600 CSS pixels. Focusing the initially unprepared last row synchronously exposed its three eligible actions. Its height stayed 58 px. The final production accessibility snapshot exposed all 278 loaded playback buttons, including track 278 before scrolling to it. Contained scrolling reached scrollTop 15895. Entering the queue editor preserved all 278 rows and removed containment from every editable row. Cancel retained the stored 278-track queue, with zero document-width overflow. Normal production assets were restored after profiling. This is synthetic UI evidence. Authenticated dialog mutations, spoken assistive technology and personalized catalog startup retain their separate acceptance requirements.

Final npm run check, all 793 offline tests across 86 files with npm test -- --testTimeout=20000, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke passed. The final smoke used npm_config_offline=true to start its cached MCP package after an online MCP initialization timeout. Six Git-based release fixtures exceeded the default five-second limit in both full and isolated local runs. Their assertions passed with the 20-second verification override. The signed-out UI console contained the expected offline resource error.

## Home startup comparison with release 3.3.9 (November 9, 2026)

The comparison built the exact bf64ccb2c72919b8c98f6b4e7aa42d323442ab52 release in its own worktree and compared it with master at 667ae32 and the progressive Home change. Separate unpacked installations used the same authenticated Chrome 156 automation profile. Fresh Home documents used 780×600 CSS pixels, normal CPU/network and retained HTTP cache. A MutationObserver recorded first track insertion, which precedes paint. Only aggregate timing, geometry and component observations were retained.

| Build | First track insertion in three runs, ms | Median, ms |
|---|---|---|
| Release 3.3.9 at bf64ccb | 676.4 / 1024.1 / 992.0 | 992.0 |
| Master at 667ae32 | 1724.2 / 1566.5 / 1787.7 | 1724.2 |
| Progressive Home, index-Dme9OgPH.js | 630.2 / 657.8 / 604.9 | 630.2 |

The old release used the legacy section read immediately. Master waited for catalog.getAudio and started legacy data only after a token failure. In three separate concurrent read-only source probes, legacy response plus parsing took 669.7 / 559.6 / 570.9 ms, while token response plus parsing took 1050.7 / 1238.4 / 1020.1 ms. Every first legacy block matched the first token block and contained nine tracks in this account. The final implementation starts both sources together, so the early legacy read can render before token session verification/catalog latency finishes. Live service latency varies.

In the final three documents, legacy network reads began at 67.4 / 69.9 / 61.7 ms and completed at 595.7 / 622.6 / 569.9 ms. The richer token catalog completed at 1374.4 / 1362.3 / 1561.7 ms and its category tiles appeared at 1411.3 / 1398.6 / 1597.9 ms. The first track retained its DOM identity, document position and 58 px height through the later response in every final run. All 27 track rows were eventually present. The loader below the first block supports scrolling while the second source is pending.

Frame sampling reproduced the Mix Play flash in master. One button instance first appeared with black text on white, then animated to white on rgb(25,25,26) over approximately 150 ms. It generated 17–19 distinct sampled style states. The old release mounted its hero after the legacy response and first exposed the settled dark palette. The progressive build exposes the dark button at 73.8 / 75.5 / 68.1 ms with one sampled palette state and one button instance per opening. Application now resolves the system scheme synchronously before ConfigProvider mounts. Explicit preferences and later system changes have controlled coverage.

Comparable foreground React MCP recordings began on a fresh Radio document and recorded the first visit to Home through data arrival plus 2.5 seconds. Master recorded 23 commits, 55.0 ms total render time and a 19.3 ms largest commit. The progressive candidate recorded 38 commits, 65.3 ms total render time and an 18.4 ms largest commit. Largest-commit layout effects were 0.3 and 0.2 ms. Clickable, Tooltip, host image/button nodes and ImageBase led the final report. This splits useful work into an earlier first result and later enrichment, with additional total React work. A preliminary background-document recording was excluded because visibility affected image/intersection work. Instrumented and normal-production timings have separate costs.

Normal-production traces recorded LCP/CLS of 1113 ms/0.00 for 3.3.9, 187 ms/0.00 for master and 151 ms/0.00 for the progressive build. The current static Mix hero can become LCP before any music arrives, so these LCP values do not measure first usable catalog latency. A profiling-build trace was excluded from the production comparison.

[Nine source-order regressions](../../tests/front/home-progressive.test.ts) cover the fast block and loader, retained DOM/focus/layout, token-first order, failure/retry, inactive/fresh returns, account changes, empty responses and ID collisions across different block types. [Three first-commit appearance regressions](../../tests/front/application-theme.test.ts) cover system startup, system updates, cleanup and explicit preferences through the actual Application/ConfigProvider tree. Existing accessibility coverage now expects both initial Home sources and one token continuation owner.

The final real action popup independently measured 780×600 CSS pixels, first tracks at 598.4 ms and rich category tiles at 1334.1 ms. Scrolling its contained root to 600 immediately after the first rows appeared exposed the pending loader. After enrichment, scrollTop remained 600 and the first row retained its DOM identity and document position. The Mix button had one instance and one palette throughout. The popup had zero document-width overflow and its warning/error console was empty. Its normal production asset was verified and the profiling hook was absent.

The light-mode popup also exposed its final black-on-white button palette from the first sampled frame, with one button instance. Dark and light screenshots were inspected. Normal production assets were restored after profiling, appearance emulation was reset and the temporary 3.3.9 installation was removed after comparison.

Final verification passed npm run check, the standard npm test with all 805 tests across 88 files, full Chrome/Firefox builds, verify:build and the isolated Firefox 159.0 runtime smoke. The Firefox MCP package was started from its local cache with npm_config_offline=true. These live reads and UI observations cover this authenticated account and browser profile. Network latency, other personalized catalogs and spoken assistive-technology behavior require their own measurements.

### My music and Explore progressive startup (November 9, 2026)

Compared master d660288 after PR #51 with the progressive My music/Explore change in an authenticated dedicated Chrome 156.0.8078.74 automation profile. Used visible 780×600 extension documents, ordinary production assets, a fresh query client per reload, warm browser resources, CPU 1× and no network throttling. MutationObserver recorded first loaded playback rows and server-library tiles independently of skeletons. Three samples per condition follow, in milliseconds from document navigation.

| Arrival | Master samples | Progressive samples | Median before → after |
|---|---|---|---|
| My music first track | 1585, 1453, 1782 | 891, 954, 802 | 1585 → 891 |
| My music library tile | 1722, 1686, 1920 | 580, 617, 387 | 1722 → 580 |
| Explore first track | 1418, 1496, 1209 | 1183, 1184, 962 | 1418 → 1183 |

The original library read started at 1478–1791 ms, after catalog readiness. The final build started it at 258–365 ms alongside catalog.getAudio after shared session-token acquisition. The legacy section started at 58–79 ms and delivered its first useful rows before the token catalog, whose responses finished at 1154–1937 ms in the final My music samples. No additional initial source was introduced. Explore now exposes its fast titled track group while richer token groups load below it. Its untitled legacy promotional banner is kept out of the pinned position. Nonbreaking-space normalization removes the matching token track group.

Separate ordinary production traces reported My music LCP 1643 → 808 ms and rounded CLS 0.00 for both. Explore LCP was 1256 → 1484 ms with rounded CLS 0.00, so this run establishes earlier playable rows rather than an Explore LCP improvement. Upstream VK latency varies. These samples establish this profile's observed first-content timing and request dependencies.

Comparable React MCP recordings started from a fresh Radio document, profiled activation of the target tab through first tracks plus 2.5 seconds, and retained aggregate timing and component names only. My music recorded 108 → 31 commits, total render work 59.3 → 59.8 ms and largest commit 16.7 → 20.4 ms. Explore recorded 63 → 34 commits, total 47.8 → 67.4 ms and largest 24.2 → 21.5 ms. Largest-commit reports identified Clickable, Tooltip, ImageBase, RootComponent and image/SVG nodes. Earlier content overlaps background enrichment, so total render work did not decrease in these recordings. The production first-content samples above establish the latency change.

[Controlled startup regressions](../../tests/front/catalog-progressive.test.ts) exercise actual My music/Explore entrypoints with independently deferred sources. They cover concurrent catalog/library starts, library-first and token-first availability, stable controls/focus, exactly one library, partial failure and retry, inactive/fresh/invalidated returns, account retirement, nonbreaking-space deduplication and one token continuation owner. Replacing the feed with its master implementation makes the immediate-library-start regression fail before any response is resolved. The suite remains part of the normal npm test CI run. [Startup review](ui-debugging.md#startup-performance-review) records the required performance review and explicit approval for new blocking dependencies.

The actual 780×600 action popup was checked separately with a temporary frontend probe delaying catalog delivery by five seconds. Loaded library tiles appeared while the music skeleton and lower catalog spinner were still visible. An early scroll reached the unfinished region. After both catalog sources completed, the same library button retained focus, the library remained unique and all 27 music rows were present. The reserved leading group differed by 2 px from its populated height in this profile. A screenshot confirmed the early library and lower loader. The create-playlist dialog opened from the retained tile and closed with Escape. Popup warning/error console messages were empty. Ordinary production assets were restored after the probe.

The restored production UI also loaded 100 Radio stations, reused My music/Explore/Radio on quick returns with zero catalog/library reads, and scrolled Explore through one continuation from 54 to 72 track rows with the friends group present. A horizontal rail advanced 400 px and the document had no horizontal overflow. The isolated Firefox 159.0 runtime smoke passed startup, Audio snapshot, repeat modes and validated session replies. Authenticated Firefox UI latency was outside this comparison.

Final verification passed npm run check, all 819 tests across 89 files with npm test -- --maxWorkers=4, full Chrome/Firefox builds, verify:build and smoke:firefox. An initial unbounded-worker run hit existing five-second UI timeouts during concurrent browser profiling. The bounded run retained default test timeouts. The [startup approval requirement](../../AGENTS.md#startup-performance) applies to future changes across all tabs.


## Selectable metadata and large queues (November 10, 2026)

[Selection regressions](../../tests/front/text-selection.test.ts) cover artist search, structured main/featured artists, the real Player, track-title/row clicks, unrelated selections and keyboard activation. All four tests fail against the previous click handlers. Artist/button selectors explicitly override VKUI's button.vkuiClickable__realClickable selection rule. Chrome computed styles and native pointer drags confirmed selection in the player and both artist formats in rows, with no navigation or playback commands.

[Queue regressions](../../tests/front/queue-editor.test.ts) cover cooperative row creation, preserved row DOM/input/focus, pause on inactive pages, cleanup, timer fallback, queue-scope replacement and metadata-pagination gating. The first 12 rows mount immediately; eight more are scheduled per idle callback. Existing rows stay mounted. Source queue IDs, metadata and save/playback snapshots are unchanged. Ordinary TrackCell uses content-visibility: auto with an intrinsic block size of 58 px; editable cells opt out. Chrome focused the last of 300 offscreen rows and scrolled it into view. Both metadata buttons and title buttons computed user-select: text, with zero document overflow.

The browser checks used a separate headless Chrome profile at 780x600 and the actual extension origin. A temporary bootstrap supplied synthetic track data and validated-shaped session replies and intercepted all runtime commands/network reads. These are frontend checks, without VK authentication, real playback or library mutations. Normal production traces and instrumented React recordings are separate measurements. CPU throttling emulates less available processing time; it does not reproduce a particular low-end CPU, GPU or memory capacity.

Three production reloads with 300 tracks and 4x CPU showed median combined style/layout work of 395.5 ms before containment and 60.3 ms afterward. This isolates the CSS change; it predates cooperative queue rendering. Queue size, viewport, retained HTTP cache and offline bootstrap were held constant.

A separate 1000-track, 10x CPU stress run exposed the initial whole-queue mount. The following are single lab observations, not FPS or field-user measurements:

| Production configuration | LCP, ms | Largest main-thread task, ms |
|---|---:|---:|
| Whole queue, containment disabled | 21363 | 17334 |
| Whole queue, containment enabled | 17473 | 14726 |
| Cooperative queue, containment enabled | 3451 | 2130 |

The last row's largest task is initial application work. Later row-creation tasks were mostly much smaller, with the largest remaining listed tasks at 733 and 145 ms. Completing every row took approximately 83 seconds in this deliberately severe throttled run. Cooperative scheduling prioritizes useful initial content and input opportunities; it can increase total completion time and repeated layout work. It does not bound final DOM size or memory. Page search and discovery of the final rows require those rows to have been created.

At default CPU, comparable React recordings mounted the same 1000 synthetic tracks from an empty queue. The original build recorded two commits, 443.7 ms total render time and a 320.3 ms largest commit. The cooperative build recorded 250 commits, 475.6 ms total and a 5.7 ms largest commit. Component reports include CurrentPlaylist, Tooltip and Clickable. Reused fiber timings must not be summed as fresh work for every component in a batch. This is a reduction in individual render blocks, not total React work. Separate five-step playback/time updates on the 300-track intermediate build recorded ten commits, 10.8 ms total and a 3.3 ms largest render.

The final ordinary frontend was restored and its profiling registration was absent. With all 1000 rows mounted and CPU slowed 10x, twenty synthetic active-track/time storage updates took 68.4 ms median and 139.2 ms maximum from dispatch through two animation frames. This includes storage delivery and frame waiting; it is not a playback-start or input-latency measure. Focusing Track 1000 scrolled its existing control into view. The actual toolbar popup reported 780x600, 1000 rows, user-select: text and no document-width overflow. A final screenshot of the production tab was inspected, and its warning/error console was empty before the intentional offline artist-search check. An ordinary artist click updated the search route.

Final npm run check, all 790 tests across 86 files, both full extension builds and verify:build passed. Authenticated playback, Firefox pointer selection, spoken assistive technology, minimum-browser versions, sustained memory use and the reporting user's exact hardware/session remain outside this evidence.

## Interaction performance audit (November 10, 2026)

The follow-up used authenticated Chrome 156.0.8078.74, the real extension frontend, service worker and Audio document at 780x600. CPU throttling was 10x on the inspected frontend page, with ordinary networking. This throttles frontend execution on the host computer. It does not reproduce a specific CPU, GPU, memory capacity or background-worker speed. Traces containing account data remain temporary, and only aggregate timings are recorded here.

The audit exercised first and repeated navigation through Home, My music, Explore and Radio, ordinary-track and radio playback, play/pause, next/previous, settings sections, the playlist picker, lyrics, Mix settings, search and Explore scrolling. Ordinary music reached played=true with advancing time and no playbackError. Radio playback and previous also reached played=true. One next-station observation was still loading after one second. The common Mix command exhausted its preparation budget with the existing unavailable diagnostic on its first attempt. A later attempt was cancelled after eight seconds. Its playing animation therefore has no authenticated runtime result from this audit.

Visiting Radio exposed a playback subscription defect. All 100 station cards subscribed to the complete active track and played state, so later player controls rerendered the entire hidden station grid. In an instrumented transport sequence, RadioStations contributed 119 ms to a 205 ms React commit at 10x CPU. Playlist and Mix controls also rerendered for unrelated playback changes. Station cards now use per-track snapshots, and collection controls use identity-scoped primitive snapshots. Radio creation is cooperative and its images use native lazy loading.

[Render-isolation regressions](../../tests/front/render-isolation.test.ts) assert unrelated-station/collection isolation, affected stations, requested Mix selection, entity identity, metadata paging and legacy played fallback. The station regression fails against the previous grid implementation. Existing radio-following, selection, accessibility and command suites remain part of validation.

For the same play/pause/play/next/previous sequence after all four main pages were visited, the React recordings changed from 21 commits, 1018.5 ms total and a 204.8 ms largest commit to 22 commits, 282.5 ms total and a 56.6 ms largest commit. The updated largest commit contained no radio station work. Both recordings used the same nine-track ordinary queue and a 100-station catalog. These are instrumented observations.

Separate normal-production observations used the same controls, a verified paused starting state, one-second gaps and two animation frames after each click. The original play/pause/play/next/previous UI samples were 102, 275, 90, 18 and 17 ms. Updated samples were 30, 96, 32, 18 and 17 ms. They measure frontend response through frame callbacks, with storage/network timing contributing to variation. They do not measure audible start latency. These are single sequences, without a field-user FPS claim.

A separate first Radio visit from a fresh Home UI produced the first station DOM at 731 ms and all 100 cards at 912 ms, with a 268 ms largest observed task. The cooperative version produced its first cards at 489 ms and all cards at 1009 ms, with a 69 ms largest task. Both had retained browser HTTP cache and normal networking. First DOM insertion precedes paint. All 100 images were already cached and completed in both samples, so these observations establish no image-transfer saving.

Remaining measured costs include first page creation and data arrival. The initial navigation pass produced UI frame samples of approximately 0.5–1.5 seconds, with overlapping catalog requests. Repeated loaded tabs produced samples of approximately 150–330 ms. Search with 37 visible rows had a 329 ms largest React render and 52.5 ms largest layout-effect duration. These costs remain candidates for further scheduling work.

The playlist picker, lyrics and Mix-settings open/close sequence recorded 74 commits, 277 ms total React rendering, a 32.2 ms largest render and 15 ms largest layout-effect duration. Settings-section samples were 63–113 ms through frame callbacks. A diagnostic 60-frame stream of synthetic pointer moves over the timeline in normal production had 22.6 ms median, 29 ms 95th percentile and 39.8 ms maximum frame intervals. The same diagnostic under active React profiling was much slower because the profiler processes the retained tree on commits. Profiling frame rates must be checked separately in ordinary production.

The final ordinary frontend was restored, its asset identity checked and the profiling hook absent. Playback was left paused and CPU/viewport emulation reset. Final npm run check, all 792 tests across 86 files, both extension builds and verify:build passed. Native weak hardware, authenticated playing Mix animation and Firefox interaction timing remain outside this audit.

## Navigation, search and Mix follow-up (November 10, 2026)

This follow-up used the same authenticated Chrome extension at 780x600, normal networking and 10x frontend CPU slowdown. Home, My music, Explore and Radio were loaded before warm interactions, with playback paused. The search query returned 37 track rows. The starting frontend already included the station/collection playback isolation described above. Raw authenticated traces remain temporary.

Retained navigation and search inputs now pause their route/value/focus subscriptions while inactive. Navigation is memoized. Search mounts its first result group immediately and schedules one further group per idle callback, reserving space with static themed placeholders. [Page activity regressions](../../tests/front/page-activity.test.ts) cover reactivation and hidden input focus. [Search rendering regressions](../../tests/front/search-rendering.test.ts) cover incremental groups, preserved controls/focus, replaced queries and failed results.

Comparable instrumented React recordings produced the following observations. Render time includes scheduled work across the full interaction.

| Interaction | Before commits | After commits | Before total render, ms | After total render, ms | Before largest render, ms | After largest render, ms |
|---|---:|---:|---:|---:|---:|---:|
| Loaded tab cycle | 14 | 15 | 184.6 | 145.0 | 39.7 | 31.8 |
| Search, 37 rows | 17 | 18 | 335.3 | 502.9 | 187.6 | 145.1 |

The largest search layout-effect duration changed from 33.7 to 17.1 ms. Search scheduling trades additional total rendering work for shorter individual renders.

Separate ordinary-production traces compared index-BCGQwFpL.js with final index-DCqRw2D7.js. Each fresh document loaded all four pages, primed the search cache, then measured two four-tab cycles and three cached search returns. Search samples included the existing 600 ms input debounce and waited for all 37 rows, all groups and two animation frames. Before samples were 1387, 1543 and 1354 ms. After samples were 1783, 1896 and 1748 ms. The corresponding largest renderer-main-thread tasks were 632, 827 and 645 ms before, and 339, 345 and 352 ms after. Median complete-search time increased from 1387 to 1783 ms while the median largest task decreased from 645 to 345 ms. This establishes shorter blocking intervals for the measured search scenario, with slower full completion.

Ordinary-production tab samples ranged from 128 to 346 ms before and 116 to 394 ms after. Renderer main-thread task totals across the eight transitions were approximately 3384 and 3674 ms. These observations establish no production tab-speedup claim, despite the reduction in measured React work. Retained catalog content and browser layout remain substantial costs. These timings include automation and frame waiting, and do not measure audible start latency or field-user FPS.

The Mix preparation failure came from successful audio.getStreamMixAudios records omitting main_artists. A read-only response contained two such tracks. The converter now accepts an absent/null structured artist list while retaining the plain artist label. [Converter regressions](../../packages/common/src/converter.test.ts) cover both forms. Authenticated playback after the fix reached played=true with an empty mainArtists list. The final frontend also played a later Mix track with advancing time and no playbackError.

Native VK uses an rlottie Canvas animation with four layers, a two-second loop and a declared 60 fps. The extension artwork now uses four static radial-gradient layers animated with CSS transforms. Its geometry/palette follow the previous artwork with a softer presentation. [Animation regressions](../../tests/front/mix-animation.test.ts) verify the four layers, absence of a JavaScript frame loop and pause behavior for playback, page activity, viewport intersection and document visibility. Live checks confirmed advancing animation timelines, scroll-out pause/resume and paused styles with zero running artwork animations under reduced-motion emulation. Refined dark/light screenshots were inspected with no horizontal overflow.

In ordinary-production playing-Mix traces, the old extension renderer recorded 2505 FireAnimationFrame callbacks over approximately 21.6 seconds. The updated renderer recorded zero over five seconds, including a run with all four pages retained. Trace metadata identified the extension renderer separately from native VK. Unequal durations and retained data prevent a total-CPU speedup ratio from these samples. CSS animation removes the artwork's JavaScript drawing loop while compositor/GPU work remains.

Final npm run check, all 798 tests across 89 files, full Chrome/Firefox builds and verify:build passed. The final production asset and absent profiling hook were verified, temporary runtime diagnostics were restored, and the UI warning/error console was empty. Playback was left paused, the original absent theme setting retained and emulation reset. Physical low-end hardware, sustained memory/GPU measurements and Firefox interaction timing remain outside this follow-up.

### Mix motion correction

User feedback identified visible stops in the new artwork. The original CSS applied ease-in-out separately across four keyframe segments. It reached zero velocity at both extremes and at both center crossings. The center pauses were introduced by this CSS rewrite. The corrected curve interpolates only between the two extremes using cubic-bezier(0.37, 0, 0.63, 1), with the previous per-layer periods and a negative three-quarter-period delay to start at the center. The center crossings now retain movement through each half-cycle.

Chrome computed-transform checks sampled the same first layer around its center crossing. The old curve moved approximately 0.154 px over 52.4 ms centered on that crossing. The corrected curve moved approximately 3.172 px over the same interval. Boundary samples confirmed continuous position and smooth reversal at each extreme. During actual Mix playback at 10x frontend CPU slowdown, five seconds of animation-timeline sampling showed advancing playback, four running layers and no repeated currentTime values in consecutive samples. These checks establish the corrected motion curve. They do not measure compositor frame delivery on physical low-end hardware.

A search experiment increased the appended batch from one group to two. Comparable React recordings reduced commits from 17 to 10 and total render time from approximately 335 to 295 ms, while the largest render increased from 88 to 142 ms. In separate normal-production traces, three complete-search samples were 1692, 1603 and 1699 ms before, and 1715, 1768 and 1590 ms in the experiment. Median largest tasks increased from 330 to 347 ms. The experiment therefore supplied no observed production improvement and was reverted. Search retains one group per idle callback and the previously documented full-completion tradeoff.

The full check, 798 tests, both builds and build verification passed during this correction. After reverting the search experiment, the ordinary frontend was rebuilt for both browsers and verified again. Final Chrome loaded index-Cqi6TIoh.js with the corrected curve, four paused layers and no profiling hook. Playback was left paused and emulation reset.

### PR integration with current master

The branch was rebased onto caaa5a2 before opening its PR. The current master already defers track actions and uses layout/style containment to keep loaded playback controls discoverable. Integration retains that rendering approach together with selection-safe metadata and cooperative queue creation. The content-visibility measurements above describe the earlier experimental base. Historical performance numbers precede this integration and are scoped to their recorded builds.

## Three-version comparison and corrections (November 10, 2026)

The comparison used current master caaa5a2, the task before integration at 3665694 (based on d2eaeaa), and the integrated task at d167395. Both baseline source trees were reconstructed from their exact Git revisions. Their declared frontend runtime versions match the installed runtime dependencies. The archived trees reused installed build/test tooling, including current development dependencies. Source trees, normal frontend assets and profiling assets were kept separate. The remote target was fetched again and remained caaa5a2 before final validation.

Current master already contains deferred track actions, layout/style containment and progressive Home/My music/Explore data arrival. Integration preserves those implementations. Earlier queue containment results and older large speedup claims apply to their recorded historical base. The following comparison measures the actual current target and the two task snapshots.

### Controlled production frontend

One isolated extension origin supplied identical synthetic storage, validated-shaped session replies and deterministic legacy/token responses. Playback commands were captured and reflected by a controlled storage adapter. The extension had storage permission and no production background worker. This isolates frontend work. Separate full production extensions provided the authenticated runtime checks below. Controlled fixtures used 300 or 1000 queue tracks, 100 radio stations and a five-group search with 37 track rows and 16 album tiles. Unexpected fixture requests were eliminated before accepted measurements. Builds and tests finished before CPU sampling.

The 300-row queue observations are medians of three fresh documents at 780x600, CPU slowdown 4x, retained HTTP cache and a paused player. Timestamps describe DOM insertion relative to application import. They precede paint. The final candidate uses an immediate 12-row prefix and one background transition for all remaining loaded rows.

| 300-track queue | Current master | Task before integration | Integrated task before correction | Final candidate |
|---|---:|---:|---:|---:|
| First rows, ms | 877 | 324 | 312 | 188 |
| All rows, ms | 877 | 4213 | 2692 | 756 |
| Largest observed task, ms | 845 | 270 | 243 | 130 |
| Prepared action buttons | 59 | 1499 | 59 | 59 |

A 1000-row stress observation at 10x CPU produced the following results. The first three columns each contain one stress run. The final column is the median of three runs, whose complete-list samples were 6315, 4041 and 4481 ms. These samples establish the responsiveness/completion tradeoff within this lab setup.

| 1000-track queue | Current master | Task before integration | Integrated task before correction | Final candidate |
|---|---:|---:|---:|---:|
| First rows, ms | 3901 | 545 | 448 | 472 |
| All rows, ms | 3901 | 35712 | 19835 | 4481 |
| Largest observed task, ms | 3805 | 459 | 356 | 518 |
| Prepared action buttons | 59 | 4999 | 59 | 59 |

The integrated eight-row batches delayed the complete 1000-row list to almost 20 seconds. A 64-row experiment reduced the median to approximately 9 seconds. A single deferred React transition avoided repeated list commits and reduced it to approximately 4.5 seconds while preserving much shorter blocking intervals. Total completion remains later than master's single stress sample. The final first/all/largest 300-row samples were (205,805,143), (188,756,130) and (145,643,110) ms. The 1000-row samples were (472,6315,664), (444,4041,518) and (474,4481,440) ms. All 1000 final rows were present in the accessibility snapshot, including the last playback button.

Separate instrumented React recordings replaced a one-track queue with 300 tracks at default CPU. Master recorded 8 commits, 64.9 ms total render time and a 57.1 ms largest render. The old task recorded 74 commits, 156.8 ms total and an 8.6 ms largest render. The final candidate recorded 8 commits, 64.7 ms total and a 53.0 ms largest render. These are render durations across a commit. Interruptible transition rendering spans multiple tasks, so the largest React render is distinct from the largest continuous production task.

The same controlled frontend sequence visited Home, My music, Explore and Radio before cached search returns and player actions. At 10x CPU, complete-search samples were 995/1027/965 ms for master, 1661/1556/1764 ms for the old task and 1119/1112/1204 ms for the integrated task. Their median largest search tasks were 319, 73 and 150 ms. A subsequent authenticated comparison confirmed the completion regression, and incremental search groups were removed from the final source.

For play/pause/play/next/previous, the controlled UI response samples through storage delivery and two frame callbacks were 287/169/180/337/228 ms for master, 93/85/85/118/151 ms for the old task and 81/72/120/156/132 ms for the integrated task. The station count was 100 in each case. These are individual frontend observations with a controlled transport. Audible start latency requires the actual media checks below.

### Matched animation traces

Normal-production traces used 10x frontend CPU, the same 54 catalog tracks and 100 stations retained across four pages, a playing-Mix snapshot and one current-time storage update per second. The comparison interval was bounded by explicit marks for five seconds. Renderer attribution used the tested extension frame and CrRendererMain.

| Approximately five seconds | Current master | Task before integration | Integrated task |
|---|---:|---:|---:|
| Renderer main-thread RunTask time, ms | 613.8 | 191.6 | 193.2 |
| FireAnimationFrame callbacks | 598 | 0 | 0 |
| Time inside animation callbacks, ms | 134.6 | 0 | 0 |

Main-thread busy time fell by approximately 69 percent in this controlled scenario. This ratio describes the measured renderer work and conditions. Compositor/GPU cost and operating-system CPU usage need separate measurements. The final queue/search corrections leave the Home artwork implementation intact.

### Authenticated production extensions

Three independent unpacked extensions ran their full original manifests, service workers, Audio documents and normal frontends in the same authenticated Chrome profile. All opened Home with 27 track rows and no error view. Each selected an enabled My music track after the data arrived, loaded an 18-track queue, played with advancing time, selected Next, returned to the original track with Previous and paused without playbackError.

The common Mix failed preparation on current master during this run. Both task versions played a Mix track with an empty structured artist list, advancing time and no playbackError. The controlled converter probe independently rejected that valid-shaped missing-main_artists response on master and accepted it on both task versions. This distinguishes the parser fix from random live source availability.

Search used the same Daft Punk query, 37 rows, 100 retained stations, a primed per-document cache and 10x frontend CPU. Timing included the 600 ms debounce and two frame callbacks after complete results. Initial master samples were 909/862/848 ms. The old task returned 1187/1241/1128 ms and the integrated task returned 1659/1250/1280 ms. Removing incremental group mounting produced 1018/931/888 ms. A further paired verification returned 952/881/902 ms on master and 897/909/990 ms on the final candidate. Their medians were 902 and 909 ms, with median largest tasks of 240 and 244 ms. The final search therefore restores comparable completion and blocking to current master. It establishes no additional full-search speedup.

A discarded setup probe checked row count before the debounced route change and produced invalid zero-row timing. The corrected probe waits for the visible search route, the expected result count and completion of all loading placeholders. Another setup probe clicked My music before its response arrived. Waiting for an enabled track before activation confirmed working playback in all three versions. These setup failures were excluded from accepted timing and behavior results.

Browser range/click checks and computed styles covered the row artist, row title and player artist on all three source snapshots. Master used user-select none and invoked navigation/playback with a selection. Both task snapshots used user-select text and suppressed those actions while preserving keyboard activation. Focused row DOM and prepared actions remained mounted. Controlled suites also cover structured/featured artists, queue editing/cancellation, account/query replacement, modal behavior and paging.

The archived master suite passed 819 tests, the old task passed 798, and the integrated suite passed 833. Initial simultaneous baseline test warmups caused five-second timeouts and secondary assertions. Serial runs with four workers passed both archived suites. This was test-host contention, with no baseline source edits. Separate ordinary queue traces were saved for current master and the final candidate. Trace instrumentation increased complete-list times to approximately 6.4 and 7.2 seconds, respectively. Raw authenticated traces remain temporary. Their costs are separate from the uninstrumented samples above.

Final validation passed npm run check, all 833 tests across 93 files, both complete extension builds and verify:build. The final authenticated frontend loaded index-hmiGqcyy.js with no profiling hook or warning/error console entries. Its light-theme screenshot was inspected. A final full-runtime play/pause/next/previous check passed again. The actual Chrome toolbar popup measured 780x600, exposed selectable row text, loaded the same normal asset and had no horizontal overflow. The temporary popup was closed, playback paused and emulation reset. Physical low-end hardware, long-session heap/GPU measurements, spoken assistive technology and authenticated Firefox interaction timing remain outside this comparison.
