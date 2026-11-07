# State, commands and playback outcomes

This map describes current code. Complete types/messages live in [common/types.ts](../../packages/common/src/types.ts); defaults live in [initial-state.ts](../../packages/common/src/initial-state.ts). Concurrent playback rules belong to [the ADR](../decisions/0001-playback-operations.md). General runtime message validation, a storage schema version and a unified command request/response protocol are not implemented yet. Startup snapshots and [session requests](../decisions/0009-session-owner.md) validate their own boundaries.

## Storage and responsibility

chrome.storage.local uses flat keys. Common's ApplicationControls, ApplicationSettings, ApplicationActiveTrack, PlaylistSystem and User group defaults for types/initialization; no keys with those names are created. Missing fields are legitimate: consumers supply defaults without necessarily writing them to storage.

| Fields/data | Storage and current responsibility |
|---|---|
| activeTrack, currentPlaylist, activeTrackIndex, audiosIds, originalAudiosIds | Chrome storage. SW actions choose tracks and transform queues; UI observes snapshots and sends intents. |
| played, playbackId, playbackError | Chrome storage. SW publishes playback state after operation/event ownership checks. UI must not use a played write as a command. |
| playbackRequested | Chrome storage snapshot of SW-owned intent. Updated before media confirmation; header/album/Mix actions can show pause while loading. Writing it is not a command. |
| playbackInitialization | SW startup status: loading, ready or failed. Default loading is not evidence of a running worker. Startup publishes a safe playbackError on failure; blocked commands do not run against defaults. |
| currentTime, duration | Chrome storage. SW publishes media time/duration; UI seeking uses an explicit command. |
| volume, shuffle, durationMode, castToStatus | Chrome storage. UI/hotkeys change controls; SW [storage listeners](../../packages/service-worker/src/listeners/storage.ts) trigger side effects. This historical mixed model is not a pattern for new playback commands. |
| repeat | Chrome storage. An SW action cycles modes on REPEAT; playback reads the mode at track end. |
| equalizer | Chrome storage. Settings UI writes enabled/ten gains/manual Preamp/boost compensation, named userPresets/presetId and optional Mix refusal state. SW forwards DSP configuration and its current optional host-permission check (equalizerMixAccess) to the offscreen Audio owner through CHANGE_EQUALIZER and each PLAY_TRACK. Missing/failed permission checks prevent okcdn.ru processing downloads while preserving native playback. RETRY_EQUALIZER explicitly forwards retry=true with current configuration after a permission grant without changing playback ownership or the queue. Default disabled/neutral; the whole key survives UPDATE/account switching. [ADR 0010](../decisions/0010-equalizer.md) defines validation and media constraints. |
| equalizerAnnouncementPending | Chrome storage, preserved as an application setting. UPDATE crossing 3.3.10 from below marks it; navigation consumes it on first presentation. Later updates preserve an unseen announcement and do not recreate a consumed one. No announcement on fresh install. |
| equalizerStatus | Transient Chrome storage. Audio document reports off/waiting/loading/active/unavailable with playbackId; SW persists matching-source reports and UI observes. Removed with runtime data, republished by a new audio document. |
| likeVersion, settingsVersion | Chrome storage. Navigation UI records acknowledgement of informational windows/badges. |
| UI theme | localStorage.theme and [themeAtom](../../packages/front/src/entities/modal/model/atom.ts). A theme field in common defaults/the preservation list does not mean the UI reads it from Chrome storage. |
| activeTab | Chrome storage. [active-tab-atom](../../packages/front/src/shared/model/active-tab-atom.ts) owns the selected page and parameters. |
| userId, webToken, deviceId, sessionEpoch | Chrome storage. [The background session owner](../../packages/service-worker/src/session.ts) coordinates verification, shared refresh and serialized writes/cleanup. UI observes userId and calls the common session client; it does not write credentials. sessionEpoch changes on account transition/logout and defaults to legacy for existing data; [ADR 0009](../decisions/0009-session-owner.md) defines identity and limits. |
| Query cache / temporary modals | Open UI memory: a QueryClient per stored userId (retired on account change) and a modal atom. Not playback's source of truth. |
| AbortController, budget, pending selection, revision | SW memory in [playback-operation](../../packages/service-worker/src/playback-operation.ts). Lost on worker restart. |
| Audio, HLS, active media playbackId | Offscreen/background-page memory. Actual media can survive Chrome SW termination. |

