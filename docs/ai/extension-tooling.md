# Extension tooling and skills

Reviewed November 4, 2026. Keep tool selection grounded in the actual extension runtime and observable tests. This document owns research/adoption decisions; [MCP](mcp.md) owns shared settings and [testing](testing.md) owns procedures/evidence.

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
| [Google Chrome: building extensions with agents](https://developer.chrome.com/docs/extensions/ai/build-with-ai) and [official chrome-extensions skill](https://github.com/GoogleChrome/modern-web-guidance/tree/main/skills/chrome-extensions) | Preferred external Chrome guidance. Link from the project skill instead of importing the entire new-project/publishing playbook into every runtime task. It is not vendored or automatically updated here. Consult the relevant part when needed; project contracts and minimum-browser support still apply. |
| [samber chrome-extension](https://github.com/samber/cc-skills/tree/main/skills/chrome-extension) | Useful topic/reference map, but broad triggers/build assumptions need adaptation; not installed. |
| [community chrome-extension-developer](https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/chrome-extension-developer) | Not installed: its unconditional service-worker preference and callback requirement do not describe our Firefox background document and existing Promise APIs. |
| Existing FSD skill | Remains the frontend placement source; extension guidance does not replace FSD rules. |

More instructions are useful only if they improve a decision or verification. Avoid parallel translated copies, generic best-practice dumps, automatic framework migrations and global tool installs as project prerequisites. Check source/version, scope, executable helpers and compatibility before adopting a new skill. The project-owned skill is reviewed with code; only the FSD vendor skill belongs to skills-lock.json and monthly upstream refreshes.

## Primary references

- [Mozilla MCP source, setup and security](https://github.com/mozilla/firefox-devtools-mcp), [tool modules](https://github.com/mozilla/firefox-devtools-mcp/blob/main/docs/tools.md) and [Firefox source documentation](https://firefox-source-docs.mozilla.org/ai-agent-tools/firefox-devtools-mcp.html). For extension internals this project uses the moz package, not instructions for the public web-page inspection flow.
- [MDN background compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background): Firefox background scripts/pages and Chrome service workers differ even under MV3.
- [Chrome service worker lifetime](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) and [offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen).
- [Claude skill discovery](https://code.claude.com/docs/en/skills), [Codex skills](https://developers.openai.com/codex/skills), [OpenCode skills](https://docs.opencode.ai/docs/skills/). These describe client discovery; repository routes/checks remain independent of whether a client is installed or trusted.
