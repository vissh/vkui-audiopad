# Обслуживание ИИ-инструкций (для человека и агентов)

Принцип: **билд ничего не проверяет про свежесть инструкций** — он быстрый, детерминированный и без сети. Свежестью занимается CI по расписанию, а правила описаны здесь.

## Что где живёт и кто это обновляет

| Файл / каталог | Что это | Кто и когда обновляет |
|---|---|---|
| `AGENTS.md` | Правила для ИИ-агентов по этому репо | Человек/агент при изменении архитектуры. CI не трогает |
| `docs/ai/architecture.md` | Детальная архитектура | То же — вместе с кодом, которым меняется архитектура |
| `.agents/skills/` + `skills-lock.json` | Вендоренный FSD-скилл (пин версии) | **Автоматически**: GitHub Actions `Update agent skills` (1-е число месяца) → сам открывает PR. Вручную: `npx skills update -y -p` |
| `.mcp.json` / `opencode.json` (MCP: vkui, chrome-devtools) | MCP-серверы для агентов: `.mcp.json` — стандарт Claude Code/Cursor, `opencode.json` — opencode. **Версии MCP-пакетов запинены** (воспроизводимость) — обновлять вручную обе конфигурации вместе | Человек. `VKUI_VERSION` — **в паре с версией `@vkontakte/vkui` в `packages/front/package.json`** (см. ниже) |
| npm-зависимости | `package.json` / lock-файлы всех пакетов | **Автоматически**: Dependabot (раз в месяц открывает PR) |
| GitHub Actions | `.github/workflows/*` | Dependabot (обновление версий actions) |

## CI

- **CI** (`.github/workflows/ci.yml`) — на каждый push в master и каждый PR: `npm ci` → `npm run check` (typecheck + lint) → `npm test` → `./build.sh`. PR с красным CI не мержится — это касается и изменений, сделанных ИИ-агентами.
- **Update agent skills** (`.github/workflows/update-agent-skills.yml`) — cron 1-го числа месяца + запуск вручную (workflow_dispatch). Обновляет вендоренный скилл и открывает PR, если изменилось.
- **Dependabot** (`.github/dependabot.yml`) — ежемесячные PR на обновление npm-пакетов и версий actions.

## Правила для агентов

- Не редактируй `.agents/skills/` руками — только через `npx skills update -y -p`.
- `AGENTS.md` и `docs/ai/*` — часть кодовой базы: изменил архитектуру/команды — обнови в том же PR.
- CI обязан быть зелёным; если упал по твоей вине — чини, а не отключай.
- **Никаких приватных registry/URL в коммитах**: lock-файл и конфиги должны содержать только публичные адреса. Корневой `.npmrc` пинит публичный registry для этого репо (перекрывает личные зеркала разработчика); CI-guard отклоняет непубличные `resolved`-URL. Перед пушем проверяй: `grep -r "resolved" package-lock.json | grep -v registry.npmjs.org` — пусто.
- `allowScripts` в корневом `package.json` — стандартная механика npm ≥11.5 (устанавливается командой `npm install-scripts approve esbuild`); нужна, чтобы postinstall esbuild не блокировался и работал vite. На npm 10 (CI, Docker) поле инертно. Если после `npm install` на свежем Node сборка падает на esbuild — выполни approve ещё раз.

## Процедура обновления VKUI (пример «связанного» обновления)

Полный roadmap отложенных крупных обновлений (TS 7, eslint 9/10, VKUI 8/React 19, hls.js) с обязательным workflow верификации — см. **deferred-updates.md**.

1. `npm install @vkontakte/vkui@<новая> -w @vk-audiopad/front`
2. Миграции смотреть через MCP `vkui` (`list_migration_targets` / `get_migration_target`) или доки https://vkui.io/migrations/
3. Исправить код, поднять `npm run check`, при необходимости `./build.sh`
4. **Обновить `VKUI_VERSION` в `opencode.json`** на ту же версию — чтобы MCP отдавал доки соответствующей версии
5. Опционально зафиксировать токены/брейкинги в `docs/ai/architecture.md`
