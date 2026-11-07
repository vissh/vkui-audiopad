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

The legacy Home request remains the source for its existing track/catalog blocks. An independent, account-scoped read through common's getAudioCatalog requests catalog.getAudio with owner_id, the general-page url, extended=1 and need_blocks=1. An empty root-section pointer is resolved once through catalog.getSection. Its extra blocks render after Home's first track block; duplicate legacy IDs/titles are omitted. Errors retain the legacy content and offer explicit retry. “Ещё подборки” follows the section's opaque next_from through getSection/start_from, stopping a repeated cursor.

The token parser resolves references from playlists_ids, audios_ids and links_ids against their root packages. It preserves server titles/order, including personalized recommendation titles; it does not create fixed genre/mood lists or hard-code a particular song. Supported additions include links, open_section/open_url actions, music_recommended_playlists and music_exclusive_slider playlist layouts. Separate header blocks contribute titles to the following block. Unsupported types are skipped; malformed roots fail safely. Category destinations remain inside supported VK catalog routes; unrelated/executable URLs are rejected.

Internal /music/catalog/<token> navigation now reads token sections and carries their source/cursor through pagination. Existing search/artist/audio-block link routes retain their legacy flow. Playlist images use photo or up to four thumbs; image metadata remains optional and never becomes a query key.

Schema references include the public [MusiMuX response reference](https://github.com/MuXolotl/MusiMuX/blob/main/docs/RESPONSE.md) and [Fenrir block model](https://github.com/umerov1999/Fenrir-for-VK/blob/main/app_fenrir/src/main/kotlin/dev/ragnarok/fenrir/api/model/catalog_v2_audio/VKApiCatalogV2Block.kt). MusiMuX documents a different API version, while this project retains 5.246. Validate compatibility with current authenticated responses using the [catalog acceptance scenarios](testing.md#home-tiles-and-playlist-covers-november-7-2026).

## Add a VK data feature

1. Identify its source on live vk.ru, usually batch.call or al_audio.php.
2. Prefer an existing legacy endpoint where appropriate, then token API through vkApiClient.request. Add shared fields/methods to common, not a parallel client in front.
3. Extend common clients/types -> front page/feature with its query fetcher and UI state. Follow the installed FSD skill for structure.
4. Run check and relevant format tests, full build and verify:build. Load the built extension in a dedicated browser profile according to [testing](testing.md), reproduce the scenario and compare console categories with the narrow baseline.
5. Verify real format assumptions before changing fragile parsing. Preserve legacy FormData/encoding; a refactor requires fixture and behavioral evidence.
