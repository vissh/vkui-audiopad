# ADR 0006: library deletion, restoration and queue lifetime

Status: accepted. Popup-close behavior was explicitly selected by the user. Current VK website observations inform the UI and request shapes; VKUI remains the implementation library.

## Boundaries

A library deletion changes VK immediately after a confirmed successful request. DELETE_TRACK is a separate command: it only removes an ID from the local playback queue, and does not call VK or stop the current Audio source. These operations must not be confused.

For an existing owned track, show a muted row and an enabled plus button after successful deletion, matching the music website's restore interaction. Keep its queue entry during this restore window. Successful restoration cancels pending queue removal. Leaving the page expires the window and sends one local removal per remaining ID; repeating cleanup sends nothing. Returning to a retained page does not revive its expired restore controls.

Closing/reloading the popup ends its in-memory restore window, leaves the queue unchanged and does not undo the VK deletion. Do not send unreliable async unload commands or pretend this state is durable. Direct deletion of a just-added track has no restore control and sends local queue removal after VK success.

## Async behavior

A delete carries its original restore-window generation. If its success arrives after navigation, remove its queue entry immediately instead of registering an undo in the new page. While a restoration request runs, temporarily take the entry out of pending cleanup. Success cancels removal; failure re-registers it in the original window, or removes it immediately if that window has ended. There is no automatic retry after an ambiguous mutation response.

Capture that generation at delete dispatch, even when a retained row has survived earlier navigation without rerendering. The registry publishes generation changes through an atom. Pending restore rows subscribe to its value through useRestoreWindow, allowing memoized rows to expire immediately after navigation. Rows without pending restoration observe a stable null snapshot. [Render-isolation regressions](../../tests/front/render-isolation.test.ts) cover both ordinary and late delete completion after earlier navigation.

Named native VKUI IconButtons replace clickable SVG controls. Delete/restore buttons disable duplicate requests until completion, stop click propagation and show safe failure feedback. Only a verified VK success changes the row. Muted deleted metadata does not disable its restore button. Focus reveals the row controls for keyboard users.

## VK requests and confirmation

Preserve source-specific API families:

- Legacy tracks: FormData delete_audio/restore_audio through vkClient, with existing IDs/action hashes and windows-1251 decoding. Require successful HTTP and a successful legacy payload envelope; disable the reconnect/replay path for these mutations.
- Token tracks: audio.delete/audio.restore through vkApiClient, with client_id=VK_APP_ID (not API_VERSION). Delete sends access_key. Accept historical response=1 or a returned audio_ids array containing the deleted composite ID; restoration must return an audio object with the requested owner/id. Errors and unrelated/missing IDs cannot look successful.

The live website currently uses web.api.vk.ru and API 5.289; the extension retains its existing host/version rather than globally migrating unrelated endpoints. Shape evidence and the test matrix live in [VK parity](../product/vk-parity.md).

## Limits and evidence

The window registry is UI memory, not a cross-popup/session transaction. Queue message delivery has a safe catch, but no applied-result acknowledgement or durable retry (T12/T11). A lost receiver can leave a queue entry behind. Personal query-cache invalidation and other windows are T09/T10. General mutation error/refresh bounds remain T09; a network timeout cannot prove whether VK applied a mutation.

[Model/API regressions](../../tests/front/library-delete.test.ts) cover cleanup, restoration/navigation ordering, response identity and no legacy replay. [Actual track controls](../../tests/front/library-controls.test.ts) exercise success/failure, duplicate clicks, late completion, row restoration and UI closure. [Legacy response validation](../../tests/common/legacy-mutation.test.ts) checks malformed/error envelopes without payload leaks. Live website and extension round trips are recorded in [testing](../ai/testing.md).