hlsDebug is an existing internal Chrome storage flag, not a complete safe diagnostics facility. TrackItem, Playlist and AudioTuple may contain access/action hashes and signed URLs. Do not dump them into logs, reports or fixtures.

UI atoms are defined in [shared/lib/atom.ts](../../packages/front/src/shared/lib/atom.ts): atom uses memory, lsAtom stores a localStorage string, storageAtom asynchronously loads initial data and subscribes to Chrome storage events. lsAtom does not currently subscribe to events from other windows; do not assume live theme synchronization between UI windows.

Frontend cache identity and page application follow [ADR 0007](../decisions/0007-query-identity-and-pagination.md): per-account client retirement, owner/context-aware page keys, original pagination variables, cursor guards and immutable ID merges. This boundary does not version shared token storage or cancel external mutations.

## Command lifecycle

For a new track:

1. Front sends ACTIVE_TRACK with target SERVICE_WORKER using [send-message](../../packages/front/src/shared/lib/send-message.ts).
2. [The SW router](../../packages/service-worker/src/listeners/messages.ts) calls playNewTrack. The operation cancels prior loading, resolves data and prepares the current playback snapshot.
3. [sendOffscreenMessage](../../packages/service-worker/src/offscreen/send-message.ts) prepares Chrome offscreen and rechecks ownership before sending PLAY_TRACK with playbackId. Firefox uses the CustomEvent bridge.
4. [The offscreen router](../../packages/offscreen/src/listeners/messages.ts) creates a new media source. [Player events](../../packages/offscreen/src/listeners/player-events.ts) send AUDIO_PLAYER_PLAYING, PAUSE, ENDED, ERROR and TIMEUPDATED with its playbackId.
5. SW rejects obsolete IDs and publishes current fields. Storage events update UI atoms, independently of the originating button's lifetime.

Front toggle controls send TOGGLE_PLAYBACK to SW, and the keyboard shortcut calls the same action. SW flips its synchronous requested intent before any await; commands from different controls therefore share one ordering even when storage/media events lag. PLAY_OR_PAUSE with a boolean remains the explicit set command to SW and the media command from SW to offscreen. New UI flows should not bypass SW ownership/cancellation by controlling offscreen directly.

Front placement follows the existing next/previous pattern: feature event handlers call shared/lib/send-message.ts with their command payload. entities/active-track/model/atom.ts observes played; it does not export a command disguised as setPlayed. The track-row playOrPause helper stays inside its existing feature because it selects between a playback command and ACTIVE_TRACK. Small payload repetition does not require a new shared domain controller or a same-layer feature cross-import.

playbackRequested and played have distinct roles: requested intent controls the header/album/Mix action icon; played drives actual-playing indicators and time display. The UI does not calculate the next intent from either snapshot. Its request observer falls back to played when the new key is absent in legacy storage. Selection commands still choose a track/playlist; clicking another uncommitted selection is not a toggle.

Pause cancels pending resolution/retry and invalidates older media events. A subsequent play resumes an already launched source at its current position, or restarts the pending selection if dispatch never completed. Terminal failure clears both requested and played state. Intent revisions also guard pause/resume commands sharing the same operation identity: a late storage write/event cannot decide the next toggle. SW pause still publishes played=false before sending the media command, so played is not a strict acknowledgement of every physical media transition.

