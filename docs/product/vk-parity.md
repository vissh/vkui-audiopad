# VK Music behavior reference

VK Audiopad largely reproduces the vk.ru music section. Treat the current website as a reference for user-visible action semantics, resulting state, cancellation/restoration and failure feedback. Implement those semantics with VKUI and the extension's runtime ownership; copying site classes or its internal architecture is unnecessary.

A similar icon is not evidence of matching behavior. For each changed function compare: starting state -> action -> request -> confirmed result -> subsequent navigation/reload. Record intentional extension-specific differences, such as popup closure and background playback, rather than accidentally inheriting a UI lifetime rule. Existing accepted contracts take precedence until a before/after decision is made.

## Comparison procedure

1. Use the authenticated MCP browser, inspect the website action and relevant requests/responses, then compare the actual extension flow. Hover controls before clicking and verify the resulting state; a tool's click acknowledgement is insufficient.
2. Keep only endpoint, method, field names, response shape and identity comparisons. Never persist live tokens, cookies, hashes, signed URLs or complete personal responses. Synthetic fixtures retain format, not user data.
3. Add controlled regressions for failed/late/duplicate responses. Website success does not test extension error handling.
4. Check restoration and final library/queue state after mutation tests. Use test tracks when available and report intentional remaining changes. The current user session authorizes adding/removing tracks for these checks; this is not blanket authorization for future users.
5. Record browser, build identity, observed behavior and gaps in testing.md. A historical observation is not a permanent VK API guarantee. Keep CI tests independent of real VK/accounts.

## Current comparison matrix

| Function | Website/extension evidence | Remaining work |
|---|---|---|
| Delete and restore a library track | November 4, 2026: both live round trips; muted retained row, enabled plus, explicit restoration. [ADR 0006](../decisions/0006-library-delete-restore.md). | Broader account/source/version matrix; cache invalidation across windows |
| Play/pause, next/previous, queue, Mix | Authenticated extension smoke and offline races exist in [testing](../ai/testing.md). | Systematic side-by-side website comparison, real HLS/Firefox and isolated SW restart |
| Add track and undo a new addition | November 4: website add/delete and extension token add/delete; returned owned ID used for deletion, visible metadata retained | Duplicate-library semantics, cross-window invalidation and wider source matrix |
| Search, catalog, artist and show-all pages | Catalog token formats investigated on live website; extension pages checked | Input cancellation, cache identity and pagination parity (T10) |
| Shuffle, repeat, seek and volume | Queue tests and scoped extension smoke | Website boundary/keyboard comparison, explicit accepted end-of-queue behavior |
| Playlist follow/unfollow | November 4: website token follow/deletePlaylist and extension legacy toggle round trips; keyboard activation/focus verified | Cross-window invalidation, wider source/error matrix |
| Similar tracks, broadcast | Existing features | Paired request/result/error observations and regressions |
| Show lyrics | November 4: website PREY FOR ME/3 has lyrics; Δnthem Of Haze does not. Legacy flag and token has_lyrics checked; audio.getLyrics format verified at 5.246/5.289. | Wider catalog/language/source matrix; synchronized lyrics are outside this reader |
| Themes, dialogs, empty/pending/error states | Scoped screenshots/modal observations | Keyboard/a11y and stable local-data browser baselines (T14/T17) |

## Lyrics observation: November 4, 2026

On Home, selecting PREY FOR ME/3 exposes “Показать текст”. Opening it sends POST audio.getLyrics with audio_id (owner/audio ID plus optional access key) and access_token. The website uses API 5.289; read-only probes confirmed the same response shape at the extension's 5.246 on api.vk.ru and web.api.vk.ru. response.lyrics.text is an array of plain strings, including empty lines; response also contains md5/credits. The observed song returned 101 lines. No lyric content or live credentials are retained here.

The website's reloaded legacy tuples distinguish PREY FOR ME/3 (lyrics marker 1, HAS_LYRICS set) from Δnthem Of Haze (marker 0, HAS_LYRICS clear). Token audio.getById also reports has_lyrics=true for the first track. A lyrics read for the second returned VK error 104. The extension avoids that read when availability is absent; a stale positive flag can still lead to its unavailable state. Other errors remain failures. Token conversion now retains the advertised availability instead of discarding it.

