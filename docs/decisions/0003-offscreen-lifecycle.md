# ADR 0003: offscreen readiness, idle cleanup and source intent

Status: accepted; controlled lifecycle/transport/Audio regressions are implemented. Live evidence and its exact build scope belong to testing.md.

## Problem

The idle checker destroyed Audio before asking SW to close its document. A delayed close could then kill a newer play, and missing timeupdate events could destroy unpaused media. Concurrent create/send/close had no shared ordering. Successful createDocument did not establish that offscreen message listeners were ready.

HLS had a related source lifecycle gap: MEDIA_ATTACHED could arrive after pause and call play anyway. An older rejected play promise could also report failure after a successful resume of the same playbackId.

## Decision

Chrome setup, readiness probing, command delivery and document close share a lifecycle queue in offscreen/setup.ts. Recheck command ownership before/after asynchronous preparation. A failed task releases the queue; a failed creation or close does not permanently block future commands.

Before delivering a media command, probe GET_PLAYER_SNAPSHOT until a valid correlated reply arrives, retrying every 50 ms within a 2-second deadline. A missing initial receiver is tolerated during that bounded readiness wait. Cancellation removes its temporary listener/timers and releases the queue without delivering an obsolete command. Firefox uses the same readiness exchange over its CustomEvent bridge and never invokes Chrome document setup/close. Listener readiness is not media-start acknowledgement or the general T12 command-result contract.

The activity checker only requests cleanup after more than 5 minutes without native media events or received control commands, with Audio paused and its local requested state false. It never destroys the source before approval. Snapshot queries do not count as activity. Each document has a random documentId; native events and control commands advance its activityRevision. Idle requests include documentId, playbackId and that revision.

SW confirms a current snapshot with the same identities/revision and idle/paused/not-requested flags. Reject cleanup while SW playback intent is true or any media command is pending. Capture and recheck SW intent and transport-command revisions around awaits, including before the actual close call. This also protects a play-then-pause sequence whose final boolean matches the original state, and seek/volume commands that do not change playback intent.

If closeDocument is already issued, it cannot be cancelled. A concurrent explicit play therefore reloads the selected source; its send waits for close completion and the next document's readiness. A late close completion cannot clear the newer operation's identity/state. Successful idle cleanup clears playback flags/ID while retaining selection/queue/time snapshots. Later source reload follows existing missing-media behavior and resets Audio position. Failed cleanup retains the usable document for resume.

Offscreen also owns a source-local requested flag and control revision. Pause records false even before HLS has attached a native src; the HLS callback checks that flag before play. Every new source, invalidation and explicit control changes the revision. Rejected play promises report failure only if their revision is still current, so a paused/obsolete attempt cannot fail the next resume. Genuine current failures retain the existing ERROR path and shared SW budget.

Snapshot source presence means an owned playbackId, including HLS attachment in progress. Its requested flag is in-memory offscreen intent. ADR 0002 can preserve that surviving pending operation without replaying a stored boolean or invoking play itself. Native playing state still requires readyState at least HAVE_FUTURE_DATA, so requested=true/played=false is valid while loading.

## Limits

- Worker restart loses SW lifecycle/retry memory; ADR 0002 reconciles surviving media, not unfinished network requests or a durable budget.
- Chrome may independently close an offscreen document. Missing-media recovery is not a guarantee of preserving a destroyed Audio position.
- Static message types and the snapshot validator do not implement general sender authorization, command acknowledgement or retry policy (T12).
- Controlled HLS callbacks verify lifecycle rules, not real stream decoding/network behavior. Firefox and live SW termination have separate browser evidence requirements.

## Evidence

[Idle checker tests](../../tests/offscreen/activity-checker.test.ts) first reproduced premature source destruction and cleanup of unpaused media. [Lifecycle races](../../tests/service-worker/offscreen-lifecycle.test.ts) cover idle confirmation, stale document/activity, concurrent resume, issued/failed close and pending volume. [Readiness tests](../../tests/service-worker/offscreen-ordering.test.ts) cover delayed listener registration, cancellation, timeout and recovery; [snapshot tests](../../tests/offscreen/player-snapshot.test.ts) exercise both real transports. [Player lifecycle](../../tests/offscreen/player-lifecycle.test.ts) covers delayed HLS after pause, obsolete promise rejection, current resume failure and old-source callbacks. [Startup tests](../../tests/service-worker/startup.test.ts) cover preserving pending HLS ownership without calling play.
