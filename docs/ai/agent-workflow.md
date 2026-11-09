# AI agent development workflow

This is the current workflow. [The roadmap](development-roadmap.md) separates implemented capabilities from planned checks and commands. New contributors should start with [the project guide](../README.md).

## Start a task

1. Read [AGENTS.md](../../AGENTS.md), verify cwd, git status and the relevant diff. Preserve existing changes. Reuse a suitable checkout; isolate work through the environment's worktree/branch facilities when needed.
2. State an observable result: trigger, old/new behavior, compatibility limits and how correctness will be demonstrated. Reproduce a defect before fixing it when practical.
3. Identify affected packages. For cross-package work read [architecture](architecture.md) and [state/messages](state-and-messages.md); for VK data read [integration](vkru-scraping.md); for a browser run read [testing](testing.md); for front structure apply the installed FSD skill. Extension-specific runtime/manifest/browser tasks use the project browser-extension-development skill.
4. Check actual [MCP availability](mcp.md). .mcp.json owns settings; mcp:sync generates Codex/OpenCode formats. Doctor proves consistency, not a live connection. Without VKUI MCP, inspect installed declarations/examples. A build does not establish extension installation.
5. If taking a roadmap item, verify dependencies and current assumptions. Historical R findings describe revision 5574e83; current code may already differ.

Make routine engineering decisions within the task independently. Clarify when a choice materially changes product behavior and the intended result cannot be inferred from the accepted contract; continue independent work while waiting. Existing authorization in the session still applies.

## Define a bounded task

A useful handoff or prompt has this shape:

```text
Outcome: observable behavior to add or fix.
Scenario: input, trigger and before/after result.
Context: relevant T/R items, packages and documents.
Boundaries: compatibility to retain, including Chrome and Firefox.
Acceptance: concrete assertions that establish correctness.
Validation: commands and browser scenarios required.
Deliverable: implementation, checks, updated contracts and a result report.
```

For example: "Start A with a deferred response, then B; completing A must not change B or its queue." For an initial roadmap task, name its ID and current dependencies, not just "improve architecture". T01 and core startup/readiness are implemented; T05 live restart evidence and broader T06 media/browser validation still need work; listener readiness and close/create coordination have controlled coverage.

## Compare music behavior with VK

For music actions, use [the VK behavior reference](../product/vk-parity.md). Compare the website and extension's action/request/result/restoration, not just icons. Keep production UI in VKUI and respect SW/storage ownership. Extend the evidence matrix as functions are checked; do not claim complete parity from catalog/playback smoke. Personal data and live credentials stay out of committed evidence and CI.

## Implement a change

Read the nearest consumers/public APIs and choose the smallest sufficient boundary. Do not introduce a layer, entity or library for hypothetical future use. Keep logic near its owning scenario; extraction requires real consumers and a coherent responsibility.

For runtime defects, control network, storage, clocks and completion order. Existing helpers are under tests/helpers/, with examples in tests/service-worker, tests/offscreen and tests/front. Extend the model only where the task needs it; a passing build cannot replace a behavioral scenario. New pure common logic needs a test.

Protocol edits must cover every consumer, including the Firefox CustomEvent bridge. Keep exhaustive switches. For a persistent field define its default, writer, invalid/missing-value handling and update/account-switch lifetime. For a VK request preserve the appropriate API family and legacy encoding.

For async operations identify who awaits completion, where failure is handled, how supersession works and the retry bound. void promise does not catch errors. Do not weaken rules, add unchecked assertions or broaden ignored warnings to make verification pass.

Update implementation and contract in the same PR. Documentation must distinguish current behavior from a target; an old example is not authority when it conflicts with verified code.

## Routes for common changes

