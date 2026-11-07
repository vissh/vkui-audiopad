# ADR 0009: one background owner coordinates session writes

Status: accepted for popup verification and token-method requests. General command validation (T12), versioned state migrations (T11), legacy request/account isolation and complete browser UI automation remain separate work.

## Problem

Each frontend instance serialized only its own session writes, while the token client refreshed and wrote credentials independently. Concurrent authorization failures could refresh twice. A delayed refresh could overwrite a newer account's token, and a successful method response could be accepted after its account had changed.

## Decision

[The session owner](../../packages/service-worker/src/session.ts) runs in the existing background orchestrator: Chrome service worker or Firefox background page. It registers independently of playback readiness. UI and token clients request session operations through [the common client](../../packages/common/src/session-client.ts); the owner calls the same handler locally, without sending a message to itself. Catalog requests still run in their original context; only session acquisition/verification/persistence is centralized.

- `verify` performs the existing token/profile checks and is the only operation allowed to publish a different account or confirmed logout. Inconclusive failures preserve existing data and reach the existing explicit-retry UI. Concurrent verification callers share work.
- `token` reads usable cached credentials or joins one background refresh. `refresh` includes the rejected token and captured identity; a late rejection reuses credentials already refreshed for that token instead of refreshing again. An unauthorized background refresh preserves storage and never submits an empty token to a VK method.
- Explicit verification supersedes an older background refresh. Work checks its identity/cancellation before persistence and after network boundaries, including adapters that ignore abort.
- A caller leaving shared work does not abort another caller. The final cancellation aborts the shared task. Client, owner and shared work have bounded deadlines; they do not retry missing receivers or ambiguous mutations automatically.
- The owner serializes cleanup and persistence. A different account clears associated data before publishing its identity; settings survive, same-account refresh keeps deviceId and queue. Write failures remain observable and a later attempt can retry.

## Identity and persistence

`sessionEpoch` is a flat Chrome storage string alongside userId/webToken/deviceId. The identity is the pair `{ userId, epoch }`. Missing legacy epochs read as `legacy`, so existing matching tokens remain usable without an eager migration/refresh. The first verified same-account write retains that epoch. Account change or confirmed logout rotates the epoch; repeated verification of an already signed-out state does not rotate it indefinitely. A worker recreation reads the persisted identity instead of creating a new epoch.

Token-method requests capture the identity before acquiring credentials, reject a mismatching owner response and observe userId/sessionEpoch storage changes while pending. They recheck identity before dispatch and before returning success. Account changes abort their local wait; late data/auth refresh cannot replay or publish as the new account. A cancelled/already-sent network request may still have been applied by VK; this is not a rollback mechanism.

This includes the lyrics reader added after the original owner implementation. Its [API](../../tests/common/audio-lyrics.test.ts) and [Player DOM](../../tests/front/lyrics.test.ts) tests run a separate background owner and UI/common module instance through the actual request/reply adapter. Changing only userId while retaining another account's token is an inconsistent snapshot, not a verified account transition; valid transition fixtures publish matching identity and credentials. Lyrics requests reject retired accounts/epochs without replay, while the UI keeps lazy reads, cancellation and account-scoped cache retirement.

## Session message boundary

SESSION_REQUEST carries requestId and a validated operation; SESSION_CANCEL cancels that request only for its original sender document. The owner accepts only its own extension ID and extension-origin sender URL, including extension UI tabs. It validates unknown operation/identity/request fields, returns a correlated result and serializes only safe VKApiError data. It keeps Chrome's asynchronous sendResponse channel open by returning true. The UI validates the response shape/correlation and never trusts an arbitrary token envelope.

Firefox UI-to-background session requests use runtime request/reply across those contexts. Background session calls are local; the audio same-document CustomEvent bridge remains unchanged. This is a session-specific result contract, not general playback/queue command acknowledgement.

## Limits

Only the current session owner should write session keys. Storage is not transactional: an already-issued mutation cannot be cancelled/rolled back, and a stalled write can block later writes until the worker is recreated. Owner memory is not a durable job queue; callers have deadlines and explicit retry after worker loss.

Legacy cookie requests, arbitrary direct storage writers, all pending playback/hydration operations, cross-window catalog invalidation and every account-scoped atom are not made transactional by this change. Their cleanup/epochs need their own scenarios under T09/T10/T11/T12. UPDATE still uses the existing settings-preserving cleanup. The new epoch field is backward-compatible metadata, not a complete schemaVersion/migration system.

## Evidence

[Three initial regressions](../../tests/common/session-races.test.ts) reproduced duplicate refresh, stale-token overwrite and acceptance of a prior-account method response. [Owner/transport regressions](../../tests/service-worker/session.test.ts) separate UI/worker module state and cover shared work, supersession, cancellation, safe replies, invalid senders/input, correlation, deadlines and recreation. [Verification](../../tests/front/session.test.ts) and [actual sign-in UI](../../tests/front/session-ui.test.ts) retain transient/confirmed failure, persistence/retry and cancellation coverage through the owner. [The Firefox probe](../../tests/browser/firefox-probe.mjs) exercises cached synthetic session replies and rejection of stale/malformed input in a real built addon without VK credentials; successful execution is recorded separately in the testing guide.
