# Отложенные крупные обновления (roadmap)

Статус на 2026-11-01. Уже сделано: Node 24 (CI+Docker), TS 5.9.3, vite 6.4.5, vitest 4.1.12,
eslint-config 43, uuid 11, postcss 8.5, react-query 5.105, свежие @types; CI hardened
(semver-валидация, npm ls, critical-audit, верификация артефактов); security-алертов 100→2.

Порядок пунктов = рекомендованный приоритет. Каждый пункт = отдельная ветка + PR + полная
верификация. Триггер от пользователя: «давай обновлять» (см. «Как открывать задачу» внизу).

## Общий workflow для любого пункта (обязателен)

1. Worktree от свежего `origin/master`: `~/worktrees/vkui-audiopad-<имя-ветки>` (правило пользователя).
2. Правки + `npm install` → **assert фактических версий**: `npm ls <пакет> --all | grep -E '<pkg>@[0-9]' | sort -u`
   (урок из волны 2: зелёный install ≠ применилась нужная версия; кавычный мусор в semver резолвится молча).
3. Верификация: `npm run check` → `npm test` → `./build.sh` → `node scripts/verify-build-output.mjs`
   → `./to-publish.sh` (контейнер) → живая проверка в Chrome через MCP `chrome-devtools`
   (install_extension `dist/chrome_extension` → открыть `chrome-extension://<id>/index.html` вкладкой → консоль без JS-ошибок).
4. Гигиена: `git grep -iE "nexus|devmail|corp\.mail" --cached` — пусто; коммит → push → PR → зелёный CI.
5. Пользователь: `git commit --amend --no-edit -S && git push --force-with-lease` → мерж (агент не мержит сам
   без явного указания; ревьюеров не назначает).
6. После мержа: проверить закрытие Dependabot-алертов (рескан до ~30 мин), удалить смержённую remote-ветку
   и worktree.

## 1. minimatch-транзитивы → eslint 9/10 + flat config (закрывает последние 2 алерта)

- Что: eslint 8→9/10, `@typescript-eslint` 6→8, `@stylistic/*`→5, `eslint-plugin-react-hooks`→7,
  переход `.eslintrc.cjs` → `eslint.config.mjs` (flat) во всех 4 пакетах.
- Закрытые ранее PR с этими бампами: #18, #19 (можно посмотреть их диффы).
- Риск: средний (миграция конфигов + новые правила могут дать ошибки линта — чинить код, не ослаблять правила).
- Верификация: workflow полностью.

## 2. VKUI 7.1.3 → 7.11.7 (без мажора; сводит MCP-пин с фактом)

- `npm install @vkontakte/vkui@7.11.7 -w @vk-audiopad/front`; **VKUI_VERSION в opencode.json и .mcp.json поставить той же версией**.
- Риск: низкий-средний (минорные изменения UI). Верификация: workflow + визуальный осмотр попапа (скриншот пользователю).

## 3. VKUI 8 + React 19 + @vkontakte/icons 3 (единым блоком)

- VKUI 8 требует React 19. Миграционные гайды получать через MCP `vkui`:
  `list_migration_targets` → `get_migration_target <Name>` (есть before/after сниппеты).
- Правки по всем фичам front; icons 2→3 (переименования импортов).
- Риск: высокий. Верификация: workflow + визуальный осмотр всех экранов попапа.
- После апгрейда обновить `VKUI_VERSION` в конфигах MCP на 8.x.

## 4. hls.js 1.4 → 1.7 (аудио-ядро!)

- `npm install hls.js@1.7 -w @vk-audiopad/offscreen`.
- Риск: средний (воспроизведение). Верификация: workflow + **обязательная ручная проверка воспроизведения
  пользователем** (обычный и VK Mix/radio треки, пауза/перемотка), Chrome и Firefox.

## 5. TypeScript 5.9 → 7 (миграция tsconfig)

- В TS7 удалены `moduleResolution: node10` и `baseUrl` (TS5108/TS5102 — см. закрытый PR #16):
  заменить на `moduleResolution: "bundler"` (+ `paths` относительно корня вместо `baseUrl`), повторить во всех 4 tsconfig.
- После конфига — каскад новых ошибок типов возможен; чинить по факту.
- Риск: средний-высокий. Верификация: workflow.

## 6. Мелочи (по желанию, без security-ценности)

- `serialize-error` 11→13, `react-intersection-observer` 9→11, `@conarti/eslint-plugin-feature-sliced` 1→2
  (пойдёт вместе с пунктом 1), `@vitejs/plugin-react` 5 (вместе с будущим vite 7/8 — peer уже позволяет).

## Как открывать задачу (для пользователя)

В новой сессии достаточно фразы:

> **superpowers давай обновлять vkui-audiopad — стартуй с плана docs/ai/deferred-updates.md**
> (или конкретнее: «...делай пункт N»)

Агент: читает этот файл, выполняет workflow, несёт пункты по одному PR на пункт.
