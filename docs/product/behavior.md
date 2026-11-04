# Product and current behavior

This document describes existing VK Audiopad behavior for contributors and AI agents. It is based on code; live observations are identified separately. Planned behavior changes must be accepted and verified in their own task rather than inferred from expectations of a typical music player.

## Purpose and interface

Users open a compact player, find music in their VK catalog or search, and listen independently of the popup. The same index.html can run in an extension tab; settings show its address. VK login must happen in the browser profile where the extension is installed. Sessions from another browser or profile are not automatically shared.

| UI area | Purpose and code |
|---|---|
| Persistent player header | Active track, play/pause, next/previous, position, volume and modes. [Player](../../packages/front/src/widgets/player/ui/Player.tsx), actions under features/ |
| Home — «Главная» | Personal collections, tracks and VK Mix. [general](../../packages/front/src/pages/general) |
| My music — «Моя музыка» | Audio library, playlists and recent listening. [my-music](../../packages/front/src/pages/my-music) |
| Explore — «Обзор» | Editorial and current VK collections. [explore](../../packages/front/src/pages/explore) |
| Search — «Поиск» | Tracks, albums, playlists and lyric matches, depending on the VK response. [search-result](../../packages/front/src/pages/search-result) |
| Playlist / albums / artist | Card links, «Показать все» and artist pages. [Pages](../../packages/front/src/app/Pages.tsx) |
| Current playlist — «Текущий плейлист» | The extension's active queue and editing controls. [current-playlist](../../packages/front/src/pages/current-playlist) |
| Settings — «Настройки» | Theme, keyboard shortcuts and tab-mode information. The heart icon opens project support information. [modal](../../packages/front/src/entities/modal) |

Catalog blocks and their ordering are personalized. A collection missing from another account is not sufficient evidence of a parser defect. UI is driven by returned data, not the block list of a particular profile.

## Playback scenarios

- Choosing a track sends its ID and playlist context to the SW. The SW resolves a current media URL, prepares the queue and passes the source to the audio context. Selection/metadata may appear before actual playing; verify played, progress and media events.
- Play/pause toggles the SW-owned requested state, including during loading. Two quick toggles end paused even before the first playing event; a third resumes the cancelled selection. The header/active-album/Mix action can show pause before media starts. Resume of an already launched source preserves its position; missing media or a terminal failure causes a reload. Repeated selection of a track whose metadata has not committed still selects it rather than toggling. Closing the popup does not send pause.
- Chrome may reclaim a paused offscreen document after more than 5 minutes without media/control activity. A later play reloads that selection; it does not preserve a destroyed Audio element or its position. Concurrent play wins over unissued cleanup; an issued close finishes before a new source is sent. Firefox does not use idle document cleanup.
- Next/previous moves through the current queue, or the latest pending selection while loading. Full queue hydration is asynchronous: the number of visible cards does not determine the number of available IDs.
- Play-next inserts after the active track in the full queue and the loaded list without wrapping to the front. Queue edits do not mutate the VK library or stop a removed playing source. Shuffle preserves selection and can restore canonical order; editing moves during shuffle changes restore order, while removal applies to both orders. External queue changes cancel an open editor draft. See [queue ownership](../decisions/0004-queue-mutations.md).
- Ordinary playlists, radio and VK Mix differ through isRadio/isVkMix. Mix can request another recommendation from VK; do not treat it as an ordinary finite array.
- Missing URLs and media errors share a bounded operation budget. Terminal failure stops playback and shows a safe explanation. The exact cancellation/attempt contract belongs to [the ADR](../decisions/0001-playback-operations.md), not individual UI components.