| Task | Start here | Evidence to add |
|---|---|---|
| UI startup, scrolling or interaction performance | [UI debugging](ui-debugging.md), profile frontend and Chrome React tools, then normal production build | Comparable React recordings, component/commit report and separate production trace. Restore normal stage assets. |
| Popup UI or a page query | app/Pages.tsx, the relevant pages/*/{ui,model,api}, VKUI docs/types | Loading/empty/error and interaction behavior; screenshots for visible changes. Keep query identity tied to actual inputs/session. |
| New player command | common/types.ts -> SW router/action -> offscreen router/handler if needed; existing PLAY_OR_PAUSE flow | Both transports, failure/obsolete events and observed state. Do not report command success merely because sendMessage resolved. |
| New playback field | common defaults/types, SW operation/state, front observer | Missing/legacy value, ownership, restart/update behavior. A default is not a migration. |
| VK parser/data | Common client/converter, then page fetcher/consumer | Sanitized format fixture, missing/malformed/cancellation cases, relevant live source. Preserve encoding and request shape. |
| Queue change | SW actions plus current-playlist UI and audiosIds/loaded tracks | Boundary insertion/removal, shuffle/current selection and delayed hydration. Keep full IDs distinct from visible TrackItems. |
| MCP/tool setup | .mcp.json and scripts/mcp-config.mjs | mcp:sync, drift check, tooling tests and actual client discovery. Keep generated settings committed. |

Examples worth reading: [bounded playback tests](../../tests/service-worker/playback.test.ts), [late offscreen delivery](../../tests/service-worker/offscreen-ordering.test.ts), [actual Player DOM](../../tests/front/playback-controls.test.ts), [legacy response decoding](../../tests/common/vk-client.test.ts). Existing code may retain a known defect: check its roadmap item before copying a pattern.

## Verify the result

Run from the root:

```bash
npm run check
npm test
./build.sh
npm run verify:build
```

Choose additional evidence according to scope:

| Change | Evidence beyond the required check |
|---|---|
| Pure common logic | Regression unit test and npm test |
| Player, async, storage, auth or queue | Controlled negative/concurrent cases; extend the harness if necessary |
| Messages/runtime contexts | Full two-browser build and scenarios for both transports |
| Vite, manifest, public assets or packaging | Full build + verify:build; resource/packaging validation as needed |
| Firefox runtime/startup | npm run smoke:firefox after a full build; this isolated runtime probe does not replace authenticated playback/UI checks |
| Visible UI | Interaction, keyboard and screenshot of actual UI; typecheck is insufficient |
| VK scraping | Format fixtures and available live sources from the integration guide |
| Storage schema or upgrade | Fresh and upgrade scenarios, including preserved settings/data |
| Documentation | docs:check (included in check), verify behavioral claims and diff; links cannot establish that prose matches implementation |
| MCP settings | Sync after source edits, mcp:check, tooling tests and discovery in available clients |

For focused development use, for example, `npm test -- tests/service-worker/playback.test.ts`; complete the required scope checks before handoff. Doctor is included in check; runtime-only doctor works before dependency installation. check also includes test typechecking and tooling lint. There is no test:e2e or general verify command yet. Add new commands to package.json, CI and these instructions together.

A live check requires the appropriate tool/session/access. Report an unavailable check precisely. Never equate "no JS errors" with success of an unobserved scenario, or store real tokens/personal responses in evidence.

## Before handoff

- Follow [the PR history rule](../../AGENTS.md#pr-history): exactly one commit per PR, including follow-up fixes and documentation. Verify the count against the target branch; use a branch-scoped force-with-lease when updating an already published commit.
- Review the final diff, including unintended lockfile, vendor and generated-output changes.
- Ensure a regression test distinguishes the faulty behavior from the fix and asserts an outcome.
- Inspect failure, cancellation and invalid/empty input at changed boundaries.
- Verify Firefox, fresh-install and upgrade impact when relevant.
- Update the owning contract; add an ADR for a significant design choice, not every small edit.
- Report user-visible behavior, implementation, completed checks and unverified scenarios.

A green build/offline suite is partial evidence. Acceptance is complete only when the task's defined result is verified and its evidence limits are stated.

## Continue and deliver

Update roadmap status with implementation/check links; keep the historical audit intact. English is the maintained documentation language; retain exact Russian UI labels in examples where they help reproduce a scenario.

For an authorized release, follow [the release runbook](../releases.md). The GitHub workflow prepares and validates the final version commit before pushing it with its tag. Personal Git credentials, signing setup and troubleshooting belong to the developer's environment rather than project onboarding.

When multiple agents are explicitly used, assign one owner per change. Shared contracts, lockfile and generated files need sequential coordination. Independent review checks behavior/invariants, not agreement with the author's narrative. Several agreeing agents do not replace executable validation.

Merge, store publication, credentials and server-rule changes require an established policy and technical access. This workflow does not itself grant permissions or enable automation. T16 covers delivery controls separately.
