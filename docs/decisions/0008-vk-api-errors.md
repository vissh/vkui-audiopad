# ADR 0008: bounded token API requests reject failures

Status: accepted for vkApiClient.request. Shared refresh and token-method epochs now follow [ADR 0009](0009-session-owner.md); remaining legacy mutation adapters remain T09 work.

## Contract

A token API method returns its original successful JSON envelope, preserving response=1/object/array method-specific formats. HTTP errors, VK errors, malformed JSON and missing response envelopes reject; they cannot be interpreted as mutation success. Each mutation adapter must also validate its own successful response shape.

VKApiError contains a safe kind (unauthorized, rate-limit, http, network, format, timeout, unavailable, vk or session-changed), optional HTTP status and numeric VK code. [Request diagnostics](../ai/error-diagnostics.md) adds allowlisted operation/stage/attempt, Content-Type category and redirect flag, retaining these across session replies. It never includes upstream messages, request parameters, response payloads, cookies or tokens. Use the existing serialized error transport across contexts. Caller cancellation rejects with its reason; retiring an account/epoch rejects with session-changed rather than returning data or replaying a mutation under another identity.

The request boundary preserves classified VKApiError instances and maps only unclassified failures to unavailable (or timeout for the deadline). Omitting raw cause is intentional: serialization and logging must not reintroduce private payloads. Broader adapter format diagnostics and a bounded diagnostic journal remain T09/T15 work.

One 15-second deadline covers stored-token acquisition, the method call, any authorization refresh and its retry. commonUtils.withTimeout forwards abort and races it even if an adapter ignores cancellation, removes timers/listeners and is also used by popup session verification. Code still checks cancellation after asynchronous boundaries; a timeout cannot roll back an already-issued network/storage mutation.

Only HTTP 401 or VK error 5 allow one token refresh and one method retry. A second authorization failure rejects. HTTP 429/5xx, rate-limit errors, network/format failures and timeouts are not automatically repeated. Non-success HTTP is classified before inspecting an error-looking body, so a 503 containing error 5 cannot trigger an auth refresh/replay. Retrying an explicitly rejected authentication request is distinct from blindly repeating a mutation whose completion is unknown.

A failed/unauthorized refresh does not replace a stored token with an empty token, clear queues or send the method with empty credentials. Explicit verification in the background session owner owns settings-preserving confirmed-logout cleanup. Storage reads/writes use awaited Promise APIs; storage failure rejects safely. Stored token fields needed by requests are validated before use; malformed tokens go through refresh rather than unchecked casting.

POST keeps URLSearchParams in the body. GET merges parameters into the existing URL query and sends no body. The caller's parameter object is never mutated. Token acquisition retains legacy FormData/windows-1251/reconnect behavior and its successful-HTTP authorization distinction (ADR 0005).

## Limits

Refresh is now shared by the background owner. Token methods capture/check identity and observe account/epoch storage changes; late refresh/data cannot be accepted under another session. This does not roll back an already-issued VK/storage mutation or isolate every legacy cookie request/playback writer. Token acquisition failures retain their safe request diagnostics. Do not claim this finishes all T09 outcomes.

The general legacy client retains one reconnect for malformed successful-HTTP responses/reconnect envelopes, within one 15-second deadline. HTTP failures reject immediately; a repeated reconnect envelope rejects rather than reaching downstream parsers as success. Delete/restore/add/follow explicitly disable ambiguous replay and validate successful mutation shapes ([parity reference](../product/vk-parity.md)); other adapters still need review. UI mutation feedback, broadcast result acknowledgement and diagnostics have separate owners. A network deadline reports failure to verify completion; it does not prove VK did not apply the action.

## Evidence

[API regressions](../../tests/common/vk-api-errors.test.ts) first reproduced accepted VK errors, GET body, failed-refresh empty tokens and second-error-5 success. They cover safe serialization, HTTP-before-payload classification, finite refresh, shared deadline, late completion and storage failure. [Cancellation](../../tests/common/vk-api-cancellation.test.ts) proves a cancelled Mix cannot start refresh. [Deadline tests](../../packages/common/src/with-timeout.test.ts) exercise cleanup, ignored abort, pre-cancellation and operation failure. Existing [session tests](../../tests/front/session.test.ts) retain the popup contract after sharing this helper. Live evidence is separate in testing.md.
