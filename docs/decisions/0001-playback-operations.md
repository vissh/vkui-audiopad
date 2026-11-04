# ADR 0001: playback operations, cancellation and error budget

Status: accepted for the current T03/T04 implementation. [ADR 0002](0002-startup-recovery.md) adds startup recovery/readiness. A unified command-result protocol remains separate work.

## Problem

Independent async play requests could complete out of order and restore an obsolete selection. Queue hydration had the same race. Missing URLs and media errors used different retry paths; missing tracks could loop through a queue indefinitely. Offscreen events had no source-load identity. Storage writes to played also acted as implicit commands, obscuring the difference between a user pause and an observed media stop.

## Decision

service-worker/src/playback-operation.ts owns one current operation. A new explicit playback intent aborts the previous AbortController and its waits. Operations include a selection snapshot, visited IDs, attempt count and automatic-attempt revision. During loading, next/previous advances from the latest selected track; after launch it reads the current applicationState queue, including edits and shuffle.

Check operation/revision ownership after awaits and before effects. Serialize playback writes: Chrome cannot cancel an already-issued storage write, but the newer commit runs after it and wins. Recheck ownership after preparing offscreen, immediately before PLAY_TRACK delivery. Network abort is additional protection; correctness must not depend on an adapter respecting AbortSignal.

An unfinished full-queue hydration for the same playlist transfers to the next operation. The new owner issues its own current request and calculates its selection's index; the old response cannot commit. This preserves the complete queue when next arrives during initial hydration.

Front toggle controls send TOGGLE_PLAYBACK to SERVICE_WORKER; the hotkey calls the same action. SW alone flips a synchronous requested intent before awaiting any storage/network work. Keep it separate from applicationState/storage snapshots, whose older writes/events can arrive after a newer command. Intent revisions guard control sends even when the operation identity does not change. PLAY_OR_PAUSE with a boolean remains available for explicit set commands and SW-to-offscreen control.

The playbackRequested snapshot lets action icons show pause during loading; played remains the playback observation (with the existing pause shortcut publishing false before the media acknowledgement). UI observers never write either field to command playback. Missing playbackRequested falls back to played in legacy UI storage. Startup reconciles intent from existing media without replay/autoplay; UPDATE/account switching removes it with runtime state. See ADR 0002 for readiness/reconciliation.

Pause cancels loading and scheduled retries. An operation records whether source dispatch completed: a subsequent play resumes launched media, preserving Audio/position, or restarts the cancelled pending selection. Do not infer dispatch completion from loading=false, which also occurs on cancellation/failure. Terminal failure clears playbackRequested as well as played. A repeated ACTIVE_TRACK before its metadata commits still selects/restarts that source; only TOGGLE_PLAYBACK changes intent.

Each source load gets a random playbackId, stored in the snapshot and included in PLAY_TRACK and all AUDIO_PLAYER events. SW rejects obsolete IDs, post-cancellation events and duplicate errors while retry is pending. Ownership checks also cover asynchronous continuations in playing/ended/timeupdate.

Offscreen keeps a source-local requested state and control revision: pause prevents a late HLS attachment from starting audio, and obsolete play() rejection cannot fail a later resume of the same source. See [ADR 0003](0003-offscreen-lifecycle.md) for readiness and document lifecycle.

Offscreen creates a new Audio for each source load. It pauses the previous element, removes src/listeners and destroys old HLS; one element is active at a time. Event/HLS callbacks capture their playbackId, so late callbacks cannot act on a newer source. Rejected audio.play(), native errors and fatal HLS errors report ERROR once per source load. Audio.crossOrigin is not set.

## Attempt limits

Missing/empty URLs and media errors share one operation budget. Ordinary playlists are traversed iteratively; each candidate ID is visited at most once and duplicates are skipped. Large queues and unbounded Mix also have MAX_PLAYBACK_ATTEMPTS = 10. This bounds load on an external service; it is not a product requirement about playlist size.

Delays are fixed: 500 ms between unavailable candidates, 300 ms after media errors. They are not exponential backoff. A player-level network exception ends with a safe error without a new retry layer; legacy's existing single reconnect remains. Detailed HTTP/VK error classification and timeouts belong to T09.

Exhausting the queue/budget publishes played=false, playbackId=null and a safe playbackError, and stops existing media. UI shows the reason. A new explicit intent starts a fresh budget and clears the error when a track is successfully prepared. Optional queue-hydration failure does not stop valid media; it produces a generic warning without response payloads.

## Compatibility and limits

- Optional AbortSignal parameters were added to clients/playback fetchers. FormData, windows-1251 decoding, response conversion and vendored unmask remain unchanged.
- Playback IDs/errors default to null; requested intent defaults to false. Chrome and Firefox use the same commands/IDs; Firefox retains its CustomEvent bridge.
- Existing natural-end/repeat/shuffle behavior is preserved. This change does not adopt a new end-of-queue product policy.
- Operation/budget state is SW memory only. ADR 0002 restores ownership from matching live media after startup. Retry budgets/unfinished requests are not persisted; durable recovery remains T11.
- Runtime unknown-message validation, request/response envelopes and sender policy remain T12. ADR 0003 defines the implemented offscreen listener readiness and close/create coordination; live/browser evidence limits remain in testing.

## Verification

[Intent tests](../../tests/service-worker/playback-intent.test.ts) cover play/pause/play before media, cancelled retries and delayed storage; [command transport tests](../../tests/service-worker/playback-command-transport.test.ts) cover shared runtime/hotkey/Firefox-bridge intent. [Playback tests](../../tests/service-worker/playback.test.ts) cover empty/unavailable queues, bounded attempts, duplicate IDs, reordered completions, storage commits, Mix and hydration. [Audio error tests](../../tests/service-worker/audio-error.test.ts) cover the shared budget, duplicate events, pause and explicit retry. [Offscreen ordering](../../tests/service-worker/offscreen-ordering.test.ts) covers the document-creation boundary; [player lifecycle](../../tests/offscreen/player-lifecycle.test.ts) covers late Audio/HLS callbacks and play rejection. tests/common covers cancellation without reconnect/refresh; [playback controls](../../tests/front/playback-controls.test.ts) checks explicit commands, observed state and a safe error in the actual Player DOM.
