# Extension tooling and skills

Reviewed November 14, 2026. Keep tool selection grounded in the actual extension runtime and observable tests. This document owns research/adoption decisions; [MCP](mcp.md) owns shared settings and [testing](testing.md) owns procedures/evidence.

## Adopted tools

| Tool | Fit and boundary |
|---|---|
| Chrome DevTools MCP | Existing pinned extension install/action/SW inspection flow. Keep the staged path stable and distinguish reload/update from worker termination. |
| Mozilla Firefox DevTools MCP moz build | Official Firefox browser/addon inspection over WebDriver. The tested public build installed our addon but rejected extension-origin navigation. The moz build exposes supported browser-context tools; explicit modules avoid loading unrelated profiler/debugger/raw-BiDi tools. Use a dedicated automation profile. |
| npm run smoke:firefox | Repeatable headless runtime probe using the official MCP SDK and the shared server settings. Fresh profile and temporary build copy, no production frontend or VK login. It verifies background readiness, an empty native Audio snapshot round trip and applied repeat commands; it does not verify VK playback or popup behavior. |

The opt-in smoke runner adds its own probe HTML/JS only to a temporary build copy. It does not ship a debug page, extra permissions or test hooks in production. Default unit/integration tests remain offline adapters. Firefox/MCP/geckodriver bootstrap can require downloads; this is not a hermetic offline browser environment or a full CI browser matrix. CI adds a headless Firefox 159.0 runtime check after both builds.

