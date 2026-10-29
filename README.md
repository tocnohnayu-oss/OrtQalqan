# OrtQalqan

Рабочее место инспектора ЧС: вращаемая 3D-модель здания, рабочие слои осмотра/расчёта, быстрый поиск, собственные аккаунты, рабочие группы и общая база объектов, конструктор этажей из готовых блоков, разные объекты, последовательный обход, лист внимания по всему объекту, реестр оборудования, предварительный расчёт ОП/ОУ и PDF-отчёт на русском и казахском языках.

В **«Обход → Лист внимания»** собраны конкретные наблюдения и оборудование со сроками. Поиск и фильтр приводят к точному помещению/номеру; CSV выгружает весь лист, обычный PDF включает приложение из снимка. Неизвестное состояние и отсутствующая дата отделены как уточнение данных.

Материалы на синтетических данных: [лист внимания](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/attention-desktop.png), [сроки](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/attention-dates-desktop.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/attention-mobile-kk.png), [PDF с приложением · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/attention-report-kk.pdf).

**«Что изменилось»** связывает правку и новый комплект: один план с переключателем источника, значения до/после и явное обновление результата. Список помещений раскрывается по нажатию на выбранное имя. Исходный результат сохраняется в рамках текущего сеанса, устаревший PDF защищён от выгрузки. Контракт — [CHANGE_REVIEW.md](docs/CHANGE_REVIEW.md).

Конкурс Smart Inspector. Защита — 6 ноября 2026 года, демонстрация — 3–5 минут.

Новый маршрут: **«Здание → План → Обход»**. Обзор показывает цельную 3D-модель по введённым контурам: вращение мышью/пальцами, масштаб и разрез выбранного этажа. Слои связывают план с сохранёнными осмотрами и актуальным расчётом; **Ctrl/⌘ K** находит помещение или конкретную запись оборудования. Размеры, площади и журнал не меняются при навигации.

В 3D можно найти помещение в списке или нажать его название, выделить/приблизить контур и открыть исходный осмотр либо параметры. **«Развернуть»** отдаёт модели окно; этаж, комната и слои остаются под рукой на компьютере и телефоне. Зоны без контуров явно обозначены.

Рабочий экран упрощён: белые поверхности, обычная рабочая типографика, компактный каталог настоящих этажей, минимум рамок/подложек и объединённое управление камерой. 3D-обзор показывает здание без вспомогательной сетки. Новый вид: [компьютер](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/workspace-desktop.png), [разрез и выбранная комната](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/workspace-cutaway-desktop.png), [планшет · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/workspace-tablet-kk.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/workspace-mobile-kk.png), [параметры на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/workspace-parameters-mobile-kk.png). Причины и критерии — `docs/DESIGN_REWORK.md`; все примеры синтетические.

Поиск теперь предлагает два действия: открыть точную запись и показать расположение комнаты в 3D либо на плане. Слой модели сохраняется; изображение на смешанном этаже не заменяется чужим контуром. «Показать ещё» открывает записи после первых 40, номер и модель проверяются у одного огнетушителя. [Поиск на ПК](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/search-location-desktop.png) · [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/search-location-mobile-kk.png) · [найденная комната в 3D](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/search-location-model-mobile-kk.png).

«Исходные записи» выбранной комнаты открывают её наблюдения/сроки в прежнем листе внимания. Оттуда можно показать настоящий контур в 3D или открыть точное оборудование. После правки параметров и возврата к «Зданию» восстанавливаются камера, выбор и режим текущего сеанса. Метки изображений сохраняют 2D-маршрут; CSV по-прежнему выгружает весь объект.

Продолжение работы: [модель и выбор комнаты](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/continuity-model-desktop.png), [исходная запись](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/continuity-sources-desktop.png), [модель · 320 px KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/continuity-model-mobile-kk.png), [компактный лист комнаты · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/continuity-sources-mobile-kk.png).

Работа с помещениями: [обзор](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/model-workspace-desktop.png), [развёрнутый разрез](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/model-room-desktop.png), [3D на телефоне · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/model-focus-mobile-kk.png), [выбранная комната · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/model-room-mobile-kk.png). Данные синтетические.

Обзор: [3D-модель здания](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/building-atlas-desktop.png), [слой осмотра](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/building-atlas-field-desktop.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/building-atlas-mobile-kk.png), [быстрый поиск](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/global-search-desktop.png).

## Для команды

Начните с [AGENTS.md](AGENTS.md) и [текущего состояния](docs/HANDOFF.md). Решения и ограничения записаны в репозитории, поэтому перечитывать чат не требуется.