| Direction | Current protocol examples |
|---|---|
| Front -> SW | ACTIVE_TRACK, TOGGLE_PLAYBACK, PLAY_OR_PAUSE, NEXT_TRACK, PREVIOUS_TRACK, CURRENT_TIME, REPEAT, ADD_TO_QUEUE, EDIT_CURRENT_PLAYLIST, APPEND_CURRENT_PLAYLIST |
| UI token/session client -> background owner | SESSION_REQUEST / SESSION_CANCEL, correlated validated replies and per-caller cancellation. Background callers use the same owner locally. |
| SW -> offscreen | GET_PLAYER_SNAPSHOT, PLAY_TRACK, PLAY_OR_PAUSE, CHANGE_VOLUME, CHANGE_CURRENT_TIME, CHANGE_EQUALIZER |
| Offscreen -> SW | PLAYER_SNAPSHOT, AUDIO_PLAYER_*, EQUALIZER_STATUS and CLOSE_OFFSCREEN_DOCUMENT |
| SW/session/UI -> observing UI | Individual Chrome storage changes; not another playback command channel |

The front wrapper does not await action completion. SW listeners schedule actions through shared readiness, catching failures with a generic warning; this is not a command response/acknowledgement contract. Successful sendMessage delivery/Promise completion does not prove playback started. Tests should await an observable transition instead of an arbitrary delay. Useful playback evidence is the expected selection, played=true, increasing currentTime and no playbackError; pause requires played=false and a stable position.

An exhaustive TypeScript switch checks the project's union at build time. It does not validate unknown runtime input or define sender policy. A new response, timeout or requestId contract must update both transports and event lifetime handling; T12 is not already complete.

Library deletion calls VK independently of DELETE_TRACK (local queue removal). The frontend restore-window registry retains pending IDs only in UI memory, drains once on navigation and defers cleanup while restoration runs. Popup closure leaves the queue unchanged. [ADR 0006](../decisions/0006-library-delete-restore.md) defines the accepted lifetime and limits; it is not persistent undo or a queue-result acknowledgement.

## Restart, update and defaults

Chrome registers command, message, storage and install listeners synchronously in [index.ts](../../packages/service-worker/src/index.ts). [Readiness](../../packages/service-worker/src/readiness.ts) queues execution until shared initialization completes; it starts queued actions in arrival order without waiting for the previous playback operation to finish. This preserves cancellation while preventing a pre-load hotkey from reading an empty default queue. Failed initialization drops queued/later actions for that worker instance; reloading the extension retries initialization.

[loadState](../../packages/service-worker/src/state.ts) subscribes before reading storage and merges intervening changes/removals over that snapshot. It does not reset playback. [Initialization](../../packages/service-worker/src/initialize.ts) then requests a snapshot only from existing offscreen media (Firefox uses its existing background document). A random requestId correlates GET_PLAYER_SNAPSHOT/PLAYER_SNAPSHOT; the exchange has a 2-second timeout, payload validation and temporary-listener cleanup in both transports. Media sends use the same exchange as a readiness probe, retrying every 50 ms within that deadline and stopping when command ownership is lost. Probes do not count as media activity. No signed URL, track metadata, token or queue crosses this diagnostic exchange.

Matching playbackId plus stored track/playlist ownership restores the live source and its position without play() or a new source load. Native playing state decides played; the surviving source owner's in-memory request decides playbackRequested, including pending HLS attachment before src exists; persisted intent alone never starts music. Missing offscreen/source clears stale playbackId and both flags but retains the queue for explicit play. Mismatched, ended or failed media is paused and its identity cleared with a safe retry message; it is not adopted as the stored track. Unreachable existing offscreen or failed storage puts initialization in failed state and publishes a safe error if storage remains writable.

Media events received before the snapshot reply are superseded by the snapshot. Events received after that reply wait behind the final initialization commit, so a newer time/pause/ended event is not overwritten by the startup snapshot. The gate validates event ownership when executing, not against an unloaded default state.

Playback request/readiness recovery is implemented with offline coverage. This does not persist operation retry budgets across worker loss, guarantee runtime message-port lifetime (T12), or acknowledge successful media start (T12). [ADR 0003](../decisions/0003-offscreen-lifecycle.md) defines close/create/send coordination. Live SW termination/restart must be reported separately from popup closure or extension reload.

