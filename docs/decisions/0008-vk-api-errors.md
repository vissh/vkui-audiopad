# ADR 0008: bounded token API requests reject failures

Status: accepted for vkApiClient.request. Shared refresh coordination, account epochs and remaining legacy mutation adapters remain separate T09 work.

## Contract

A token API method returns its original successful JSON envelope, preserving response=1/object/array method-specific formats. HTTP errors, VK errors, malformed JSON and missing response envelopes reject; they cannot be interpreted as mutation success. Each mutation adapter must also validate its own successful response shape.

VKApiError contains a safe kind (unauthorized, rate-limit, http, network, format, timeout, unavailable or vk), optional HTTP status and numeric VK code. It never includes upstream messages, request parameters, response payloads, cookies or tokens. Use the existing serialized error transport across contexts. Cancellation belongs to the caller and rejects with its reason instead of becoming an authorization failure.

One 15-second deadline covers stored-token acquisition, the method call, any authorization refresh and its retry. commonUtils.withTimeout forwards abort and races it even if an adapter ignores cancellation, removes timers/listeners and is also used by popup session verification. Code still checks cancellation after asynchronous boundaries; a timeout cannot roll back an already-issued network/storage mutation.

Only HTTP 401 or VK error 5 allow one token refresh and one method retry. A second authorization failure rejects. HTTP 429/5xx, rate-limit errors, network/format failures and timeouts are not automatically repeated. Non-success HTTP is classified before inspecting an error-looking body, so a 503 containing error 5 cannot trigger an auth refresh/replay. Retrying an explicitly rejected authentication request is distinct from blindly repeating a mutation whose completion is unknown.

A failed/unauthorized refresh does not replace a stored token with an empty token, clear queues or send the method with empty credentials. The sign-in feature owns settings-preserving confirmed-logout cleanup. Storage reads/writes use awaited Promise APIs; storage failure rejects safely. Stored token fields needed by requests are validated before use; malformed tokens go through refresh rather than unchecked casting.

POST keeps URLSearchParams in the body. GET merges parameters into the existing URL query and sends no body. The caller's parameter object is never mutated. Token acquisition retains legacy FormData/windows-1251/reconnect behavior and its successful-HTTP authorization distinction (ADR 0005).

## Limits

Refreshes are still per request/context, not one shared single-flight or cross-context session transaction. A successful late refresh can still race another context's account change; shared storage needs a separate ownership/epoch policy. Token acquisition failures are currently surfaced as safe unavailable failures when they do not provide the method client's typed status. Do not claim this finishes all T09 outcomes.

The general legacy client retains its existing default reconnect policy. Delete/restore/add/follow explicitly disable ambiguous replay and validate successful mutation shapes ([parity reference](../product/vk-parity.md)); other adapters still need review. UI mutation feedback, broadcast result acknowledgement and diagnostics have separate owners. A network deadline reports failure to verify completion; it does not prove VK did not apply the action.

## Evidence

[API regressions](../../tests/common/vk-api-errors.test.ts) first reproduced accepted VK errors, GET body, failed-refresh empty tokens and second-error-5 success. They cover safe serialization, HTTP-before-payload classification, finite refresh, shared deadline, late completion and storage failure. [Cancellation](../../tests/common/vk-api-cancellation.test.ts) proves a cancelled Mix cannot start refresh. [Deadline tests](../../packages/common/src/with-timeout.test.ts) exercise cleanup, ignored abort, pre-cancellation and operation failure. Existing [session tests](../../tests/front/session.test.ts) retain the popup contract after sharing this helper. Live evidence is separate in testing.md.
