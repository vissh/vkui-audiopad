# Архитектура VK Audiopad (для ИИ-агентов)

Дополнение к AGENTS.md — детали, которые важно понимать перед сквозными задачами.

## Контексты расширения

Расширение состоит из трёх runtime-контекстов, каждый собран отдельным пакетом:

```
┌─────────────┐   chrome.runtime.sendMessage    ┌─────────────────┐
│    front    │ ──────────────────────────────▶ │ service-worker  │
│ (popup, UI) │ ◀──────────────── chrome.storage │ (MV3 background)│
└─────────────┘                                 └────────┬────────┘
                                                sendMessage
                                                (target: offscreen)
                                                         ▼
                                               ┌─────────────────┐
                                               │    offscreen    │
                                               │ (audio + hls.js)│
                                               └─────────────────┘
```

- **front** — попап (`action.default_popup` = index.html). Живёт только пока открыт попап; состояние переживает закрытие через `chrome.storage.local`.
- **service-worker** — «мозг»: очереди, плейлисты, запросы к VK, badge. В Chrome — настоящий MV3 service worker (умирает в простое, состояние держит в chrome.storage через `storage.ts`/`state.ts` — `applicationState` — снапшот в памяти, восстанавливается `loadState()`).
- **offscreen** — единственный `<audio>`-элемент + hls.js. События плеера (`playing`, `pause`, `ended`, `error`, `timeupdate`) транслируются обратно в service-worker сообщениями `AUDIO_PLAYER_*`.

### Режим Firefox

В Firefox offscreen Documents API нет, поэтому **service-worker.js подключается скриптом в offscreen.html** — оба контекста живут в одной фоновой странице. Следствия:

- `service-worker/src/index.ts` детектит режим через доступность `document` (в SW DOM бросает ошибку) и через `commonUtils.offscreenDocumentSupport()`, чтобы не стартовать листенеры дважды.
- Внутри одной страницы `chrome.runtime.sendMessage` не работает как ожидается — обмен между «частями» идёт через CustomEvents на DOM-элементе `#custom-events` (`sendBackgroundMessage` / `addBackgroundMessageListener` в `packages/common/src/utils.ts`). Роутер SW подключает этот мост только при отсутствии offscreen-поддержки.
- `commonUtils.isFirefox()` — сейчас заглушка, возвращающая `false` (см. историю; не полагайся на неё без проверки).

Выбор режима делает build.sh: кладёт `environment-chrome.json` или `environment-firefox.json` как `environment.json`, флаг читается через `commonUtils.offscreenDocumentSupport()` (fetch своего же ресурса + кэш).

## Протокол сообщений

Источник истины — `packages/common/src/types.ts`:

- `MessageTarget`: `SERVICE_WORKER` | `OFFSCREEN` — кому адресовано.
- `MessageType` — enum всех типов; unions `ServiceWorkerMessage` и `OffscreenMessage` — дискриминированные по `target` + `type`.
- Роутеры: `service-worker/src/listeners/messages.ts` и `offscreen/src/listeners/messages.ts` — exhaustive `switch` с `assertUnreachable(message)` в `default`. **Добавил новый тип — компилятор принудит добавить ветку во всех роутерах. Не ослабляй типы, чтобы «пройти» — добавь ветку.**
- Front отправляет через `front/src/shared/lib/send-message.ts` (обёртка над `chrome.runtime.sendMessage`).
- Ошибки через границу — только сериализованные (`serialize-error`), иначе получишь `{}` на другой стороне.

## Состояние

**front (клиент):**
- `shared/lib/atom.ts` — минималистичные атомы без библиотек: `atom()`, `lsAtom()` (localStorage, только string), `storageAtom()` (chrome.storage.local + автосинхронизация между контекстами через `storage.onChanged`, с `mutate`-хуками для side-эффектов). Чтение в React — `useAtomValue`/`useAtom` (useSyncExternalStore).
- Серверные данные — `@tanstack/react-query` (провайдер в `app/Application.tsx`), fetchers на страницах `pages/*/api/fetchers.ts`.
- React 19 живёт только в `packages/front`, но `@types/react(-dom)` объявлены и в корневом `package.json` (devDependencies): при `moduleResolution: "node"` типы VKUI из корневого `node_modules` не находят `@types/react`, вложенный в `packages/front/node_modules` — пропсы VKUI «пустеют» (нет `children`/`className`/`style`). Корневые типы не убирать.
- Важные атомы: `entities/active-track/model/atom.ts` (активный трек), `entities/session` (сессия/токен), `entities/modal`.

