# Test data and fixture maintenance

Current suites use inline synthetic data and controlled helpers under tests/. There is no complete versioned VK-response corpus or local media/browser test mode yet; those remain T14. This guide defines how to extend existing coverage without depending on a personal account.

## Choose the smallest useful evidence

| Change | Useful data/check |
|---|---|
| Pure parser/converter | Minimal valid source shape, missing fields and malformed alternatives |
| Legacy VK decoding | Representative raw encoding/comment-prefixed payload and the expected decoded structure |
| Token client/error handling | Synthetic success, VK error, HTTP failure, refresh/cancellation ordering |
| Playback/queue | Synthetic TrackItem/playlist/ID tuples with controlled fetch/media behavior |
| Pagination | Distinct pages/cursors, repeated cursor, delayed response and failure |
| UI | Minimal domain data with long text, empty/loading/error states and keyboard interactions |

Keep a fixture beside its test when there is one consumer. Extract a shared fixture only when multiple scenarios need the same meaningful data. A fake successful API response must not erase an upstream failure path that the test is supposed to catch.

## Construct and sanitize

Prefer constructed data that matches the observed format over copying a live response. If a real shape is needed to investigate a parser change:

1. Record the API family/action, relevant format, observation date and why the fixture exists.
2. Reduce it to fields/markup needed to reproduce the failure. Preserve structural relationships, encoding and escaping relevant to parsing.
3. Replace cookies, access tokens, logout/action/access hashes, signed URL/query parameters, user/profile identifiers and personal catalog text with synthetic values. Check nested JSON and embedded HTML too.
4. Use reserved example domains for URLs; provide a controlled fetch adapter. No real fixture URL should cause a network request during a test.
5. Add a meaningful expected result and failure variants. Verify the fixture catches the old defect, not only that the new code accepts its own output.

Do not save a raw browser storage dump, full network response or trace containing credentials as an intermediate repository artifact. A filename containing "sanitized" is not proof that its content was reviewed.

## Controlled async scenarios

Use the existing fetch/deferred/Chrome/Audio helpers described in [testing](testing.md#automated-tests-without-vk). Explicitly complete requests/events and advance fake clocks. For cancellation, include an adapter that can return late so ownership checks are verified independently of fetch abort behavior.

TrackItem and AudioTuple are not automatically safe test-log payloads: they can carry access data. Synthetic secrets may be used to test future redaction, but label them and never substitute real credentials.

Do not infer browser decoding, extension permissions, runtime event lifetime or CORS from the unit harness. T14 needs local short media assets and a test-only source adapter; such assets must have a suitable license/provenance and run without private VK sessions. Production must not acquire hidden debug behavior/permissions to accommodate tests.

## Update a fixture

Confirm an upstream format change rather than rewriting expectations to hide an implementation regression. Preserve the old format when it still needs compatibility, add the new shape, and explain the contract change in the same PR. Keep expected output independent of the parser under test. Run focused tests during development, then the required task checks from [the workflow](agent-workflow.md).
