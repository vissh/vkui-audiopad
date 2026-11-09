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

## Track rendering

TrackCell keeps loaded track text and playback controls in the DOM. Normal rows use layout/style containment while keeping all loaded playback controls discoverable in the accessibility tree. The queue editor disables containment to retain native drag geometry.

Action subtrees prepare within a 300 px viewport margin after 150 ms of continuous proximity. The callback-only useOnInView hook avoids React commits as rows pass through the margin. Leaving cancels preparation. Pointer entry/down and focus prepare synchronously, and prepared actions stay mounted to preserve dialog triggers, pending operations and local add/delete state. Removed rows, editable rows and environments without IntersectionObserver prepare eagerly. Ref and timer cleanup follow row teardown.

Compare a fresh long queue, rapid first-pass scrolling and a warm second pass. Verify the accessibility snapshot includes the final loaded track before it has been scrolled into view. Verify keyboard focus on an initially unprepared row, retained action state, editor apply/cancel, restore controls and the actual contained action popup. The [controlled regressions](../../tests/front/deferred-track-actions.test.ts) exercise scheduling and teardown. The [dated benchmark](testing.md#deferred-track-actions-and-scroll-november-9-2026) separates synthetic rendering results from authenticated catalog latency.

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
- Home normally uses one token-catalog read. A pointer-only root needs getSection, and the legacy HTML fallback starts after an initial token failure. Catalog continuations remain viewport-driven.
- A focused hidden arrow, stale tooltip or hover appearance can be a focus/modality defect even when playback and mutation requests succeed.

The [browser testing guide](testing.md#accessibility-and-collage-checks-november-8-2026) and [historical profiling comparison](testing.md#startup-and-interaction-performance-november-8-2026) provide checkpoints and evidence limits.
