# Start working on VK Audiopad

VK Audiopad is a Chrome/Firefox extension for VK Music. UI and audio run in different contexts: closing the popup should not stop playback. Catalog data and track availability depend on VK and the browser profile's session. This repository does not contain its own server application.

## First session

1. Read [repository rules](../AGENTS.md) and [product behavior](product/behavior.md). These describe current behavior; proposed changes are labeled explicitly.
2. Follow [README setup](../README.md#development). Open the monorepo root. After installing dependencies, run `npm run check` and `npm test`; for a browser check, run `./build.sh` and `npm run verify:build`.
3. Read [the workflow](ai/agent-workflow.md). Cross-package work also requires [architecture](ai/architecture.md) and [state/messages](ai/state-and-messages.md).
4. Check [MCP setup](ai/mcp.md) in your AI client. Configs are committed, but connection status and project trust are properties of the current session.
5. Choose a bounded task with an observable result. [The roadmap](ai/development-roadmap.md) records progress and dependencies. Verify historical [audit findings](ai/readiness-review.md) against current code before treating them as open bugs.

A small reproducible UI defect or a pure function with a test is a useful first change. Read the relevant contracts before changing authentication, SW recovery or external VK formats.

## Find the right context

| Question | Source |
|---|---|
| What does the extension do, and what counts as a user-visible result? | [Product behavior](product/behavior.md) |
| Where are front/SW/offscreen boundaries and the Firefox build differences? | [Architecture](ai/architecture.md) |
| Who writes a field, how is a command sent, and how is completion observed? | [State and messages](ai/state-and-messages.md) |
| Why are playbackId, cancellation and attempt limits necessary? | [Playback ADR](decisions/0001-playback-operations.md) |
| How should a change be implemented, verified and handed over? | [Workflow and change routes](ai/agent-workflow.md) |
| How do vk.ru data sources work, and how are format changes investigated? | [VK integration](ai/vkru-scraping.md) |
| How are offline tests, browser connections and smoke checks run? | [Testing](ai/testing.md) |
| How should safe parser/network test data be constructed and updated? | [Fixtures](ai/fixtures.md) |
| How are React renders, startup, scrolling and dialog focus investigated? | [UI debugging and profiling](ai/ui-debugging.md) |
| Where is MCP configured, and how is client drift prevented? | [MCP](ai/mcp.md) |
| Which extension skills/tools were reviewed, and how should browser-specific guidance be used? | [Extension tooling](ai/extension-tooling.md) and [project runtime skill](../.agents/skills/browser-extension-development/SKILL.md) |
| How do contributors install and discover the shared browser skills? | [Shared skill setup](ai/extension-tooling.md#shared-skill-setup) |
| How are dependencies, tools and documentation updated? | [Maintenance](ai/maintenance.md) |
| How are versions, tags and verified Chrome/Firefox/source packages prepared? | [Release runbook](releases.md) |
| What is complete, and what comes next? | [Development roadmap](ai/development-roadmap.md) |

Startup and recovery changes also require [ADR 0002](decisions/0002-startup-recovery.md): listener readiness, existing-media ownership and failure behavior. Offscreen tasks also require [ADR 0003](decisions/0003-offscreen-lifecycle.md) for listener readiness, idle cleanup and HLS source intent. Queue tasks require [ADR 0004](decisions/0004-queue-mutations.md), including loaded metadata and late hydration/page responses.

## Understand the evidence

`check` validates runtime, MCP consistency, maintained documentation references/commands, types and lint; it does not run behavioral tests. `npm test` exercises isolated scenarios through adapters, not real networking or audio decoding. Build and `verify:build` validate parts of the artifacts, not browser playback or complete release identity. Dated [Chrome evidence](ai/testing.md#live-run-november-3-2026) and [authenticated Firefox evidence](ai/testing.md#authenticated-firefox-follow-up-november-4-2026) cover their listed scenarios. The isolated Firefox CI probe checks runtime startup/transport without VK; actual popups, worker termination, minimum browser versions and later changes need their own evidence.

At handoff, explain the user-visible change, implementation location, scenarios verified and remaining limitations. If a tool or VK session is unavailable, continue independent local checks and name the unavailable scenario precisely.

## Common misunderstandings

- Message delivery does not mean audio started. Media events and observed state establish the result.
- Storage contains individual fields. Common's ApplicationSettings and similar objects group defaults; they are not nested storage keys.
- `played` is playback output; send play/pause to the SW. Some historical settings still trigger side effects through storage listeners.
- Production consumers use common/dist, while offline tests use common/src. A stale common build can hide changes in the browser.
- The current playlist is the extension's queue. Editing it and modifying the VK music library are different scenarios.
- Tokens, access/action hashes, cookies and media URLs do not become fixtures simply because DevTools can display them. Reports should contain sanitized observations.

## Documentation language and ownership

English is the single maintained language for project-authored documentation and agent instructions. Actual Russian UI labels, quoted browser messages, identifiers and external/vendored material retain their original spelling. Discuss tasks with users in their preferred language; do not maintain a second translation of the project docs.

Update the document that owns a contract and link to it from other guides. [Maintenance](ai/maintenance.md) lists owners. An audit is historical evidence; the roadmap records current status. Keeping those roles separate prevents a future agent from treating a proposal or an old failure as the current implementation.
