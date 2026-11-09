# Working with vk.ru data

Practical integration knowledge from the November 2026 catalog fixes. Read this before implementing a new VK data feature. See [architecture](architecture.md) for extension contexts and [testing](testing.md) for live validation.

## Two API families

| | Legacy al_audio.php on vk.ru | Token /method/* on api.vk.ru / web.api.vk.ru |
|---|---|---|
| Authentication | Session cookies (remixsid), no token | access_token obtained through login.vk.ru/?act=web_token |
| Client | vkClient.request, FormData and windows-1251 decoding | vkApiClient.request, safe typed failures, Chrome token cache and one auth refresh |
| Response | Comment-prefixed payload; [1][0] HTML CatalogBlock markup, [1][1] JSON blockIds/playlists/sectionId/nextFrom | JSON response.catalog.sections[].blocks[], audios_ids, next_from |
| Use | When a suitable legacy action exists | When legacy lacks the needed action, such as artist/subpage resolution |

Legacy endpoints can still return old formats after the website moves to another request flow. Known actions include section (search uses section=search, q, owner_id) and load_catalog_section (section_id, start_from).

Token methods:

- catalog.getAudioArtist: artist/subpage data selected with url.
- catalog.getAudio: music-page blocks from /audios<id>?section=<name>&block=<block>, including Home/Explore/My music.
- catalog.getSection: /music/catalog/* pages, called by the website through batch.call.

The common pattern is page url + need_blocks=1 -> response.catalog.sections[0].id. The api.vk.ru/web.api.vk.ru hosts worked interchangeably in the investigated flows; app ID is VK_APP_ID (6287487) from vk-api-client.ts. These are observations about a changing upstream, not permanent guarantees.

Tokens are obtained from cookies through POST login.vk.ru/?act=web_token with version=1&app_id=6287487, returning data.access_token/expires/user_id. The background session owner uses the existing raw client, coordinates refresh and persists credentials. Pages use the common session client; do not create another token writer.

Token methods follow [ADR 0008](../decisions/0008-vk-api-errors.md): errors reject, one 15-second budget, at most one HTTP 401/error-5 refresh/retry, no GET body and no blind replay on network/429/5xx/format/timeout. Validate each mutation's successful payload too. [ADR 0009](../decisions/0009-session-owner.md) owns shared refresh and token-method session epochs; legacy/account-wide isolation remains separate work.

## Opaque catalog tokens

Catalog section tokens use an opaque alphabet such as PUl... and [\w-]+. The token is section_id for both API families. Server HTML for /music/catalog/* and /artist/* is a SPA shell and no longer contains sectionId.

The implemented catalogLink/getArtistCatalogSectionId flow:

1. Resolve the token from the appropriate source:
   - /audio?section=...&type=<token> or /music/catalog/<token> -> catalogLink.sectionIdFromShowAllLink.
   - /artist/<id> and /releases, /featuring_releases, /top_audios -> vkApiClient.getArtistCatalogSectionId(artistId, pageUrl?), backed by catalog.getAudioArtist. url selects the subpage; omitted url selects the main artist section.
   - /audios<id>?section=<name>&block=<block> -> catalogLink.parseAudioSectionShowAllLink and vkApiClient.getAudioCatalogSectionId(url), backed by catalog.getAudio.
   - pages/albums/api/fetchers.ts resolveSectionId dispatches the supported forms.
2. Pass section_id to al_audio.php?act=load_catalog_section.
3. Keep the existing getCatalogBlocks parsing/rendering downstream.

| Source | Observed show-all link | Location/handling |
|---|---|---|
| Search AJAX section=search | /audio?section=recoms_block&type=<token> | HTML payload [1][0], audio_page_block__show_all_link |
| Home/My music/Explore AJAX section=general/all/explore | /audios<id>?section=<name>&block=<block>, e.g. editors_choice/stay_on_trend/new_albums | Same HTML; resolve the token with catalog.getAudio using url |
| Live vkit DOM | /music/catalog/<token> | Not currently scraped by the extension, but a valid token source |
| Artist page | /artist/<id>/{releases,featuring_releases,top_audios,videos,related} | Resolve through API; URL alone contains no token |
| Unrelated advertising/onboarding link | https://vk.com/audio?popup=... | Not a catalog link; parser returns null and the caller fails explicitly |

Blocks are personalized. A block such as «VK Акустика» is not present for everyone. Parse link formats, not names from one account; measure coverage by classifying all show-all links from relevant responses rather than clicking every block.

## Live DOM and legacy response HTML differ

Chrome checks inline event attributes even while DOMParser parses a detached document under the extension CSP. The shared parseFromString adapter neutralizes these attribute names before parsing legacy markup, retaining ordinary quoted attributes, style URLs and text. These records are used for extraction. The extension CSP remains unchanged.

The website renders SPA vkit-* components. Legacy audio_page_block__show_all_link/CatalogBlock__title classes are absent from its live DOM but still appear inside al_audio.php response HTML. Their absence on the website is not evidence that extension parsing is wrong. Parse legacy AJAX responses rather than replacing the parser with live-DOM scraping.

## Investigate an upstream change

1. Check login through window.vk.id or #top_profile_link. document.cookie cannot establish the presence of HttpOnly remixsid.
2. Account for SPA lazy loading: catalog XHR may require the active foreground tab. A hard navigation to an artist can give SSR without XHR; try the music page then an artist link for a SPA transition.
3. Inspect relevant xhr/fetch requests with list_network_requests, then batch.call subcalls or al_audio.php. Catalog responses can be 0.5-1.2 MB: inspect structure/counts, not complete dumps. Network request tools may expose sensitive headers; return only the fields needed and never persist live credentials/payloads.
4. Probe read-only endpoints with evaluate_script fetch from vk.ru using credentials: include; obtain token API credentials through the existing session flow. Escaped JSON and script argument escaping can make regex extraction fragile; use structured parsing/indexOf where appropriate.
5. Compare what the extension receives: getCatalogBlocks/parse-html-block.ts, then the corresponding response shape. Live DOM classes are a different representation.
6. For show-all parsers, cover search/general/all/explore responses and artist links. Classify all forms. The original catalog fix covered search first and missed Explore/artist variants.

Do not copy tokens, action hashes or signed media URLs into reports/fixtures. [Fixture rules](fixtures.md) explain how to preserve format evidence without personal data.

## Home catalog tiles

The common getAudioCatalog adapter accepts general, all, explore and radiostations. CatalogFeed uses the corresponding token section as its ordering source while retaining compatible legacy track data. Header blocks carry open_section actions for the following block's show-all destination. Separator headers do not create content groups. Root pointers resolve through catalog.getSection, and continuations preserve section_id/start_from with repeated-cursor guards.

Artist Mix actions provide images for their background and foreground_images for a separate portrait. Both layers must be retained. Artist actions also carry entity_id separately from mix_id=artist_mix. Preserve it as mixEntityId and send entity_id on every audio.getStreamMixAudios request for that source. The native track Mix action sends mix_id=track_mix and entity_id=<owner_id>_<audio_id>, independently of the ordinary similar-tracks catalog. Current categories use play_vk_mix actions with mix_id/mix_options. They are playback actions. Although catalogs name the field mix_options, audio.getStreamMixAudios expects it as options, including for subsequent tracks. Genres currently use mix_id=common and a JSON additionals array, while moods use vibes. audio.getStreamMixSettings returns response.settings with title/subtitle, mix_categories (id/title/type/options) and multi_select. Each option supplies id/title/selected. The native dialog permits one option per category, with multi_select enabling independent categories. Apply requests audio.getStreamMixAudios with the selected arrays and a generated numeric id; it is not a separate settings mutation. Preserve a genre/activity additionals array when applying the visible settings; Reset clears it too. JSON animation icon URLs are not raster avatars. Current listening recommendations combine playlists with a recommended_playlists package whose percentage is fractional, whose cover is independent of the ordinary playlist photo and can be a gradient. Its audios provide previews. Full album grids use the ordinary photo/collage. Friends and community libraries use links to /audios<ownerId>, including negative community IDs. Curator links use /music/curator/<slug> and require catalog.getAudioCurator with curator_id, url, need_blocks and extended. Passing these URLs to catalog.getAudio can return Home instead. Promotional catalog_banners carry click_action.action plus text/subtext, rather than necessarily supplying buttons. Radio uses data_type=radiostations with radio_stations_ids and root radio_stations records, including direct stream_url and is_followed. Artist pages use catalog.getAudioArtist with the complete token catalog to retain related-artist groups. Root /artist/<domain> links open internal artist pages. Unsupported destinations remain filtered by HTTPS and VK origin checks.

Native playlist checks on November 8 used existing one-, two-, three- and four-cover examples. `photo` repeated the first entry of `thumbs` even when more tiles were available. Prefer valid `thumbs`, retain server order and duplicates, and fall back to `photo` only when no usable tiles exist. Two tiles are vertical halves, three are one full-height left tile plus two right tiles, and four fill the left column before the right column. These covers use existing playlist metadata.

Playlist credits resolve original.owner_id for followed copies, then profiles or groups. Release main_artists retain their artist labels. Request extended=1 and fields=photo_50,photo_100 on catalog/library reads to obtain user avatars. The native cover hover shows count beside the articles icon and plays beside headphones. Queue-save drafts can resolve missing metadata through audio.getById with audios in batches of at most 100 while retaining their captured IDs and access keys.

The native playlist editor uses audio.createPlaylist/audio.editPlaylist with owner_id, title, description, no_discover and audio_ids. Creation prepends its initial tracks. Editing preserves the provided order. audio.get supplies paginated editor tracks, and audio.getPlaylistById establishes editable ownership and current metadata. Followed playlists can use the current user's owner_id but retain original, while albums can use the string type album. Ownership alone cannot establish editability. audio.followPlaylist returns the new library copy through owner_id/playlist_id. Unfollowing uses audio.deletePlaylist with that copy identity. A canonical source owner/id receives error 15. Preserve the returned identity or resolve original from audio.getPlaylists before removal.

The cover flow uses photos.getAudioPlaylistCoverUploadServer, an HTTPS pu.vk.ru multipart upload, photos.saveAudioPlaylistCover with response_json, and audio.setPlaylistCoverPhoto with playlist_owner_id, playlist_id, hash and serialized photo. Cover APIs retain the website's observed version 5.255 independently of the existing catalog version. audio.deletePlaylistCoverPhoto removes an attached cover. The staged upload is bound to its session identity and stores no token/hash in persistent extension data. API request expectedIdentity guards prevent an old staged payload being saved under a later epoch.

Keep fixtures synthetic. The [parity follow-up](testing.md#catalog-and-playlist-parity-follow-up-november-7-2026) distinguishes current authenticated observations, controlled failure coverage and unfinished browser checks.

## Add a VK data feature

1. Identify its source on live vk.ru, usually batch.call or al_audio.php.
2. Prefer an existing legacy endpoint where appropriate, then token API through vkApiClient.request. Add shared fields/methods to common, not a parallel client in front.
3. Extend common clients/types -> front page/feature with its query fetcher and UI state. Follow the installed FSD skill for structure.
4. Run check and relevant format tests, full build and verify:build. Load the built extension in a dedicated browser profile according to [testing](testing.md), reproduce the scenario and compare console categories with the narrow baseline.
5. Verify real format assumptions before changing fragile parsing. Preserve legacy FormData/encoding; a refactor requires fixture and behavioral evidence.
