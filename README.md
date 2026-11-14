# VK Audiopad

Chrome and Firefox extension for [VK Music](https://music.vk.ru/)

## Features

- Home, My music, Explore and Radio with VK's catalog groups, show-all pages and scroll loading
- A mixed playlist library with creation, editing, covers, track selection and queue saving
- VK Mix settings, genre/mood mixes, artist mixes and track mixes
- Friends' music, related artists, curator collections and direct-stream radio
- Playback independent of the popup, queue editing, shuffle/repeat, seek, volume and mute
- Ten-band equalizer with Preamp and named presets, plus an availability-gated lyrics reader
- Dark/light themes, keyboard navigation and labelled player controls

VK supplies the music catalog and requires an authenticated browser session. [Product behavior](./docs/product/behavior.md) records implemented scenarios and current limitations. [The roadmap](./docs/ai/development-roadmap.md) lists remaining work.

## Try it

- [Chrome Web Store](https://chromewebstore.google.com/detail/plclpmphdjmdgmdpfkcmdkmohgpfecip)
- [Add-ons for Firefox](https://addons.mozilla.org/ru/firefox/addon/vkaudiopad/)

## Development

Use Node from [.node-version](./.node-version) and the npm version in `packageManager` in [package.json](./package.json). CI and Docker use these same pins. Newer Node patch/minor versions within the same major are supported; use the exact reference version when reproducing CI. Commands below target macOS/Linux (or a Linux environment on Windows).

```bash
# After selecting Node with your version manager:
npm install --global npm@11.19.1
node scripts/doctor.mjs --runtime-only
npm ci
npm run check
npm test
./build.sh
npm run verify:build
```

Run all commands from the repository root. `npm ci` installs the committed lockfile; use `npm install` only when intentionally changing dependencies. `npm run doctor` checks runtime versions, workspace links and scripts, installed tools, direct workspace dependencies and all shared MCP settings. It runs automatically as part of `check`.

`npm test` runs offline tests for common, extension contexts, React state and tooling. Tests can run immediately after `npm ci`, before building common. Unexpected fetch calls fail the suite. `npm run check` includes test typechecking, tooling lint and `docs:check` for local documentation references/commands; see [test harness instructions](./docs/ai/testing.md#automated-tests-without-vk).

`npm run smoke:firefox` runs an isolated headless Firefox runtime probe after the full build, without VK login. CI runs the same command; authenticated music and actual-popup checks remain separate. See [Firefox testing](./docs/ai/testing.md#firefox-smoke-through-mcp).

The extension is built into `dist/chrome_extension` and `dist/firefox_extension`. In Chrome, open `chrome://extensions`, enable Developer mode and load the unpacked Chrome directory. In Firefox, open `about:debugging`, choose This Firefox and load the Firefox manifest as a temporary add-on. Live VK checks require an authenticated VK session; see [testing instructions](./docs/ai/testing.md).

`./build.sh front` rebuilds common and the popup after a full build; `offscreen` and `service-worker` work the same way. Other package outputs are reused. Use a full build after cross-package changes. Build `common` first when invoking workspace commands manually; `check` and every `build.sh` invocation do this automatically.

## Release packaging

Use **Actions → Release extension → Run workflow** on GitHub and enter the next version. The workflow prepares the version commit, checks/tests and builds it, then pushes the verified commit to master together with its tag and attaches Chrome, Firefox and matching source ZIPs, metadata and checksums to a GitHub Release (draft by default). Store uploads remain manual. See the [release runbook](./docs/releases.md) for one-time setup, branch policy, downloads and retries.

For a clean Git checkout after checks/tests and a full build, `npm run release:package` writes the same asset set to `dist/release` without publishing. The older `./to-publish.sh` Docker helper cleans local dependencies/build output; prefer the workflow for release candidates and `./build.sh` for normal development.

## UI debugging and performance

`npm run build:profile` builds the React MCP frontend into packages/front/dist-profile after building common. The shared Chrome MCP configuration enables React tool discovery. Profile startup, tab returns, scrolling and affected interactions when changing these paths, then verify production timings separately. Follow [the UI debugging workflow](./docs/ai/ui-debugging.md) for staging, modal focus, data handling and returning to the ordinary build.

## Architectural methodology

Project based on [Feature-Sliced Design](https://feature-sliced.design/)

## AI-assisted development

New contributors and agents: start with [the project guide](./docs/README.md) and [contributing instructions](./CONTRIBUTING.md). They link product scenarios, state ownership, change routes and verification evidence. Project-authored documentation and agent instructions are maintained in English only; actual Russian UI labels remain in examples where needed.

Instructions for AI agents: [AGENTS.md](./AGENTS.md), architecture details: [docs/ai/architecture.md](./docs/ai/architecture.md). Claude Code imports the same instructions through `CLAUDE.md`.

Shared agent skills are included in the checkout under `.agents/skills`: the project extension workflow, FSD, and official GoogleChrome Chrome-extension/web-platform guidance. No global skill installation is required. Restart/rescan your agent after pulling skill changes; see [skill setup and compatibility boundaries](./docs/ai/extension-tooling.md#shared-skill-setup). Skills provide instructions; browser control and extension installation require a connected, permitted browser tool.

MCP tools (VKUI docs, Chrome/Firefox extension debugging and opt-in React inspection/profiling) have one source: [`.mcp.json`](./.mcp.json), read directly by Claude Code. The committed [`.codex/config.toml`](./.codex/config.toml) and `mcp` section in [`opencode.json`](./opencode.json) are generated for Codex and OpenCode 1.x. After changing the source, run `npm run mcp:sync`; `npm run mcp:check`, doctor and CI reject configuration drift. Open the repository root, trust the project in Codex, approve project servers if Claude Code asks, and restart the client after config changes. See [MCP setup and maintenance](./docs/ai/mcp.md) for commands and supported formats.

Check the actual connection in your agent session. Without VKUI MCP, use the installed `@vkontakte/vkui` type declarations and existing components as API references; a missing MCP connection does not block local checks.

Development workflow: [docs/ai/agent-workflow.md](./docs/ai/agent-workflow.md). Readiness review and implementation plan: [review](./docs/ai/readiness-review.md), [roadmap](./docs/ai/development-roadmap.md).
