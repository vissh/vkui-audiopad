# ADR 0005: inconclusive session checks preserve local data

Status: accepted for popup session verification; general VK request/refresh and cross-context account isolation remain T09/T10/T11.

## Problem

Opening the UI verifies the VK session. Previously both an explicit authorization failure and an exception could clear stored session/runtime data, including the queue. Missing profile response data also looked like logout. A temporary outage could therefore destroy local state. The legacy client also parsed non-successful HTTP token responses without checking their status.

## Decision

The sign-in feature owns verification, persistence and the retry UI. Its check returns a verified token, confirmed unauthorized, or an inconclusive exception. Caller cancellation rejects and must not persist a result.

- Token acquisition requires successful HTTP before interpreting its payload. HTTP errors, including HTTP 401 at this endpoint, are inconclusive; only a successful-HTTP explicit `type=error, error_info=unauthorized` confirms logout there.
- The existing profile probe confirms unauthorized on HTTP 401 or successful-HTTP VK error 5. Other HTTP/VK errors, malformed JSON and missing/non-object profile response are inconclusive.
- Token acquisition and the profile probe share a 15-second deadline. Forward cancellation to fetch and race the deadline so an adapter ignoring abort cannot keep the query pending. Recheck cancellation after asynchronous boundaries.
- Inconclusive checks make no session/queue writes. Show a safe status below the player and an explicit “Повторить” action. Disable it during the request. There is no automatic session-query retry; retries are read-only verification, not replay of VK mutations.
- Verified same-account refresh awaits persistence and keeps deviceId and associated data. A different account clears old associated data before publishing the new identity, retains settings and generates a deviceId. Confirmed logout retains the existing settings-preserving cleanup policy.
- Await cleanup and persistence, propagate their failures to the retry UI, and serialize session writes within one frontend context. An aborted queued write does not begin; an already-issued storage mutation cannot be cancelled or rolled back.
- Session UI errors and token-parser errors contain no upstream response payload or credentials. Preserve legacy FormData, windows-1251 decoding and the one reconnect attempt. HTTP status enforcement is opt-in for the token endpoint; it does not change all legacy scraping calls.

## Limits

This is not a global session epoch, transaction or refresh single-flight. Different popup contexts, common-client refreshes, SW writes and cached personal queries can still race account changes. Cache cancellation/identity, cross-context ownership and storage migrations remain T09/T10/T11. Existing UPDATE cleanup still removes runtime/session data while retaining settings; this change does not introduce a queue migration policy.

Token-method safe failures and bounded auth refresh are now implemented in [ADR 0008](0008-vk-api-errors.md); delete/restore result validation and app-ID consistency are covered by [ADR 0006](0006-library-delete-restore.md), whose live A/B accepted both client_id values. Shared refresh/account epochs, other legacy mutations and safe errors in other parsers remain open. The banner reports session verification/persistence failure, not the state of every catalog query. A successful retry does not refresh unrelated failed queries.

## Evidence

[Session boundaries](../../tests/front/session.test.ts) cover transient/profile errors, explicit logout, cancellation, the shared deadline, account cleanup ordering and retry after storage failure. [Actual sign-in UI](../../tests/front/session-ui.test.ts) covers safe status, explicit retry, duplicate-click prevention, successful recovery and confirmed sign-in. [Token endpoint](../../tests/common/web-token.test.ts) covers HTTP failures, successful unauthorized, request shape and payload-free parser errors; [legacy client](../../tests/common/vk-client.test.ts) retains encoding/reconnect/cancellation checks. [Cleanup](../../tests/common/clear-storage.test.ts) asserts awaited removal and preservation. See [testing](../ai/testing.md) for separate live evidence and limits.
