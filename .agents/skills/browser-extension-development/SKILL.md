---
name: browser-extension-development
description: Develop and debug VK Audiopad browser-extension runtime, manifest, messaging, permissions, storage and browser smoke checks across Chrome MV3 and Firefox. Use for extension-specific changes; ordinary UI layout uses the FSD skill instead.
---

# Browser extension development

Use the repository root. Read only the contracts needed for the affected boundary. This skill is project-owned; it routes to maintained documentation instead of duplicating it.

## Choose the runtime and owning contract

- Cross-context changes: [architecture](../../../docs/ai/architecture.md) and [state/messages](../../../docs/ai/state-and-messages.md). Identify the UI, orchestrator and actual Audio owner before editing.
- Playback, retries or worker recovery: [playback ADR](../../../docs/decisions/0001-playback-operations.md), then the startup/offscreen ADR linked there. Register worker listeners synchronously; do not turn observed media state into a command or rely on worker globals surviving termination.
- Storage/queue changes: [queue ADR](../../../docs/decisions/0004-queue-mutations.md) and the state guide. State what persists, who writes it, and what happens after popup closure, update, account change and worker restart. Defaults are not migrations.
- Unknown message input or new replies: cover both Chrome runtime and Firefox's same-document CustomEvent bridge. Message delivery alone does not establish an applied action. Callback/Promise choices depend on the API and supported browser versions; do not mechanically rewrite all calls.
- Manifest, permissions or resources: edit public/manifest.js and the appropriate environment file, then build both distributions. Preserve minimum-browser compatibility. Do not add permissions or web-accessible resources just to make a test harness convenient.
- VK changes: use [integration](../../../docs/ai/vkru-scraping.md) and [behavior parity](../../../docs/product/vk-parity.md). Keep credentials and personal responses out of fixtures and reports.

## Avoid Chrome-only assumptions

Chrome's orchestrator runs as an ephemeral MV3 service worker; Audio lives in an offscreen document. Firefox uses offscreen.html as its background document and loads both runtime packages there. Firefox does not implement background.service_worker; a generic instruction to always replace background pages would break this project. Select transport with offscreenDocumentSupport(), not the current isFirefox() stub. Do not add artificial keep-alives to conceal lifecycle defects.

For network changes distinguish extension-page requests, host permissions, CORS, CSP and declarativeNetRequest. They solve different problems. Do not weaken CSP, enable remote executable code or add Audio.crossOrigin to fix an uninvestigated failure; the latter breaks tested Mix CDN playback.

## Establish browser evidence

Read [MCP setup](../../../docs/ai/mcp.md) and the relevant Chrome/Firefox procedure in [testing](../../../docs/ai/testing.md). Discover tools in the current session; configuration and successful compilation do not establish connectivity. Use an isolated automation profile. Keep the staged install path stable for update tests.

For a browser change, record build identity, action, observed state, console delta and remaining gaps. Test the actual extension origin/runtime, not a localhost UI with mocked chrome APIs. A tab is not an actual action popup; reinstall/update is not isolated worker termination. Check pause/play and source identity independently of button labels. Mutation tests need confirmed results and reversal where authorized.

For races or failures, add controlled tests using tests/helpers and prove that the regression distinguishes the old behavior. Follow [the agent workflow](../../../docs/ai/agent-workflow.md) for required checks and handoff. Browser-dependent checks stay separate from the default offline unit/integration suite.

For frontend startup, scrolling or render cost, follow [UI debugging and profiling](../../../docs/ai/ui-debugging.md). Use the opt-in React MCP build and a separate normal production trace, then restore ordinary stage assets.

## External guidance

Consult these primary sources when a changed API/version needs verification:

- [Official Chrome extension skill](https://github.com/GoogleChrome/modern-web-guidance/tree/main/skills/chrome-extensions): consult relevant Chrome API/build guidance; its new-project/publishing scope does not replace repository contracts.
- [Chrome worker lifetime](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [Chrome offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
- [MDN background compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
- [Mozilla Firefox DevTools MCP](https://github.com/mozilla/firefox-devtools-mcp)

Community extension skills are useful research inputs, not project authority. Check their lifecycle, background-page, messaging and build assumptions against these sources and the current code before adopting advice. Tool/skill availability does not authorize store publication or external account mutations.