A same-day follow-up with Daft Punk's One More Time (Radio Edit) found a second valid response: lyrics.timestamps contains 90 objects with numeric begin/end, with no lyrics.text. Of these, 87 have a string line and three are interlude=true markers without a line. The original reader incorrectly rejected this successful response as a format failure. It now reads each line in returned order and maps explicit interludes to blank lines, preserving repeats/stanzas, and still renders a static reader. Text arrays take precedence if both forms exist. Empty arrays yield unavailable text; malformed lines remain format failures. The action now uses Icon24TextTtOutline to match the website's text icon.

The extension intentionally uses a dedicated scrollable VKUI text reader rather than the website's player inside its lyrics modal. It preserves stanza breaks, supports selection, and has no seek/autoscroll/synchronized highlight behavior. Text loading is local UI work; background playback ownership is unchanged. Track/account changes close the reader and retire unfinished results. [Product behavior](behavior.md#track-lyrics) owns the user contract; [API regressions](../../tests/common/audio-lyrics.test.ts) and [actual Player DOM tests](../../tests/front/lyrics.test.ts) cover controlled outcomes. Browser evidence is recorded in testing.md.

## Delete/restore observation: November 4, 2026

On the website, POST web.api.vk.ru/method/audio.delete?v=5.289&client_id=6287487 sends audio_id, owner_id, access_key, group_id and access_token. Its response.audio_ids contains deleted composite IDs. The tested owner was the library owner, not the negative canonical release owner. Deletion retains the row, dims metadata (observed opacity 0.52), replaces row actions/duration with the plus “Восстановить аудиозапись” and announces deletion from “Мои треки” with duplicates.

Restoration sends POST audio.restore with audio_id, owner_id and access_token. The response is an audio object whose owner/id match the request. The row becomes normal again. Restoration remained present after a normal website reload. These observations do not establish duplicate restoration semantics for every collection.

The extension's tested catalog track used legacy al_audio.php delete_audio and restore_audio. Both returned HTTP 200 with payload[0]=0 and array payload[1] (observed lengths 2 and 1 respectively). Its muted row/plus matched the website interaction; the queue was retained during restoration. Source-specific adapters remain intentional; a token-source track now restores through audio.restore instead of a hash-based legacy request.

A paired request against the extension's API 5.246 accepted both the historical client_id=5.163 and client_id=6287487: each deleted the target and restoration succeeded. The shared app ID is retained for consistency with the website/token acquisition, not because this run proved the old parameter caused failure. At 5.246 the observed delete response was numeric 1, while the website's 5.289 response contained audio_ids. Both formats need coverage.

## Add/follow observation: November 4, 2026

The website added a search track with POST web.api.vk.ru/method/audio.add (5.289). Fields: audio_id, owner_id, access_key, track_code, group_id, access_token. Success returned response.items_count, errors_count, items and errors; an item contained new_audio_id, new_owner_id and audio_raw_id. The plus became a check/delete action. Deleting that just-added copy returned directly to Add, without the muted restoration row used for existing library items. The test addition was removed.

The extension's token add uses API 5.246. The player retained title/artist after success and deletion sent exactly the returned new owner/audio ID. Music stayed paused. Token additions now validate exactly one successful item and reject reported partial errors. The returned owned copy preserves visible metadata while clearing source-specific hashes/URL/access key. Legacy add requires a successful HTTP/envelope response and a valid owned ID; ambiguous completion is not replayed.

Website playlist follow used POST audio.followPlaylist with playlist_id, owner_id, access_key, ref and access_token. One request returned error 5; the website refreshed authentication and its next attempt succeeded with a response object containing playlist_id and owner_id. Unfollow used POST audio.deletePlaylist with playlist_id, owner_id, access_token and returned response=1. The subscription was removed afterward.

The extension intentionally uses al_audio.php?act=follow_playlist instead: successful HTTP/envelope plus explicit boolean or numeric 0/1 is_followed are required. Missing state is a failure, not an unfollow result. No ambiguous legacy replay. State keys include account, owner and playlist ID; pending duplicate cards share a guard. Named VKUI buttons support Enter/Space and retain the initiating button's focus while busy. Errors show safe feedback and do not fabricate success. These in-memory overrides are not a complete cross-window cache/session-epoch policy.