| Документ | Содержание |
| --- | --- |
| [Атлас здания и поиск](docs/BUILDING_ATLAS.md) | 3D, разрез, источники геометрии, камера, Ctrl/⌘ K и проверки |
| [Поиск и расположение](docs/SPATIAL_SEARCH.md) | Два действия, точный Asset.id/модель, порции по 40, native focus и touch |
| [Продукт](docs/PRODUCT.md) | Пользователь, сценарий, поля ввода, функции |
| [Дизайн и экраны](docs/EXPERIENCE.md) | Визуальная система, графика, мобильный интерфейс |
| [Бренд и визуальное ревью](docs/BRAND.md) | Светлая тема, айдентика полевого атласа, иллюстрации и сравнение с другими продуктами |
| [Аккаунты и база](docs/ACCOUNTS.md) | Запуск сервера, группы, роли, назначения, API и конфликты версий |
| [Инструкция](docs/ONBOARDING.md) | Первый запуск, экскурc по пяти действиям, подписи входа |
| [Подготовка к жюри](docs/JURY_REVIEW.md) | Что показать за четыре минуты, учебный объект и честные границы готовности |
| [Конструктор этажа](docs/FLOOR_EDITOR.md) | Тематические блоки, автоматическая обстановка, размеры, поворот, SVG/PDF |
| [Объекты и полевой журнал](docs/FIELD_WORKFLOW.md) | Библиотека объектов, шаблоны, осмотр, оборудование, сроки, CSV/PDF |
| [Исследование сценариев](docs/RESEARCH_SCENARIOS.md) | Шесть ситуаций, восемь иллюстраций и наблюдения инспектора |
| [Нормативное исследование](docs/NORMATIVE_RESEARCH.md) | Источники, границы расчёта, вопросы для проверки |
| [Архитектура](docs/TECHNICAL_PLAN.md) | Модули, данные, PDF, хранение |
| [План и демонстрация](docs/DELIVERY.md) | Этапы, критерии готовности, сценарий защиты |
| [Решения](docs/DECISIONS.md) | Что согласовано, что предложено, что отложено |

## Запуск

```sh
npm install
npm run dev
```

После запуска откройте адрес Vite, обычно `http://127.0.0.1:5173`. Требуется Node.js **24.14+**. Vite сам обслуживает интерфейс и API с SQLite на одном порту. Отдельный процесс API на 8787 для разработки не нужен. Если Vite уже запущен старой версией, остановите его (Ctrl+C) и снова выполните `npm run dev`. Проверка подключения: `http://127.0.0.1:5173/api/health` должна вернуть JSON с `ready: true`.

Собранный проект с сервером: `npm run build`, затем `npm start`; адрес `http://127.0.0.1:8787`. `npm run preview` запускает собранный интерфейс и API для просмотра на 4173. Параметры внешнего HTTPS origin и постоянного диска описаны в [ACCOUNTS.md](docs/ACCOUNTS.md). Сейчас общего размещённого сервера нет; база при локальном запуске находится в `var/ortqalqan.sqlite`.

Быстрое знакомство: **«Инструкция» → «Открыть учебный пример» → «Рассчитать»**. Учебный объект открывается отдельной копией с готовым планом, без регистрации. Результат показывает количества ОП/ОУ, исходные числа, округление и неподдержанные случаи, затем позволяет скачать PDF. Это предварительный профиль прототипа; экспертная нормативная проверка не завершена.

План можно перемещать и приближать мышью, клавиатурой и двумя пальцами. **«Развернуть план»** открывает рабочий лист на всю область окна, сохраняя камеру; «К объекту»/Escape возвращают к странице. На телефоне список комнат раскрывается кнопкой поиска. В конструкторе повороты находятся под чертежом рядом с масштабом; там же показаны выбранная комната и угол.

Под планом доступно количество ОП/ОУ из актуального расчёта. «Изменить» у помещения в результате открывает его параметры, включая переход на другой этаж. На телефоне выбранная комната автоматически приближается.

Названия и площади на чертеже сохраняют читаемый размер при уменьшении этажа. Узкие комнаты получают выноски, длинные названия — перенос строк. Нажатие на выноску открывает её помещение; на плотном плане появляется подсказка приближения. SVG и PDF используют тот же алгоритм размещения подписей.

Поиск под этажами находит комнаты и номера/модели оборудования на обоих языках. Найденная запись открывается без редактирования. «Обход» продолжает незавершённые ответы, а следующий шаг учитывает выбранные поиск и фильтр.