Authenticated Firefox session/catalog/search/playback/Mix and UI-tab reopen were subsequently checked manually; [the dated evidence](testing.md#authenticated-firefox-follow-up-november-4-2026) is separate from the repeatable headless runtime probe.

## Skill selection

The maintained project entrypoint is [browser-extension-development](../../.agents/skills/browser-extension-development/SKILL.md). It routes to existing contracts and adds the cross-browser decisions generic Chrome examples miss. Codex uses .agents/skills; Claude gets the same files through .claude/skills; OpenCode skills.paths includes .agents/skills. The repository checks those discovery paths without generating duplicated instruction files. Restart/rescan clients after changes; configuration integrity does not prove that a particular client invoked a skill.

| Source reviewed | Decision |
|---|---|
| [Google Chrome: building extensions with agents](https://developer.chrome.com/docs/extensions/ai/build-with-ai) and [official chrome-extensions skill](../../.agents/skills/chrome-extensions/SKILL.md) | Vendored Chrome API/topic references from GoogleChrome/modern-web-guidance, tracked in skills-lock.json and included in monthly vendor updates. Consult only the relevant topic after the project workflow; generic new-project/publishing rules do not replace our runtime and release contracts. |
| [Official modern-web-guidance skill](../../.agents/skills/modern-web-guidance/SKILL.md) | Vendored web-platform guides and search instructions from the same GoogleChrome repository. Useful for targeted accessibility, forms, CSS and performance work; not a browser automation driver. Its search CLI needs separate npm/network access. |
| [samber chrome-extension](https://github.com/samber/cc-skills/tree/main/skills/chrome-extension) | Useful topic/reference map, but broad triggers/build assumptions need adaptation; not installed. |
| [community chrome-extension-developer](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/chrome-extension-developer) | Not installed: its unconditional service-worker preference and callback requirement do not describe our Firefox background document and existing Promise APIs. |
| Existing FSD skill | Remains the frontend placement source; extension guidance does not replace FSD rules. |

More instructions are useful only if they improve a decision or verification. Avoid parallel translated copies, generic best-practice dumps, automatic framework migrations and global tool installs as project prerequisites. Check source/version, scope, executable helpers and compatibility before adopting a new skill. The project-owned skill is reviewed with code; FSD and the two GoogleChrome vendor skills belong to skills-lock.json and monthly upstream refreshes.

## Shared skill setup

The skills and their reference files are committed under `.agents/skills`; cloning or pulling this repository supplies the reviewed snapshots. `npm ci` installs application/tooling dependencies, not agent skills. A global skill installation is unnecessary and can shadow the project snapshot.

1. Open the repository root and trust the project in your agent client.
2. Restart/rescan skill discovery after pulling changes. Codex discovers `.agents/skills`; Claude Code uses the existing `.claude/skills` symlink to that directory; OpenCode uses its committed `skills.paths` setting. Do not create per-client copies.
3. Verify that the client lists `browser-extension-development`, `feature-sliced-design`, `chrome-extensions` and `modern-web-guidance`. A new skill's files being present does not prove an already-running client has loaded them.
4. Read the project extension workflow first. For Chrome API questions, select the matching vendor reference; for a web-platform task, follow modern-web-guidance's focused search/retrieve instructions. The local `guides/` snapshot can be read when its optional CLI/network is unavailable; disclose that limitation. Neither package is required for ordinary check/test/build execution.

To refresh the project vendor snapshots, use the same command as the monthly workflow:

```sh
npx -y skills update -y -p
```

Review and commit `.agents/skills` and `skills-lock.json` together, then run `npm run check`. Do not hand-edit vendor files or their computed hashes. The v2 skills lock records the two GoogleChrome skills and the unchanged FSD snapshot using the installer's current hash format. The upstream snapshots initially adopted here match the locally installed copies byte-for-byte; no unrelated primary-checkout edits were moved or removed. Updates may change instructions as well as reference material, so green checks still require a compatibility review. See [maintenance](maintenance.md).

### Compatibility boundaries

- Chrome-specific background/service-worker examples do not replace Firefox's background page. In-memory coordination is allowed when the owning ADR defines recovery; durable state still belongs in storage. Short operation deadlines are not periodic jobs and should not be mechanically converted to alarms.
- Preserve strict TypeScript without explicit any, VKUI components, the existing build target and the minimum versions declared in public/manifest.js. A guide's new platform API needs compatibility checks/fallbacks; do not apply its generic type casts or raise the target to bypass a compiler error.
- Do not add permissions or weaken CSP from a generic example. Use the existing messaging/session/storage owners and release runbook. Consulting a skill does not authorize publication, a framework migration, or a startup slowdown.
- Vendored guidance describes APIs; MCP/Computer Use supplies actual browser capabilities and permissions. Discover the live tools before claiming browser access. Browser policies take precedence; never try another scheme, raw protocol command or indirect route to bypass a blocked action.

### Built-in browser installation check

On November 14, 2026, the internal-browser control became available and a direct request to open `chrome://extensions/` was rejected by its URL policy: only HTTP/HTTPS navigation was allowed. No extension was installed there. This is an observed limitation of that session, not a claim that every embedded browser permanently lacks extension support. The new skill files cannot grant this missing permission or change the browser engine.

The modern-web-guidance CLI was exercised with `load unpacked extension` and `browser extension installation`, using its declared skill-version. The returned descriptions concerned web-platform features, WebMCP and PWA installation; none described loading a browser extension, so no unrelated guide or PWA flow was applied. The Chrome skill's popup/DevTools references are useful development guidance but do not provide an installation tool. Use the documented Chrome/Firefox workflows when an authorized extension-capable browser is available; a localhost preview is not evidence of the actual extension runtime. See [MCP browser setup](mcp.md#built-in-browser-and-extension-tools).

## Primary references

- [Mozilla MCP source, setup and security](https://github.com/mozilla/firefox-devtools-mcp), [tool modules](https://github.com/mozilla/firefox-devtools-mcp/blob/main/docs/tools.md) and [Firefox source documentation](https://firefox-source-docs.mozilla.org/ai-agent-tools/firefox-devtools-mcp.html). For extension internals this project uses the moz package, not instructions for the public web-page inspection flow.
- [MDN background compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background): Firefox background scripts/pages and Chrome service workers differ even under MV3.
- [Chrome service worker lifetime](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) and [offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen).
- [Claude skill discovery](https://code.claude.com/docs/en/skills), [Codex skills](https://developers.openai.com/codex/skills), [OpenCode skills](https://docs.opencode.ai/docs/skills/). These describe client discovery; repository routes/checks remain independent of whether a client is installed or trusted.

## React component profiling

The front workspace pins the official react-devtools-cdt-mcp package at 0.1.0 as a development dependency. The opt-in Vite profile mode registers its hook before React, aliases react-dom/client to react-dom/profiling, retains component names and emits source maps. Ordinary builds omit the registration and use the standard React runtime. The package exposes component trees, owners, hooks and commit reports through the browser's devtoolstooldiscovery event. Its interface is experimental. [React's integration guide](https://react.dev/reference/dev-tools/react-devtools-cdt-mcp) and [performance tracks](https://react.dev/reference/dev-tools/react-performance-tracks) describe its APIs and instrumentation overhead.

The shared Chrome configuration enables third-party discovery, and `npm run build:profile` writes a separate packages/front/dist-profile frontend. [UI debugging and profiling](ui-debugging.md) owns setup, stage replacement, tool discovery, required comparisons and restoration. Startup/scroll/interaction changes require React recordings plus a separate normal production trace. Dated [profiling evidence](testing.md#playlist-metadata-and-react-profiling-follow-up-november-8-2026) and the [startup comparison](testing.md#startup-and-interaction-performance-november-8-2026) retain the measurements and their limits.
