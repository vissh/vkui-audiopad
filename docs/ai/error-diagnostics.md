# Request diagnostics and safe recovery

Read this before changing error reports or introducing session cleanup as recovery. [ADR 0005](../decisions/0005-session-verification.md) owns confirmed logout, [ADR 0008](../decisions/0008-vk-api-errors.md) owns token-method retry and [ADR 0009](../decisions/0009-session-owner.md) owns credential writes.

## Reports

Catalog errors, session-verification failures and the provider-independent render fallback expose a collapsible, read-only report. It contains reportVersion, manifest version, browser product/version, loaded frontend asset names and a safe error description. Asset names distinguish local builds that share a manifest version. Missing browser/runtime metadata falls back to unknown.

VKApiError adds allowlisted operation, stage, attempt, HTTP status, numeric VK code, Content-Type category and redirect flag where available. A token-acquisition error retains its own operation/stage when propagated through a method request. The session reply reconstructs these fields through the same allowlist; arbitrary reply properties are discarded.

The report never copies request parameters, request/redirect URLs, headers, cookies, upstream messages/bodies, arbitrary Error.message, cause or nested objects. Unknown errors retain a standard error name and up to eight extension asset stack locations. Known errors use a fixed message plus structured fields. The catalog error console uses the same safe report. This does not sanitize all third-party/browser console output.

No diagnostic storage, background request or telemetry is introduced. Reports describe the current error; they are not a cross-context history or full playback diagnostic export. Add new operations to the allowlist when adding request adapters; unknown URLs produce operation=unknown.

## Recovery policy

| Failure | Behavior |
|---|---|
| Legacy HTTP 429 or other non-success status | Reject immediately with status; do not reconnect/replay or clear session data |
| Legacy malformed successful-HTTP response or reconnect envelope | Retain the existing single vk.ru reconnect and retry, unless the adapter disables replay; reject a repeated malformed/reconnect result |
| Legacy stalled fetch/body/reconnect | One 15-second budget for the complete operation, including the retry; late completion cannot dispatch another request |
| Token HTTP 401 or VK error 5 | Existing single shared token refresh and retry; a second auth failure rejects |
| Network, format, rate limit, HTTP 5xx or timeout | Preserve credentials, queue and settings; offer a relevant hint and explicit UI recovery |
| Confirmed unauthorized verification | Existing background-owner logout cleanup; never infer logout from HTML, malformed JSON or a token-endpoint HTTP failure |

The catalog reload button itself neither clears Chrome storage nor commands playback; ordinary startup session verification still applies. Session verification retains its explicit retry. Neither action replays a failed mutation automatically. Initial-query retry budgets retain their existing policies; the immediate HTTP rejection above is at the transport boundary. Add/delete/restore/follow legacy mutations continue to disable reconnect replay. Other legacy adapters retain their existing default and require an adapter-specific review before changing retry semantics. A timeout does not prove that an already-issued mutation was not applied.

An HTML Content-Type is evidence of a webpage response, not proof of a login page, CAPTCHA or expired session. The hint asks the user to check vk.ru. It does not open a sign-in modal or wipe credentials automatically. JSON returned with a legacy text/html header still parses normally.

## Investigating feedback

1. Identify the manifest version and frontend asset. A stack alone cannot reliably identify a release.
2. Check operation, stage and attempt. Distinguish method failure, token acquisition, profile verification, reconnect, storage and session transport.
3. Check kind/status/code and Content-Type category. Do not request cookies, tokens or full network response exports from users.
4. Ask which action failed and whether music works on vk.ru in the same browser profile when the report is inconclusive.

[Request regressions](../../tests/common/request-diagnostics.test.ts) cover repeated HTML, HTTP failures, no-replay mutations, the shared legacy deadline, cancellation and safe session replies. [Description tests](../../packages/common/src/error-diagnostics.test.ts) cover allowlists and nested-secret exclusion. [UI tests](../../tests/front/error-report.test.ts) cover build identity, copyable reports, safe console output and render fallback. Browser evidence and limitations belong in [testing](testing.md).
