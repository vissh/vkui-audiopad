# MCP for Codex, Claude Code and OpenCode

[.mcp.json](../../.mcp.json) is the single server-settings source. Claude Code reads it directly; [the generator](../../scripts/mcp-config.mjs) converts it into native formats for the other clients. Derived files are committed, so a clone needs no initial generation.

| Client | Project configuration | Discovery check |
|---|---|---|
| Claude Code | .mcp.json | claude mcp list; /mcp inside a session |
| Codex CLI / desktop / IDE | .codex/config.toml, fully generated | codex mcp list; /mcp inside a session |
| OpenCode 1.x | opencode.json; only its mcp field is generated | opencode mcp list |

Open the repository root and launch CLI clients there. Codex reads project configuration only for a trusted project; restart MCP/the client after changes. Claude Code can request project-server approval through its standard flow; do not auto-approve every server. CLAUDE.md imports AGENTS.md, keeping instructions and MCP references in one source.

Consistency checks cover repository files. User configs, CLI overrides, disabled servers and organization policy can change effective connectivity; CI does not inspect personal settings. Normal setup does not require copying project servers into global configs. Inspect effective settings if same-name overrides conflict. A file/list entry does not prove a working connection; verify available tools in the current session.

## Change server settings

```bash
# Edit commands, versions, arguments or env in .mcp.json, then:
npm run mcp:sync
npm run mcp:check
npm run check
npm test
```

Sync works without installed dependencies (`node scripts/mcp-config.mjs --write`), starts no servers and uses no network. It replaces .codex/config.toml and only the mcp field in opencode.json, preserving other OpenCode settings. Keep personal Codex preferences in user config.toml. Commit source and outputs together. Sandboxes protecting .codex/ may require their normal authorization for that directory write.

Current adapters support local STDIO servers: command, args, env and optional type: stdio. Add both adapters/tests before using a new property or transport. Unknown options and client-specific variable substitution are rejected rather than silently dropped or reinterpreted.

VKUI_VERSION must match @vkontakte/vkui in packages/front/package.json. Update it in the source and run sync when changing VKUI. MCP package versions are pinned in source command arguments and updated there too.

## Prevent divergence

- mcp:check compares the full server set/settings and does not repair files.
- Doctor includes that check; check includes doctor; CI runs check and tests. CI never regenerates configs, so editing a derived setting makes validation fail.
- Tests mutate commands, versions, flags, env, enabled status and server sets; they also cover invalid input, idempotent generation and committed repository files. Codex checks the entire generated TOML; OpenCode compares mcp structurally, independent of JSON formatting.

Enforcing green CI before merge additionally requires required GitHub workflow statuses.

## Chrome smoke checks

chrome-devtools uses --categoryExtensions for installation, reload and extension actions. -y prevents npm from waiting for first-download confirmation; --no-usage-statistics disables MCP usage collection. First launch needs the npm registry and Chrome. Users log into VK themselves in the MCP browser; another Chrome profile's cookies may not be available.

For automated installation, use a build path under the client's advertised workspace roots or a stable temporary copy of the unpacked extension. Upgrade checks require the same installation path. The [browser testing guide](testing.md#chrome-smoke-with-an-authenticated-account) also describes manual installation and verification.

A successful build is not evidence of a browser connection. See [testing](testing.md#chrome-smoke-with-an-authenticated-account) for fresh/upgrade checks and console baseline.

## Firefox extension checks

firefox-devtools pins Mozilla's **@mozilla/firefox-devtools-mcp-moz 0.10.7**, with an explicit module list for pages, snapshots, input, network, console, screenshots, utilities, session management, extensions, script and privileged browser contexts. Public and moz packages are different: the public package can install an addon, but its BiDi navigation cannot open the tested moz-extension:// UI, and it omits list_extensions/privileged tools. The moz build plus MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1 provides the supported browser-context tools needed to inspect our addon. This is browser debugging access; use only the dedicated automation profile.

--auto-profile keeps a dedicated MCP profile under ~/.firefox-devtools-mcp/ so VK login can survive interactive sessions. Firefox starts visibly; login happens in that Firefox profile, independently of Chrome. Run one client against that profile at a time. The first tool call needs Firefox and may let Selenium Manager download geckodriver. --firefox-path selects a nonstandard binary; keep machine paths in local overrides, not shared repository settings. No privileged Firefox access or downloads are needed for ordinary check/test/build.

After restarting MCP/the client, inspect tools/list for install_extension, list_extensions, list_privileged_contexts, evaluate_privileged_script, select_page, evaluate_script and console/network tools. Discover their actual schemas: Firefox selects a page before acting; Chrome's pageId/serviceWorkerId arguments are not interchangeable. Upstream main-branch docs can differ from the pinned npm package. See [the Firefox procedure](testing.md#firefox-smoke-through-mcp) and [tooling research](extension-tooling.md).

For repeatable runtime verification without VK, run npm run smoke:firefox after a full build. It uses the same .mcp.json server definition through the official SDK, overrides persistent/visible launch with a temporary headless profile, and cleans up its own session. It starts a separate instance; it does not connect to or close an interactive MCP browser. It is opt-in locally and separate from npm test; CI runs it after both builds with pinned Firefox 159.0.

## Official formats

- [OpenAI: MCP and project config.toml](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Claude Code: MCP and project scope](https://code.claude.com/docs/en/mcp)
- [OpenCode 1.x MCP](https://docs.opencode.ai/docs/mcp-servers/) and [project configuration](https://docs.opencode.ai/docs/config/)

OpenCode 2 uses a different MCP schema (mcp.servers). This repository currently supports the installed OpenCode 1.x line; moving to 2.x requires a separate config/adapter migration and validation.
