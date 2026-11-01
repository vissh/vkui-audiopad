# Как работать с vk.ru (для ИИ-агентов)

Практические знания о внутренностях vk.ru, накопленные при фиксе каталога (ноябрь 2026).
Для задач вида «в vk.ru появилась фича X, добавим в расширение» — читай это первым.

Смежное: `architecture.md` (как устроено расширение), `testing.md` (живой смок, бейзлайн консоли).

## Два семейства API vk.ru

| | Legacy `al_audio.php` (vk.ru) | Token API (`api.vk.ru` / `web.api.vk.ru` `/method/*`) |
|---|---|---|
| Авторизация | куки (remixsid), без токена | `access_token` из `login.vk.ru/?act=web_token` |
| Клиент в репо | `vkClient.request` (common/vk-client.ts, FormData + windows-1251) | `vkApiClient.request` (common/vk-api-client.ts; кеш токена в chrome.storage, авторефреш по error 5) |
| Формат ответа | `<!--{"payload":[...]}`: `[1][0]` — HTML (CatalogBlock-разметка), `[1][1]` — JSON `{blockIds, playlists, sectionId, nextFrom}` | чистый JSON (`response.catalog.sections[].blocks[]`, `audios_ids`, `next_from`) |
| Когда использовать | всегда, когда эндпоинт существует | когда у legacy нет нужного `act` (артисты и подстраницы) |

- Legacy-эндпоинты продолжают отвечать в старом формате, даже когда сайт сам ими не пользуется.
  Известные `act`: `section` (поиск: `section=search, q, owner_id`), `load_catalog_section` (`section_id`, `start_from`).
- Token API: `catalog.getAudioArtist` (артист + подстраницы через параметр `url`), `catalog.getAudio`
  (блоки страницы музыки `/audios<id>?section=<name>&block=<block>` — Главная/Обзор/Моя музыка),
  `catalog.getSection` (страницы `/music/catalog/*`, сайт зовёт через `batch.call`).
  Паттерн единый: методу передаётся `url` страницы + `need_blocks=1` → `response.catalog.sections[0].id`.
  Хосты `api.vk.ru` и `web.api.vk.ru` взаимозаменяемы; `app_id` = `VK_APP_ID` из vk-api-client.ts (6287487).
- Токен получается чисто по кукам: `POST login.vk.ru/?act=web_token` (`version=1&app_id=6287487`) →
  `{data: {access_token, expires, user_id}}`. Инфраструктура уже в `vkApiClient` — не изобретай свою.

## Каталог: opaque-токены и рабочий паттерн

vk.ru перевёл каталог на opaque-токены (`PUl...`, алфавит `[\w-]+`). Токен = `section_id`
в обоих семействах API. **Server HTML больше не содержит данных каталога** (`/music/catalog/*`,
`/artist/*` — SPA-шелл; `"sectionId"` там нет вообще).

Рабочий паттерн (реализован в `catalogLink` + `getArtistCatalogSectionId`):

1. Взять токен:
   - из ссылки `/audio?section=...&type=<токен>` или `/music/catalog/<токен>` → `catalogLink.sectionIdFromShowAllLink`;
   - для артиста/подстраницы (`/artist/<id>[/releases|/featuring_releases|top_audios]`) —
     `vkApiClient.getArtistCatalogSectionId(artistId, pageUrl?)` (внутри `catalog.getAudioArtist`;
     `url` выбирает подстраницу, без `url` — главная секция артиста);
   - для блоков вкладок Главная/Обзор/Моя музыка (`/audios<id>?section=<name>&block=<block>`) —
     `catalogLink.parseAudioSectionShowAllLink` + `vkApiClient.getAudioCatalogSectionId(url)`
     (внутри `catalog.getAudio`);
   - диспетчеризация всех трёх форматов — `resolveSectionId` в `pages/albums/api/fetchers.ts`;
2. Скармилить токен в `al_audio.php?act=load_catalog_section`;
3. Ответ парсится существующим `getCatalogBlocks` — даунстрим (рендеринг) не меняется.

Форматы ссылок «Показать все», встречающиеся в дикой природе:

