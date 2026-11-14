# ADR 0004: queue mutations, loaded metadata and hydration

Status: accepted; pure rules, controlled races and actual editor behavior are tested. Scoped Chrome observations are in testing.md.

## Problem

Playback IDs cover the complete queue, while currentPlaylist.tracks contains only loaded TrackItems. Reusing one insertion index across these collections can hide a newly inserted track. Playback navigation wraps at queue boundaries; insertion after the last item must append instead. Removing an absent ID through splice(-1) deletes an unrelated last entry. A stale numeric activeTrackIndex cannot identify the playing source after edits.

Independent read/modify/write operations can overwrite each other. A late full-queue response can restore removed entries or lose inserted ones. Front editor/pagination writes can also overwrite newer SW state, and the old atom comparator ignored same-length reorderings.

## Decision

SW owns current-queue mutation. queue.ts contains pure insert/remove/move/shuffle rules; queue-state.ts applies their results through the same serialized writer as playback snapshots. Compute transformations when a write reaches the head of that queue, not when the command first arrives. Recheck current queue/session/operation ownership around the write; a command for the old queue must not mutate a pending different playlist. An already-issued storage write cannot be cancelled, so the later valid commit still wins (ADR 0001).

Identify a logical queue by playlist id, ownerId and blockId. Match activeTrack.id against the actual ID array to derive its index; absence is -1. Removing a queue entry does not stop or delete the current Audio source and does not mutate VK's library. Ordinary next/previous wrapping and end-of-queue policy are unchanged.

### Insertion and editing

- Play-next removes existing copies of the candidate and inserts it immediately after the active ID independently in playback order, restore order and loaded metadata. Do not use the wrapping playback-navigation helper. The active item itself is ignored, matching the UI restriction.
- If the playing source was removed from playback order, insert at the front so next can select it. If the active ID exists in the full queue but its metadata is not loaded, append the new metadata item to the loaded subset without inventing unloaded TrackItems.
- Resolve move/remove actions against their ordered editor snapshot, then express them as stable source/anchor IDs. Missing IDs never become numeric zero or negative splice indexes. Reject invalid indices, wrong ownership, stale loaded order and a proposed order inconsistent with its actions as one batch.
- During shuffle, moves change restore order and loaded metadata; playback order stays shuffled. Removal affects both ID collections. Insertion goes after the active ID independently in both orders. A nonempty originalAudiosIds is the backup for the currently applied shuffle, even if the desired shuffle setting has already changed and its action is still queued.
- Shuffle derives selection from activeTrack.id, preserves keys/membership, reuses an existing backup on repeated enable, and restores it on disable. Empty or missing-backup cases remain valid; an absent active ID stays -1.

The shuffle button sends TOGGLE_SHUFFLE instead of writing a negated UI snapshot. SW commits each next setting through the shared serialized writer, deriving it at execution time. Its existing storage observer applies the latest enabled value to the queue and retires superseded reorder work. REPEAT uses the same writer for ordered mode cycling. Delayed storage/React delivery must not collapse several clicks into one setting; failed writes release later commands. [Transport regressions](../../tests/service-worker/playback-command-transport.test.ts) cover delayed commits, every intermediate mode, both transports and failure recovery.

### Late full-queue and page responses

While hydration is pending, record committed inserts/removes/moves in the current operation. Rebase the fetched full IDs through that journal at commit time, then apply the current shuffle setting. Include the selected source before replaying edits so an explicit removal can still exclude it. Clear the journal only after hydration commits. Continuation to another selected track in the same pending queue transfers edits; resuming paused media restarts cancelled hydration without resolving/replacing that media source. An explicit different queue does not inherit edits.

Synchronize a pending operation's queue/loaded metadata after committed edits, and prepare source snapshots at writer execution time. This prevents a delayed URL response from restoring the queue it captured before the edit. Failed edits are not journaled, and failed writes release the writer for later operations.

APPEND_CURRENT_PLAYLIST merges a metadata page into the current queue through SW. Check base identity and pagination offset, deduplicate loaded IDs, retain current metadata/edits, and filter page items against the full queue (or pending hydration edits). It does not replace playback IDs or restore deleted entries from an old page. A replay with a stale offset or different queue is ignored.

### Frontend

The page owns a temporary draft and action list in one state update. Apply sends EDIT_CURRENT_PLAYLIST and returns to the observed snapshot; cancel sends nothing. External queue changes cancel the stale draft. Pagination is disabled while editing and sends a merge command instead of writing storage. Entities expose observers, including reorderings with unchanged playlist identity/length; atom.ts no longer exports queue setters.

## Limits

- The edit journal is SW memory, not a persistent schema/migration or restart-safe queue history (T11).
- General runtime validation, sender/session envelopes, conflict UI and command acknowledgement remain T12/T09. Queue/session guards here do not authenticate arbitrary callers or version every upstream response.
- Library delete/restore timing belongs to T08; these rules only transform the local queue. Natural-end policy is a separate product decision.
- Server pagination can change independently. Fixture tests and one live profile do not establish every VK data shape or browser mode.

## Evidence

[Queue actions](../../tests/service-worker/queue-actions.test.ts) first reproduced five defects, then cover rapid writes, delayed URL/hydration, edit transfer, pause/resume, failed writes, paging, stale drafts and shuffle transitions. [Pure rules](../../tests/service-worker/queue.test.ts) cover visible/full distinctions, anchors, invalid indices, membership/order/selection and immutability. [Actual editor handlers](../../tests/front/queue-editor.test.ts) cover apply/cancel-by-update, rapid draft edits and page commands; child drag controls are adapters there. [Atom observers](../../tests/front/atom.test.ts) cover same-length reorder snapshots. Live native drag/apply and other Chrome scenarios are recorded separately in testing.md.
