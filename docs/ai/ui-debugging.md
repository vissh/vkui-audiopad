# UI debugging and profiling

Use this workflow for popup startup, tab mounting, catalogs, scroll loading, hover/focus, dialogs and render-performance changes. [Product behavior](../product/behavior.md) owns expected results. [Testing](testing.md) owns dated observations and the offline harness. [MCP setup](mcp.md) owns shared server configuration.

## React MCP setup

The front workspace pins `react-devtools-cdt-mcp` 0.1.0. Chrome DevTools MCP 1.12.0 enables `--categoryExperimentalThirdParty=true` in .mcp.json. Regenerate client settings with `npm run mcp:sync` after source changes and restart the MCP client to load the flag. React registers its tools inside the inspected page. The Chrome server discovers them. The package README under node_modules/react-devtools-cdt-mcp describes the discovery event and callable tools. [React integration](https://react.dev/reference/dev-tools/react-devtools-cdt-mcp) documents the supported setup.

Build the extension runtime and the opt-in profiling frontend from the repository root.

```bash
./build.sh
npm run verify:build
npm run build:profile
```

The profiling build writes packages/front/dist-profile. It registers the hook before React initializes, uses react-dom/profiling, retains component names and emits source maps. Normal frontend output stays in packages/front/dist. Browser distributions in dist/ retain their normal frontend. This separation prevents a later partial runtime build from copying profiling output into a release candidate. [Configuration regression](../../scripts/front-profile.test.ts) checks that boundary.

Overlay the profiling frontend onto the same permitted temporary extension stage that already contains the full runtime and browser-specific environment.json. Refresh index.html to pick up frontend changes. Installing/reloading the extension can run UPDATE and clear runtime/queue data. Reserve that operation for an explicit update scenario. A UI-only iteration uses page reload and preserves the installed runtime.

After opening the profiling page, use list_3p_developer_tools and execute_3p_developer_tool. Discover schemas from the connected server. The React group includes component search/tree, owner/source inspection, start/stop profiling, trace overview and commit reports. A running client that predates the flag can use evaluate_script to dispatch the documented devtoolstooldiscovery event and call the returned execute functions. Reloading invalidates component UIDs. Verify that tools return components and timing values before reporting a working integration.

When finished, overlay the ordinary frontend from dist/<browser>_extension back onto the stage and reload the UI. Restore CPU/network/cache/theme overrides and leave playback paused. Verify the loaded asset identity and absence of the profiling registration.

## Required comparison

For a performance-sensitive UI change, capture the affected scenarios before and after with the same browser, viewport, data size, initial route, cache state and CPU/network settings.

- Cold opening on Home, My music, Explore, Radio and Current playlist. Separate the fixed-size startup skeleton, account hydration, first usable response and later catalog data.
- Warm tab returns. Retained pages should preserve drafts and reuse fresh data while inactive pages stay hidden/inert.
- Scroll every affected vertical feed and horizontal rail. Observe IntersectionObserver callbacks, cursor progress, preview requests and friends/curator groups. Confirm document visibility when lazy loading stalls.
- Open and close the affected dialogs by pointer and keyboard. Inspect focus restoration, tooltip disappearance, row actions, duration restoration and background scroll position.
- Exercise playback updates with a representative loaded queue. Record which rows rerender after selection/time/metadata changes and whether queue drafts survive navigation.

Start React profiling before the interaction and stop it afterward. Record commit count, total/largest render durations, affected component names and the relevant commit report. Review library semantics before interpreting counters such as componentsChanged. State exactly which interaction and build were measured. Component props/hooks and raw traces can contain account data, credentials and signed media URLs. Persist aggregate counts, names and timings with sanitized observations.

Repeat the affected interaction in the normal production build using Chrome performance traces. Record paint/interaction/layout metrics, long tasks and request timing independently of React timings. Instrumentation changes execution cost. Use comparable repeated runs to substantiate speedup claims. Heap deltas require repeated controlled collection and equivalent state.

## Startup performance review

Fast startup is a product priority. A new critical-path request, an additional awaited dependency, optional enrichment made blocking, or replacement of a fast source by a slower one requires written justification, comparable production measurements and explicit user approval before implementation. Link that approval and the measurements in the PR. An unrelated feature request does not approve slower startup.

Review changes to application imports/providers, session readiness, page queries, catalog composition and initial loading conditions for added dependencies before the first useful render. Record the previous and proposed request graph and first playable track, playlist or station timing. Keep first frame/skeleton and first usable music measurements separate. Compare fresh popup documents and warm tab returns with matching profile, viewport, foreground visibility, cache and throttling settings. React recordings identify render work, while ordinary production traces and repeated first-content samples establish user-visible latency.

The normal CI suite runs [Home source-order tests](../../tests/front/home-progressive.test.ts) and [My music/Explore startup tests](../../tests/front/catalog-progressive.test.ts). They hold slower reads unresolved and assert immediate request starts, independent visible results, stable DOM/focus, account isolation, freshness, failure/retry and one continuation owner. Preserve these invariants when adding a feature. Run the affected browser comparison for request/source or render-boundary changes. Offline tests control ordering, while the dated browser evidence records actual upstream latency.

My music mounts its library with the initial feed. Check library-first, legacy-first and token-first completion. The stable library slot follows the first music group, whose skeleton reserves its space until data arrives. Token/legacy library groups must not add another library or replace its DOM. Verify the create/edit/open/play/follow controls and show-all destination after enrichment. Explore pins its first titled legacy block, skipping untitled promotional banners when a titled block is available. Normalize whitespace when checking duplicate titles, including VK's nonbreaking spaces. Keep the fast block ahead of error feedback and later groups, including after failure and retry.

## Track rendering

TrackCell keeps loaded track text and playback controls in the DOM. Normal rows use layout/style containment while keeping all loaded playback controls discoverable in the accessibility tree. The queue editor disables containment to retain native drag geometry.

Action subtrees prepare within a 300 px viewport margin after 150 ms of continuous proximity. The callback-only useOnInView hook avoids React commits as rows pass through the margin. Leaving cancels preparation. Pointer entry/down and focus prepare synchronously, and prepared actions stay mounted to preserve dialog triggers, pending operations and local add/delete state. Removed rows, editable rows and environments without IntersectionObserver prepare eagerly. Ref and timer cleanup follow row teardown.

Compare a fresh long queue, rapid first-pass scrolling and a warm second pass. Verify the accessibility snapshot includes the final loaded track before it has been scrolled into view. Verify keyboard focus on an initially unprepared row, retained action state, editor apply/cancel, restore controls and the actual contained action popup. The [controlled regressions](../../tests/front/deferred-track-actions.test.ts) exercise scheduling and teardown. The [dated benchmark](testing.md#deferred-track-actions-and-scroll-november-9-2026) separates synthetic rendering results from authenticated catalog latency.

## Home startup and system appearance

Compare fresh Home documents against release 3.3.9 at bf64ccb2c72919b8c98f6b4e7aa42d323442ab52 with the same authenticated automation profile, viewport, cache and network settings. Measure the legacy section and token catalog separately. First track insertion identifies usable music arrival, while LCP can identify the earlier static Mix hero.

The two Home reads race for the first nonempty result. Verify legacy-first and token-first completion, empty data, partial failure, retry, fresh tab returns and account retirement. A legacy-first block keeps its DOM identity, layout and focus when token metadata arrives. Scroll before the second response and observe the loader below the pinned block. Keep one token continuation owner and ensure the sentinel cannot request a continuation before the first token page. [Controlled source-order regressions](../../tests/front/home-progressive.test.ts) cover these boundaries.

Record the Mix button's computed foreground/background on animation frames from its first appearance. VKUI's automatic system-scheme hook starts unresolved. An early hero can therefore animate from the default light palette to the dark system palette. Application supplies a synchronously resolved system scheme and subscribes to later media changes. [First-commit theme regressions](../../tests/front/application-theme.test.ts) exercise this through the real ConfigProvider and preserve explicit theme selection.

## Hover and dialog diagnosis

Inspect document.activeElement, the row's :hover state, the focused target's :focus-visible state and computed action/duration visibility. Pointer-restored focus can remain in a row after its dialog closes. Track actions use explicit keyboard-focus state plus pointer hover so that mouse departure restores the duration while keyboard users retain reachable controls. Keep the restored focus target mounted.

Playlist-dialog triggers hide their tooltip on activation and suppress the immediate restored-focus tooltip. Later hover and a genuine new focus may show it again. Cover save, close, Escape, repeated opening and failure/retry with the real VKUI modal manager. [Playlist regressions](../../tests/front/server-playlists.test.ts), [row focus tests](../../tests/front/accessibility.test.ts) and [lyrics tests](../../tests/front/lyrics.test.ts) cover related transitions.

Verify that each layout/typography selector matches the current rendered DOM. Prefer local classes for application-specific styling of VKUI children. Pair a rendered CSS regression with computed-style checks in the actual browser. A declared rule alone does not establish its visible effect.

Check dark and light themes against the original for icon hover changes. Use the existing neutral VKUI icon tokens for transport controls. Inspect actual SVG colors, opacity, geometry and hover layers instead of inferring appearance from the button's text color alone. Preserve the established pointer layout during semantic/a11y changes.

## Useful failure distinctions

- Empty React tree means registration order or build selection needs checking. Missing discovery tools can mean the client needs restarting with the shared flag.
- A successful install or build leaves catalog/session/Audio behavior to be observed separately in the actual extension origin.
- Hidden browser documents can delay image loading and intersection callbacks. Verify visibility and viewport geometry before changing lazy loading.
- An index.html tab and a native action popup have different lifetime/scroll contexts. Record which one was tested.
- Home starts legacy and token reads together and preserves the first useful result. A legacy-first block stays pinned while richer groups load below it. A pointer-only token root needs getSection. Catalog continuations remain viewport-driven.
- A focused hidden arrow, stale tooltip or hover appearance can be a focus/modality defect even when playback and mutation requests succeed.

The [browser testing guide](testing.md#accessibility-and-collage-checks-november-8-2026) and [historical profiling comparison](testing.md#startup-and-interaction-performance-november-8-2026) provide checkpoints and evidence limits.
