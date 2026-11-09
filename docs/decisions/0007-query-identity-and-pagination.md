# ADR 0007: account-scoped query caches and guarded pagination

Status: accepted for frontend query identity and page application. Broader session/token ownership and runtime persistence remain T09/T11/T12.

## Problem

General, Explore and My music previously shared keys across accounts. Playlist keys omitted owner/context, so equal IDs could display another owner's playlist. Album pagination could apply a late result to the hook's latest link. Page handlers mutated cached/result arrays in place and appended duplicates. A cleared cache could be repopulated by a late mutation.

## Decision

App's SessionQueryProvider mounts a fresh QueryClient and child tree for each stored userId. On retirement it cancels queries and clears the old query/mutation caches. Returning to an earlier account starts a new client. Storage/media ownership is unchanged; remounting UI is not a playback command.

Keep key factories by their page owner. Personal queries include userId. Playlist queries also include ownerId, id, blockId and fromId; album catalog keys include the actual show-all link. Do not put access tokens, action/access hashes or signed media URLs in keys. Artist/search keys already include their user/input and retain that identity.

Token catalog sections, the Home/My music legacy queries and owned/library playlist queries share a 30-second staleTime. Quick activation reuses fresh successful data. Activation after expiry refreshes with cached content retained. Explicit mutation invalidation bypasses freshness and marks inactive queries for their next activation. A new popup/account still creates a fresh client. [Catalog regressions](../../tests/front/home-catalog.test.ts) cover quick return, inactive invalidation and expired-data refresh.

Pagination variables capture the original account, source and request cursor. onSuccess derives its key from those variables, not the hook's latest render. Apply only if the cached source/section and cursor still match. Playlist response ownership must also match. A missing/retired cache is not recreated; an obsolete result leaves the newer snapshot intact.

Build a new result without mutating cached or response arrays. Merge tracks by composite track ID, albums by owner/id, catalog blocks by blockId. Repeated IDs retain their original position and receive updated metadata. Repeated track blocks combine only when their playlist ownership matches. The single-album-block view retains its existing continuation behavior even if a page uses a new container block ID.

The shared InfinityContent controls attempts, not cache writes: only an active list can request data; one automatic attempt per scope/cursor; no replay after errors or repeated/cyclic cursors; explicit retry preserves rows. Pagination reads use networkMode=always/retry=false so offline attempts fail visibly instead of suspending for reconnect. Initial queries retain their existing bounded retries/reconnect behavior.

Initial legacy query fetchers receive the query AbortSignal. Artist/album token-resolution helpers can still finish before reaching a cancellation check; logical query retirement and source guards protect adoption. Do not claim all upstream work has stopped simply because a query was cancelled.

## Limits

A query-client boundary isolates rendered caches, not browser cookies. [ADR 0009](0009-session-owner.md) separately centralizes shared token storage and checks session epochs in token methods. Neither boundary rolls back VK mutations, stops every old legacy/SW request, resets all module-level atoms or implements cross-window cache invalidation. Those remain T09/T11/T12. Library actions are not yet propagated to every cached catalog in every window. Access/permission changes within the same userId also need an explicit invalidation policy.

A mounted list's attempt history is transient; remount starts it again. Cursor/source guards are not a durable server snapshot or pagination guarantee. General initial-query error UI/manual retry, broader live source combinations and Firefox remain separate validation work.

## Evidence

[Query identity](../../tests/front/query-identity.test.ts) first reproduced cross-account and cross-owner cache reuse, then covers original variables, frozen arrays, obsolete cursors and retired-cache completion. [Session client](../../tests/front/query-session.test.ts) cancels/clears an old account and rejects a late adapter result even when it ignores abort. [Merge rules](../../tests/front/page-merge.test.ts) cover ownership, duplicates, metadata and immutable inputs. [Pagination](../../tests/front/pagination.test.ts) covers bounded attempts and actual offline mutation settings. Scoped live observations are recorded separately in [testing](../ai/testing.md).