В параметрах комнаты видны этаж и её введённый контур; стрелки переключают помещения текущего этажа. Площадь чертежа показана отдельно от расчётной. «Обновить результат» пересчитывает объект, сохраняя комнату открытой, а «Показать на плане» возвращает к её форме или существующей метке изображения. Наличие редактируется рядом с результатом и не заполняется реестром автоматически.

Сборка: `npm run build`. Проверки ядра и серверных прав/хранения: `npm test`. Браузерный сценарий: `npm run smoke` после установки Chromium для Playwright.

Обучение и демонстрация: [экскурс](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/guide-welcome.png), [учебный план](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/demo-plan.png), [обоснование расчёта](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/demo-result.png), [учебный PDF](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/demo-report-ru.pdf). Короткий показ для защиты — [DELIVERY.md](docs/DELIVERY.md).

Визуальный стиль — полевой атлас: прямые края листов, выразительные заголовки, нумерованные каталоги и терракотовые срезы основных действий. Система и правила продолжения описаны в [BRAND.md](docs/BRAND.md).

На компьютере каталог этажей выделен чернильным цветом, а план остаётся светлым. Помещения получили собственные предметные символы, выбранные по типу блока. На телефоне используются светлые строки навигации с подчёркиванием выбранной комнаты.

Аккаунты и группа: [вход](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/account-entry.png), [общие объекты](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-objects.png), [участники](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-members.png), [журнал](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-activity.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-mobile-kk.png). Это снимки синтетического CI-сценария, не размещённый сервис.

Новые экраны: [конструктор](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/editor.png), [конструктор на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/editor-mobile.png), [объекты](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/objects.png), [обход](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/inspection.png), [журнал на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/mobile-inspection.png), [знак](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/brand.png).

Новый визуальный слой: [рабочий экран](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/signature-desktop.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/signature-mobile-kk.png), [собственные символы помещений](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/signature-symbols.png). Галерея символов — материал визуальной проверки, не отдельный экран сервиса.

Лист помещения: [компьютер](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/room-context-desktop.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/room-context-mobile-kk.png), [результат в параметрах](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/room-result-mobile-kk.png), [зона без формы](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/room-unplaced-mobile-kk.png).

Читаемость плана: [компьютер](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/labels-desktop.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/labels-mobile-kk.png), [выбранная комната](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/labels-selected-mobile-kk.png), [конструктор · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/labels-editor-mobile-kk.png).

Рабочий лист и обновлённый каталог: [развёрнутый план](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/folio-focus-desktop.png), [конструктор](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/folio-editor-desktop.png), [план на телефоне · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/folio-focus-mobile-kk.png), [поворот на телефоне · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/folio-editor-mobile-kk.png). Все данные снимков синтетические.

Актуальный интерфейс: [план объекта](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/identity-plan-desktop.png), [первое помещение](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/desktop-empty.png), [параметры на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/identity-params-mobile-kk.png), [графика шести видов зданий](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/identity-types.png). Демонстрационные отчёты: [RU](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/report-ru.pdf), [KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/report-kk.pdf).

Последняя функциональная проверка: [run 40922595598](https://github.com/tocnohnayu-oss/OrtQalqan/actions/runs/40922595598) — 98 доменных тестов, серверные/HTTP проверки, сборка и полный браузерный сценарий. В `review/checks.json` passed=true, 99 пунктов и SHA `274611ebc34bc44e5c7693f17b832ba95f082534`. Проверены светлый каталог плана, контраст обычных/выбранных записей и фокуса, 320 px KK, WebGL/камера, источники/сравнение, PDF, редактор, обход и аккаунты. Вручную просмотрены шесть итоговых экранов: [план](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/signature-desktop.png), [параметры](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/signature-room-desktop.png), [план на телефоне · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/signature-mobile-kk.png), модель на телефоне, обоснование расчёта и результат в мобильных параметрах. Подготовка/контекст — [MINIMAL_UI.md](docs/MINIMAL_UI.md) и `docs/HANDOFF.md`.

Сервис предназначен для учебных заведений, офисов, магазинов, складов, производственных и других объектов. Для складского и производственного назначения пока доступны план, обход и реестр; автоматический расчёт требует отдельного проверенного профиля. Шаблоны не выдумывают площади и классы пожара.

Один из демонстрационных объектов — НИШ ЕМН г. Петропавловска. Название и адрес подтверждены публичными источниками школы; помещения, площади, условия и оборудование в демо синтетические. Прототип не является обследованием школы. Подробности — в нормативном исследовании.

Состояние функций и границы нормативной проверки поддерживаются в [HANDOFF.md](docs/HANDOFF.md).
