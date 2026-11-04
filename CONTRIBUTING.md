# Contributing to VK Audiopad

Start with [the project guide](docs/README.md), which connects product behavior, architecture, environment setup, tests and the current roadmap.

[AGENTS.md](AGENTS.md) contains repository rules for contributors and AI agents. Work from the repository root and preserve existing working-tree changes. Maintain repository documentation and instructions in English; quote actual Russian UI labels when needed. Keep one maintained version of each document.

Define an observable outcome, choose checks using [the workflow](docs/ai/agent-workflow.md), update the affected contract and run `npm run check`. Behavioral changes also need an appropriate test/scenario; [testing](docs/ai/testing.md) explains offline and live evidence.

A PR should describe the problem, resulting behavior, completed validation and unverified scenarios. Never include real cookies, tokens, signed media URLs or personal VK responses in code, fixtures or reports. Check [the roadmap](docs/ai/development-roadmap.md) against current code before taking the next task.