**End-of-queue behavior needs care.** Currently onEnded replays the current track for REPEAT_ONE and otherwise calls next; getNewIndex wraps an ordinary queue from its end to its beginning. Do not assume RepeatMode.NONE stops playback at the boundary. This is derived from [on-audio-ended](../../packages/service-worker/src/actions/on-audio-ended.ts), [next](../../packages/service-worker/src/actions/next.ts) and [getNewIndex](../../packages/service-worker/src/utils.ts); natural end was not covered by the live smoke. Desired end-of-queue policy remains a [product decision](../ai/development-roadmap.md#product-decisions-before-behavior-changes).

## Track lyrics

The player shows “Показать текст” with VK's Icon24TextTtOutline only when the active track advertises lyrics. Legacy tuples retain HAS_LYRICS; token tracks map has_lyrics into the same flag. Missing availability does not trigger a speculative lyrics request. Existing stored token tracks are not backfilled; newly resolved tracks use the updated conversion.

Opening the VKUI reading dialog loads audio.getLyrics through the common token client. Both lyrics.text string arrays and lyrics.timestamps objects with a string line or an explicit interlude=true marker are supported; plain text takes precedence when both are supplied. Interludes become blank lines. Returned line order, repeated lines and stanza breaks are preserved. The dialog shows track/artist metadata and selectable plain text, without a second player or synchronized highlighting. Loading, safe failure with explicit retry, and unavailable-text states are distinct. Closing restores focus and cancels an unfinished read; changing tracks or accounts closes the dialog. Lyrics cache entries belong to the current UI/account and track ID, contain no credentials in their keys, and are not persisted. Reading/closing lyrics sends no playback commands and does not write playback/queue state; token refresh retains the shared client's existing lifetime.

Closing the lyrics reader restores focus without reopening the button's tooltip. A later hover or deliberate keyboard focus shows the tooltip normally; it remains hidden while the reader is open.

## Loading more list data

Only the visible page may automatically load the next page. Pagination reads fail visibly even when offline, instead of being suspended for automatic reconnect replay. An error stops automatic pagination and offers “Повторить” while keeping loaded rows. Within a mounted list scope, a cursor is attempted automatically once; an unchanged or cyclic cursor stops with “Список не продолжился” and explicit retry. Reopening/remounting a list starts a new local attempt history. Changing list/account scope separates cursor histories. Personal query caches are separated by stored account; playlist owner/context separates equal IDs. Page results merge immutably by ID and an obsolete cursor cannot replace a newer page. [ADR 0007](../decisions/0007-query-identity-and-pagination.md) states the limits: shared tokens, external mutations, all-catalog invalidation and some token-resolution work are outside this cache boundary.

## Library deletion and restoration

The music website is the behavioral reference; [the parity matrix](vk-parity.md) distinguishes observed functions from unchecked ones. After confirmed deletion of an owned track, retain a muted row and enabled restore plus. Successful restoration keeps the queue entry. Navigation expires restoration and removes pending IDs from the local queue; closing/reloading the popup ends restoration but leaves the queue unchanged. VK deletion is immediate and independent of that local queue lifetime. [ADR 0006](../decisions/0006-library-delete-restore.md) defines late replies, failures and direct deletion without restoration.

## Persistence and external changes

Reopening UI restores observed state from storage. Theme uses localStorage; playback, queue, selected tab and most controls use chrome.storage.local; the query cache belongs to the open UI. See [state/messages](../ai/state-and-messages.md) for the full map and recovery limitations.

Installing over the same extension path preserves settings, while the UPDATE handler removes runtime data. Account changes also clear associated data. This is current behavior, not a migration system that preserves queues; T11 covers its evolution.

Library add/delete, album follow and status broadcast actions can change external data or visible user status. Include them in live checks when they are part of the task; ordinary catalog/playback smoke does not require library mutations. Playback itself sends listening notifications to VK and can affect history and recommendations.

## Interface recovery

React render/lifecycle failures inside the application (including providers) show “Не удалось открыть плеер” with a focused “Перезагрузить интерфейс” button. The fallback uses native HTML/CSS so it does not depend on the failed VKUI/query providers. Activation reloads only the UI document; it does not clear storage, reload the extension or command playback. Background playback has its own lifetime. UI destruction ends transient restoration/edit windows under their existing contracts.

The handled error is not displayed or logged with its original message/stack; the root reports a fixed safe diagnostic. This boundary does not catch errors before React mounts, event-handler exceptions or detached Promise failures. Those need explicit handling at their owning action. Reload can encounter a persistent defect again; there is no automatic retry loop or claim that reloading repairs data.

## Current quality boundaries

Minimum browser versions are declared in [the manifest generator](../../public/manifest.js); declarations are not a verified browser matrix. Chrome and Firefox share source but have materially different runtimes. The latest live run and its unverified scenarios are recorded in [testing](../ai/testing.md#live-run-november-3-2026).

Startup reconciles a matching existing Audio source/position without autoplay; absent media leaves the player paused. Initialization failure shows a safe error and requires extension reload before commands run. Offline startup/transport tests cover these cases; live worker termination/restart evidence remains T05.

Outstanding areas include live restart verification (T05), broader offscreen/media browser validation (T06), session/VK errors (T09), schema/migrations (T11), runtime message boundaries (T12), browser e2e (T14) and accessible controls (T17). Keep a small task reproducible instead of absorbing every neighboring roadmap item; update the contract it actually changes.