**service-worker:**
- `state.ts` — `applicationState` (мутабельный объект в памяти), `storage.ts` — персистенция в chrome.storage. `listeners/storage.ts` синхронизирует SW ↔ front.

## Интеграция с VK

Оба клиента в `packages/common`:

- `vk-api-client.ts` — официальное-подобное API `api.vk.ru/method/*` с web-токеном (app id 6287487): авто-refresh токена, методы аудио.
- `vk-client.ts` — scraping внутренних эндпоинтов vk.ru (FormData, windows-1251→UTF-8). При 401 реконнект: загрузка vk.ru для обновления кук и ретрай.
- Токен/сессия попадает в расширение через `features/sign-in` (vk.ru → kolpak/токен) — там же логика restore.
- `service-worker/src/fetchers/unmask.js` — вендорный минифицированный декодер `audio_api_unavailable` (маскировка URL аудио). Не трогать.
- Поток воспроизведения: SW fetcher `start-playback.ts` получает URL (с unmask при необходимости) → сообщение `PLAY_TRACK` в offscreen → offscreen создаёт `MediaSource`/hls или прямой src → события плеера назад в SW (`AUDIO_PLAYER_*`) → SW обновляет storage → popup перерисовывается.

## Сборка и дистрибуция

- Vite в каждом пакете; общий вход — `./build.sh` (детали в AGENTS.md). `to-publish.sh` — релиз: docker `node:20-alpine`, zip'ы в `vk-audiopad-{chrome,firefox}.zip` + git archive для ревью Mozilla. Ничего из `dist/` не коммитится.
- `manifest.json` генерируется `public/manifest.js` при сборке (аргумент `chrome|firefox`): версия, permissions, commands (глобальные хоткеи), CSP — всё там.
- Реклама срезается declarativeNetRequest: `public/rules/vkcom.json`.

## Карта front (FSD)

- `app/` — Application (VKUI ConfigProvider/AppRoot/SplitLayout), роутер вкладок `Pages.tsx`, react-query.
- `pages/` — вкладки попапа: general, explore, my-music, albums, artist, search-result, current-playlist, playlist-tracks.
- `widgets/` — составные блоки: player (лента управления), navigation, album-list, track-list, banner-gallery, catalog-gallery, recommended-gallery, vk-mix.
- `features/` — пользовательские действия: play-or-pause, shuffle, repeat, search, add-to-queue, add-to-my-music, delete-from-my-music, similar, restore, sign-in, cast-to-status и др.
- `entities/` — доменные модели: active-track, album, modal, recommended-playlist, session, track.
- `shared/` — api, lib (atom, send-message), model, types, ui (переиспользуемые обёртки VKUI).

Импорты только по убыванию слоя, публичный API сегмента — `index.ts` (eslint `@conarti/eslint-plugin-feature-sliced` + `@feature-sliced/eslint-config` следят).

## Известные грабли

- Типы `@vk-audiopad/common` резолвятся из `dist/` — без сборки common typecheck остальных пакетов падает. `npm run check` собирает common первым; при ручных командах помни об этом.
- `service-worker.js` исполняется и как SW (Chrome), и как скрипт в offscreen.html (Firefox) — любые browser-API вызовы должны работать в обоих режимах.
- `@types/node` в дереве (появляется с workspaces) меняет глобальные типы вроде `setTimeout` — используй `ReturnType<typeof setTimeout>`, а не `number`.
- Скрапинг vk.ru хрупок: любое изменение формата ответа (внутренние ключи, хэши) ломается без изменений в коде — при фиксе сравнивай с реальными ответами vk.ru.
- Миграция каталога vk.ru (2026-11) на opaque-токены: страницы `/music/catalog/*` и `/artist/*` больше не содержат `sectionId` в server HTML (SPA). Работающий паттерн: токен берётся из `showAllLink` (`catalogLink.sectionIdFromShowAllLink`) или из `catalog.getAudioArtist` (токен web.api через `vkApiClient`) и подаётся в старый `al_audio.php?act=load_catalog_section`, который отвечает в старом формате (blockIds/playlists/HTML CatalogBlock) — даунстрим `getCatalogBlocks` не меняется. Подробнее: `vkru-scraping.md`.