On UPDATE, [the install listener](../../packages/service-worker/src/listeners/install.ts) calls clearStorage: fields from ApplicationControls/ApplicationSettings survive; other Chrome storage fields are removed. Account switching awaits removal of old associated data before publishing the new identity; verified same-account refresh keeps it. Inconclusive session checks preserve stored data and expose explicit retry; confirmed unauthorized retains settings-preserving cleanup. [ADR 0005](../decisions/0005-session-verification.md) defines verification outcomes; [ADR 0009](../decisions/0009-session-owner.md) owns shared session writes/epochs. There is still no schemaVersion migration or transaction across every runtime writer (T11). Theme localStorage is not cleared by this function.

playbackRequested defaults to false, is reconciled from existing media at startup, and is removed on UPDATE/account switching with the other runtime keys. playbackInitialization defaults to loading, is republished on startup and has the same removal lifetime. An absent UI snapshot falls back to played until SW publishes intent. It is not a durable resume request.

A new persistent key needs an owner, a missing-value default, restart behavior and UPDATE/account-switch lifetime. Changing defaults alone is not a migration.

## Offscreen idle cleanup and readiness

The offscreen activity checker requests cleanup only after more than 5 minutes without native events or received control commands, while paused with no source-local playback request. It does not destroy Audio first. Snapshot probes do not extend that lifetime. CLOSE_OFFSCREEN_DOCUMENT includes a per-document identity, source playbackId and activity revision; SW confirms all three against a current idle snapshot. It rejects cleanup while play/loading or any media command is pending, and rechecks intent/command revisions after awaits.

Chrome setup, readiness probing, command delivery and close share one lifecycle queue. If close is already issued, an explicit play reloads the selected source after close completes instead of resuming a destroyed element. Successful idle close clears playbackId/flags while retaining selection/queue; reload of absent media follows the existing source-reload behavior and resets position. Failed cleanup retains the usable document and releases the queue. Firefox never closes its background document through this path. [ADR 0003](../decisions/0003-offscreen-lifecycle.md) owns the full contract.

## Queue mutations and loaded metadata

[ADR 0004](../decisions/0004-queue-mutations.md) owns queue rules. audiosIds is the complete playback order; currentPlaylist.tracks is only loaded metadata, and originalAudiosIds backs up applied shuffle order. Derive activeTrackIndex by ID; a removed playing entry has -1 and does not imply stopping Audio. Insertion is not wrapping navigation.

SW applies queue commands through commit-time transformations on the serialized playback writer, so consecutive edits use the latest state. Pending URL/source commits read the updated operation queue. A memory-only edit journal rebases late hydration and transfers to same-queue continuations; resume can refetch cancelled hydration without reloading the media. It is cleared after a successful full-queue commit and is not durable recovery.

The frontend no longer writes currentPlaylist directly. Its page owns a local draft/action list; external changes cancel that draft, and apply sends a command. Metadata pages use APPEND_CURRENT_PLAYLIST with identity/offset checks and a deduplicated merge. Page results must not overwrite edits or reinsert removed IDs. Entity observers accept same-length order/metadata changes. See the ADR for shuffle transitions, invalid/stale input and remaining response/session/schema limits.

## Minimal diagnostic read

Evaluate this function in an extension page, or in SW with serviceWorkerId. Return only the fields needed:

```js
async () => {
  const s = await chrome.storage.local.get([
    'played', 'playbackRequested', 'playbackInitialization', 'playbackId', 'playbackError', 'currentTime',
    'duration', 'activeTrack', 'audiosIds'
  ])
  return {
    played: s.played ?? false,
    playbackRequested: s.playbackRequested ?? s.played ?? false,
    playbackInitialization: s.playbackInitialization ?? 'unknown',
    playbackId: s.playbackId ?? null,
    playbackError: s.playbackError ?? null,
    currentTime: s.currentTime ?? 0,
    duration: s.duration ?? 0,
    hasTrack: s.activeTrack != null,
    queueLength: s.audiosIds?.length ?? 0
  }
}
```

Do not use chrome.storage.local.get(null) as a diagnostic dump: it includes tokens and personal data. Sanitize new error text before publishing playbackError; the current safe string does not make an arbitrary Error or VK response suitable for UI output.
