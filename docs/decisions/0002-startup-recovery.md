# ADR 0002: startup readiness and existing-media recovery

Status: accepted; controlled startup/transport tests are implemented. Live worker termination/restart remains a separate verification requirement.

## Problem

Chrome can start a fresh service worker while its offscreen Audio continues playing. Registering listeners after asynchronous restoration can lose the wake-up event; executing before restoration can use an empty queue. Resetting played on each wake-up misrepresents surviving audio. Replaying stored playback intent can start music after browser/extension startup without a user command.

## Decision

Register Chrome listeners in the initial synchronous evaluation. Share one readiness gate across runtime messages, keyboard commands and storage side effects. Queue actions until initialization succeeds, preserving invocation order but allowing a later action to cancel an earlier asynchronous playback operation. Catch action rejection without printing private error details. Installation cleanup retains its existing policy; it is not an ordinary player command.

Observe storage before reading it and merge changes/removals that arrive during that read. Do not infer physical playback in loadState. Initialization publishes loading/ready/failed through playbackInitialization; a failure drops pending/later actions for that worker instance and publishes a safe playbackError when possible. Reloading the extension retries initialization. This is fail-closed startup, not a general command retry/result mechanism.

Query only an existing Chrome offscreen document, never create one for reconciliation. Firefox queries its background Audio using the same request/reply protocol over CustomEvents. Its two module entrypoints can initialize in either order: startup repeats the read-only readiness probe every 50 ms within the existing 2-second deadline, so an initial request before audio listener registration does not fail recovery. An absent listener still fails boundedly; playback commands are not replayed. GET_PLAYER_SNAPSHOT and PLAYER_SNAPSHOT carry a random requestId; temporary listeners are removed after success, invalid response, transport failure or the 2-second timeout. Validate the new snapshot shape and finite nonnegative times. Do not include source URLs, personal metadata, credentials or queues.

Offscreen reports document identity, activity revision/idle status, playbackId, source ownership, its in-memory playback request, native paused/playing/ended/error flags and finite time/duration. A source can be owned before HLS attaches a native src. Playing requires an unpaused, unended, error-free Audio with readyState at least HAVE_FUTURE_DATA; buffering or pending HLS attachment may therefore have requested=true while played=false. The request comes from the surviving Audio owner, not persisted UI intent. Adopt it only when playbackId matches storage and a stored active track/playlist owns the selection. Restore operation/source identity and current position without invoking play or resolving another URL.

If media is absent, clear stale playbackId and both playback flags while retaining the queue for explicit play. If media is mismatched, ended or failed, pause it and clear ownership with a safe retry message. Unreachable existing media fails initialization instead of guessing that it disappeared. Persisted requested=true alone never starts music.

The snapshot reply is the media-event boundary: earlier arrivals are superseded; later events queue behind the final reconciliation commit and recheck playbackId ownership when run. This prevents an old playing event from overriding a paused snapshot or the startup commit from overwriting a later time update. No replay of startup ended/error events means reconciliation itself does not auto-advance a stored queue.

## Limits and next work

- [ADR 0003](0003-offscreen-lifecycle.md) adds bounded readiness probes before media commands and serializes Chrome close/create/send. This is listener readiness, not acknowledgement that media actually started.
- Retry budgets, pending selection and unfinished VK requests are not durable. Matching media gets a fresh operation budget; durable storage/migrations remain T11.
- Message-port lifetime, sender policy and general command validation/results remain T12. Current sendMessage completion is not playback acknowledgement.
- UPDATE/account-switch cleanup still removes runtime state. The startup status has the same lifetime and is republished on startup; this is not schema-versioned migration.
- Snapshot arrival order is the boundary for this protocol. Broader delivery/duplicate policies and multi-context command envelopes remain T12.

## Evidence

[Startup tests](../../tests/service-worker/startup.test.ts) cover matching playing/paused media, absent/mismatched sources, commands before queue load, queued toggle ordering, storage failure, snapshot timeout and media events around the final commit. [Storage tests](../../tests/service-worker/storage.test.ts) cover changes/removals during an asynchronous initial read. [Snapshot tests](../../tests/offscreen/player-snapshot.test.ts) exercise both real transports, timeout/correlation/cleanup, malformed payload and unavailable bridge. See [testing](../ai/testing.md) for live observations and their limits.
