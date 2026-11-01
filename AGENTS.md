# AGENTS.md — инструкция для ИИ-агентов

Браузерное расширение **VK Audiopad** — плеер для VK Music (vk.ru) для Chrome и Firefox.
Manifest V3, TypeScript strict, React 18 + VKUI 7, методология Feature Sliced Design.

## Команды

Работать из корня репозитория (npm workspaces, один `node_modules`).

```bash
npm install          # установка всех зависимостей (один раз)
npm run check        # БЫСТРАЯ ПРОВЕРКА: сборка common + typecheck + eslint всех пакетов
npm test             # vitest (тесты в packages/common)
./build.sh           # полная сборка расширения → dist/chrome_extension и dist/firefox_extension
./build.sh front     # пересобрать только один пакет (front|offscreen|service-worker)
npm run eslint:fix   # автофикс линта во всех пакетах
```

- `npm run check` — обязательный минимум перед «готово». Быстрее полного билда.
- `./build.sh` — если меняли vite-конфиги, manifest.js, public-файлы или хотите проверить сборку целиком.
- Загрузить расширение для ручной проверки: `chrome://extensions` → Developer mode → Load unpacked → `dist/chrome_extension`. Для Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/firefox_extension`.
- В Idea/VS Code открывай корень репо, а не пакет.

## Пакеты (npm workspaces)

| Пакет | Назначение |
|---|---|
| `packages/common` | Общая библиотека `@vk-audiopad/common`: типы (включая протокол сообщений), VK API клиенты, конвертеры, утилиты. Сборка библиотекой (vite + dts). **Остальные пакеты импортируют типы из его `dist/` — сначала собери common** (`npm run build:common`). |
| `packages/front` | UI попапа расширения (index.html → popup): React 18, VKUI 8.x, @tanstack/react-query. Строгий FSD. |
| `packages/offscreen` | Offscreen-документ Chrome: аудиоэлемент + hls.js. В Firefox работает как фоновая страница (тот же код). |
| `packages/service-worker` | MV3 background service worker: оркестрация воспроизведения, очереди, плейлисты, интеграция с VK. |

Архитектура подробно (контексты, протокол сообщений, состояние, VK API): **docs/ai/architecture.md** — читай перед задачами, затрагивающими несколько пакетов.

## ИИ-инструменты в этом репо

- **MCP `vkui`** (конфиги: `.mcp.json` для Claude Code/Cursor, `opencode.json` для opencode): доки VKUI, пропсы компонентов, примеры, миграции. Используй для подбора компонентов вместо выдумывания API. `VKUI_VERSION` в конфигах держим равной версии из `packages/front/package.json` (доки других версий могут расходиться с фактами).
- **MCP `chrome-devtools`** (с `--categoryExtensions`): ставит/перезагружает распакованное расширение в Chrome, читает консоль. Цикл проверки: `./build.sh` → `install_extension` (путь `dist/chrome_extension`) → `trigger_extension_action` → `list_console_messages`. Полный смок-цикл с залогиненным vk.ru, бейзлайн консоли и приёмы отладки попапа: **docs/ai/testing.md** — читай перед живой проверкой.
- FSD-скилл (`.agents/skills/feature-sliced-design/`): подключай при работе со слоями front. Не редактируй руками — обновление через `npx skills update -y -p` (CI делает это автоматически раз в месяц).

### Обслуживание инструкций

Как и кем обновляются AGENTS.md, скиллы, MCP и зависимости — см. **docs/ai/maintenance.md**. Коротко: зависимости и скиллы обновляет CI/Dependabot, `AGENTS.md` и `docs/ai/*` — вместе с кодом в том же PR, CI должен быть зелёным.

## Правила разработки

### Feature Sliced Design (packages/front)

- Слои: `app` → `pages` → `widgets` → `features` → `entities` → `shared`. Импорт только сверху вниз, кросс-импорт внутри слоя запрещён (следит eslint `@conarti/eslint-plugin-feature-sliced` — не отключай).
- Публичный API сегмента — только через его `index.ts`.
- Новый UI в первую очередь собираем из компонентов VKUI (`@vkontakte/vkui`) и иконок `@vkontakte/icons`.
- Состояние — кастомные атомы (`src/shared/lib/atom.ts`): `atom()`, `lsAtom()` (localStorage), `storageAtom()` (chrome.storage.local, синхронизация между контекстами). Серверное состояние — react-query.

### Протокол сообщений

- Всё общение между контекстами — `chrome.runtime.sendMessage` с дискриминированными union-типами из `packages/common/src/types.ts` (`MessageTarget` + `MessageType`).
- Добавил тип сообщения → обнови обработчик-роутер: `service-worker/src/listeners/messages.ts` или `offscreen/src/listeners/messages.ts`, switch с `assertUnreachable` (компилятор укажет, если забыл ветку).
- Ошибки через границу сообщений передавай только сериализованными (`serialize-error`).

### Chrome vs Firefox

- Различия задаёт `environment.json` (флаг `offscreen-document-support`), который выбирает build.sh из `public/environment-{chrome,firefox}.json`.
- Chrome: audio в offscreen-документе + MV3 service worker. Firefox: всё в одной фоновой странице `offscreen.html`.
- Код должен работать в обоих режимах — проверяй `commonUtils.offscreenDocumentSupport()` и `isFirefox()` из common, не хардкодь браузер.

### Не трогать / осторожно

- `packages/service-worker/src/fetchers/unmask.js` — вендорный минифицированный код (снятие масок с аудио-URL). Не редактируй и не форматируй.
- `packages/common/src/vk-client.ts` — scraping внутренних эндпоинтов vk.ru: FormData + windows-1251 → UTF-8 перекодировка. Ломается от «безобидных» правок.
- `manifest.json` не существует в репо — генерируется при сборке (`public/manifest.js`, версия и permissions там же). Изменения манифеста = правка `public/manifest.js`.
- `public/rules/vkcom.json` — правила declarativeNetRequest (срез рекламы на vk.ru).
- Версию расширения поднимаем в `public/manifest.js` (`version`), не в package.json.

### Конвенции

- TypeScript strict, без `any`-лени: `noImplicitAny` и strict включены.
- ESLint `standard-with-typescript`: 2 пробела, без точек с запятой, одинарные кавычки — `npm run eslint:fix` приведёт код сам.
- Комментарии в коде на английском, минимально.

## Тесты

- Vitest, файлы `*.test.ts` рядом с исходниками в `packages/common` (пока только чистая логика: конвертеры, утилиты).
- Новую чистую логику в common сопровождай тестом. Логику с сетью/chrome API не тестируем (пока нет инфраструктуры для этого).
- Живая проверка расширения (смок в Chrome, известные баги): **docs/ai/testing.md**.

## Типичные задачи

- **Новый экран/фича UI** → только `packages/front`: страница в `pages/`, фича в `features/`, данные через react-query + fetcher, состояние через атомы. Проверка: `npm run check`.
- **Новая команда плееру** → новый `MessageType` в common + обработчик в service-worker `actions/` + роутер `listeners/messages.ts`, при необходимости команда в offscreen. Проверка: `npm run check && ./build.sh`.
- **Правка данных VK API** → сначала `packages/common` (`vk-api-client.ts` / `vk-client.ts`), пересобрать common, потом потребители. Проверка: `npm run check` (он сам собирает common первым).