| Откуда | Формат | Где появляется |
|---|---|---|
| AJAX-ответ поиска (`section=search`) | `/audio?section=recoms_block&type=<токен>` | HTML в payload `[1][0]`, класс `audio_page_block__show_all_link` |
| AJAX-ответы вкладок (`section=general` / `all` / `explore`) | `/audios<id>?section=<имя>&block=<блок>` (напр. `block=editors_choice`, `stay_on_trend`, `new_albums`) | там же; токена в ссылке нет — резолвить через `catalog.getAudio` с url |
| Живой DOM сайта (vkit-компоненты) | `/music/catalog/<токен>` | не используется расширением, но валиден как источник токена |
| Страница артиста | `/artist/<id>/{releases,featuring_releases,top_audios,videos,related}` | токена нет — резолвить через API |
| Прочее (рекламные онбординги и т.п.) | `https://vk.com/audio?popup=...` | не каталог; парсер вернёт null → ошибка (осознанно fail-loud) |

Нюанс: контент вкладок (особенно «Обзор») **персонализирован** — набор блоков у разных аккаунтов разный
(например, «VK Акустика» есть не у всех). Парсер должен быть привязан к **формату** ссылки, а не к имени
блока; полноту покрытия проверяй пробой API-ответа (классифицируй все show_all ссылки), а не поголовным
кликом по блокам.

## Живой DOM vs скрейпинг: почему у сайта классы другие

Сайт отрендерен SPA-компонентами с хэшированными классами `vkit-*` — старых
`audio_page_block__show_all_link`, `CatalogBlock__title` в живом DOM **нет**.
Они существуют только в HTML внутри legacy-ответов `al_audio.php`. Поэтому:
- не пугайся, что на живой странице «нет классов, которые парсит расширение» — это нормально;
- не надо парсить живой DOM сайта — парси AJAX-ответы legacy-эндпоинтов.

## Как расследовать изменения vk.ru (методичка)

1. **Сессия**: на vk.ru проверяй залогиненность по `window.vk.id` или `#top_profile_link`
   (не по `document.cookie` — `remixsid` httpOnly и там не виден).
2. **SPA-ленивость**: XHR данных каталога стреляют только в активной foreground-вкладке,
   hard-load многих страниц даёт SSR без XHR (артист — именно такой). Чтобы увидеть XHR
   страницы артиста: открой `/audios<id>` → кликни ссылку артиста в треке (SPA-переход) → смотри сеть.
3. **Сеть**: `list_network_requests` (xhr/fetch) → интересное в `batch.call` (тело запроса содержит
   массив подвызовов) → `get_network_request`. Ответы каталога 0.5–1.2 МБ — не дампить целиком,
   щупай счётчиками/регексами.
4. **Пробы эндпоинтов** — `evaluate_script` с `fetch` из контекста страницы vk.ru (`credentials: 'include'`):
   куки применяются сами; для token API сначала получи токен (см. выше).
   Внимание: регексы в `evaluate_script` гонят через двойное экранирование — для извлечения из
   экранированного JSON надёжнее indexOf-подход, а не регекс.
5. **Сравнивай с расширением**: что именно получает расширение — см. `getCatalogBlocks` и
   `parse-html-block.ts` (что парсится), потом ищи то же в новых ответах.
6. **Правишь парсер формата ссылок — проверь ВСЕ источники**: у расширения четыре источника
   show_all ссылок (`act=section` с `section=search|general|all|explore` + страница артиста).
   Проб каждый ответ (методичка выше), классифицируй форматы и убедись, что парсер покрывает все.
   Урок фикса каталога: первый фикс закрыл только поиск — ссылки «Обзора»/артиста оказались другими форматами.

## Как добавить фичу «в vk.ru появилось X»

1. Найди, откуда живой vk.ru берёт данные для X (методичка выше; обычно `batch.call` или `al_audio.php`).
2. Приоритет источников: legacy `al_audio.php` (проще, куки) → token API через `vkApiClient.request`.
   Если нужно новое VK API-поле/метод — правки в `common` (там все клиенты), не во front.
3. Расширение: `common` (клиент/типы) → front по FSD (page/feature, react-query + fetcher, атомы для UI-состояния).
4. Верификация: `npm run check` → `./build.sh` → скопировать `dist/chrome_extension` в `dist/` основного клона
   (MCP ставит расширения только внутри workspace root) → `install_extension` → `trigger_extension_action`
   → воспроизвести сценарий в попапе → консоль против бейзлайна (CSP/CORB-спам — норма).
5. Скрейпинг хрупок: любое «безобидное» изменение формата — сверяйся с реальными ответами,
   не с предположениями. `vk-client.ts` не рефакторить (windows-1251 перекодировка).
