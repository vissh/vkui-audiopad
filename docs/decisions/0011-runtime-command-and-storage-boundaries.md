# ADR 0011: command results, session retirement and stored-state upgrades

Status: accepted for the boundaries below. General legacy-request cancellation, a complete storage-key registry and durable operation/edit recovery remain roadmap work.

## Commands and trust

Common's [message validators](../../packages/common/src/message-validation.ts) check unknown command payloads, nested queue/track data, control ranges and finite media times. Chrome runtime handlers require the extension's own ID and a parsed extension scheme/host match. Do not compare URL.origin alone: extension URLs can have opaque origins in URL implementations. Firefox's CustomEvent transport is confined to the existing private background document; it has the same payload validation, without fabricating a runtime sender.

[requestCommand](../../packages/common/src/command-client.ts) adds a random requestId and a 30-second expiresAt deadline. Runtime replies use sendResponse plus literal return true for Chrome 116 compatibility. Firefox background requests return COMMAND_REPLY events with the same correlated result. Receivers ignore reply messages as commands. Missing/malformed receivers/results and timeouts produce safe serialized errors, without replay. SW waits for readiness, checks expiry and compares the stored user/epoch at receipt and execution. A queued expired/retired command never starts. Already-started work may finish after a caller times out or closes; timeout is an uncertain result, not rollback or permission to retry automatically.

Queue replies distinguish applied from ignored stale/no-op transformations after the serialized storage write. Other replies mean handled. In particular, an offscreen PLAY_TRACK reply confirms acceptance, not decoded or playing media: source preparation remains asynchronous so pause can interrupt it. Preparation failure reports AUDIO_PLAYER_ERROR with playbackId. Actual playing/progress remains established by AUDIO_PLAYER_* events. Unknown/live durations are published as zero instead of non-finite JSON values.

Readiness orders asynchronous preparation and handler invocation across runtime commands, hotkeys and storage events. It does not await a handler's completion before launching the next one: later playback intent must still cancel earlier network/audio preparation. Command identity reads are bounded by the request deadline, so a stalled preparatory read cannot permanently block later actions.

The frontend wrapper observes these replies and shows the existing Snackbar for an unavailable result or stale queue change. Raw one-way commands remain accepted from validated extension senders for internal compatibility, including keyboard/storage side effects. Session requests and player snapshots retain their own validated protocols. This is not durable duplicate suppression or exactly-once delivery across worker loss.

## Session retirement and writes

Each PlaybackOperation captures userId/sessionEpoch. Source resolution, retries and hydration use operation/session ownership after awaits; changing only the epoch also retires old work. Queue transformations guard both fields. A retired operation cannot become a pending selection for the next account.

Playback commits, session cleanup/persistence and migrations share [one writer](../../packages/service-worker/src/state-writer.ts). Before the background session owner clears account data, it retires playback intent/operations and the in-memory queue, and pauses existing media without creating an offscreen document. An already-issued playback write finishes before session cleanup, while later retired commits are rejected. This does not make arbitrary UI storage writes or already-issued VK mutations transactional.

## Storage reads, failures and upgrades

storageAtom subscribes before its initial read. A revision prevents that read from overwriting a newer event, removal or local intent. Read failure leaves the fallback available and completes onReady. A failed optimistic write reports a fixed diagnostic and rereads durable state; a newer revision prevents stale rollback. SW control reads/writes use native storage Promises, preserving failures instead of dropping runtime.lastError.

[Migration v1](../../packages/service-worker/src/storage-migrations.ts) marks fresh/unversioned storage, preserves valid queues (including unloaded IDs and shuffle order), position, settings and credentials, repairs malformed legacy queue/control data and recomputes the selected index. It writes the patch and version together, under the shared writer. Repeated migration is idempotent; failed writes leave the old version available for retry. Unknown/future versions fail initialization without deleting data or attempting downgrade.

UPDATE runs migration instead of blanket runtime cleanup. Stored playback intent never causes autoplay: startup still reconciles only existing Audio, or keeps the selection for explicit playback when media is absent. An absent source still restarts at the beginning on explicit play; storing position does not implement source-position recovery. Account change/confirmed logout still clear account data, preserving settings and schemaVersion. Normal UI session verification remains responsible for rechecking authentication.

## Evidence and remaining scope

- [Command contracts](../../tests/service-worker/command-results.test.ts) and [Audio command contracts](../../tests/offscreen/command-results.test.ts): both transports, readiness, safe rejection, stale edits, expiry, missing receiver and failed initialization/storage
- [Invocation ordering](../../tests/service-worker/readiness.test.ts): asynchronous command preparation cannot be overtaken by a later hotkey, while handlers can finish independently
- [Validation](../../tests/common/message-validation.test.ts): malformed nested input, finite media state and Chrome/Firefox sender URL handling
- [Session playback](../../tests/service-worker/playback-session.test.ts): delayed legacy replies after account/epoch/logout and serialized retirement
- [Existing Audio retirement](../../tests/service-worker/session-playback.test.ts): pause before publishing a verified account through both runtime modes, without creating a document
- [Client results](../../tests/common/command-client.test.ts): correlation, missing replies and background listener cleanup
- [Atom](../../tests/front/atom.test.ts) and [storage](../../tests/service-worker/storage.test.ts): delayed hydration, removal, failures and rollback
- [Migrations](../../tests/service-worker/storage-migrations.test.ts): legacy/malformed/repeated/future/failed upgrades, queue preservation and account reset

Browser identity and observed scenarios belong to [testing](../ai/testing.md). Minimum-browser execution, real VK/HLS failures, isolated worker termination and actual extension-store upgrades require their own evidence. Migration v1 does not remove ApplicationState's open Record or replace validation of every stored field.
