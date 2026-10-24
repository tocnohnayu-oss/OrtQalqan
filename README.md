# OrtQalqan

Рабочее место инспектора ЧС: собственные аккаунты, рабочие группы и общая база объектов, конструктор этажей из готовых блоков, разные объекты, последовательный обход, реестр оборудования, предварительный расчёт ОП/ОУ и PDF-отчёт на русском и казахском языках.

Конкурс Smart Inspector. Защита — 6 ноября 2026 года, демонстрация — 3–5 минут.

## Для команды

Начните с [AGENTS.md](AGENTS.md) и [текущего состояния](docs/HANDOFF.md). Решения и ограничения записаны в репозитории, поэтому перечитывать чат не требуется.

| Документ | Содержание |
| --- | --- |
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

План можно перемещать и приближать мышью, клавиатурой и двумя пальцами. Под ним доступно количество ОП/ОУ из актуального расчёта. «Изменить» у помещения в результате открывает его параметры, включая переход на другой этаж. На телефоне выбранная комната автоматически приближается.

Поиск под этажами находит комнаты и номера/модели оборудования на обоих языках. Найденная запись открывается без редактирования. «Обход» продолжает незавершённые ответы, а следующий шаг учитывает выбранные поиск и фильтр.

Сборка: `npm run build`. Проверки ядра и серверных прав/хранения: `npm test`. Браузерный сценарий: `npm run smoke` после установки Chromium для Playwright.

Обучение и демонстрация: [экскурс](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/guide-welcome.png), [учебный план](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/demo-plan.png), [обоснование расчёта](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/demo-result.png), [учебный PDF](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/demo-report-ru.pdf). Короткий показ для защиты — [DELIVERY.md](docs/DELIVERY.md).

Визуальный стиль — полевой атлас: прямые края листов, выразительные заголовки, нумерованные каталоги и терракотовые срезы основных действий. Система и правила продолжения описаны в [BRAND.md](docs/BRAND.md).

Аккаунты и группа: [вход](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/account-entry.png), [общие объекты](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-objects.png), [участники](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-members.png), [журнал](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-activity.png), [телефон · KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/team-mobile-kk.png). Это снимки синтетического CI-сценария, не размещённый сервис.

Новые экраны: [конструктор](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/editor.png), [конструктор на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/editor-mobile.png), [объекты](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/objects.png), [обход](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/inspection.png), [журнал на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/mobile-inspection.png), [знак](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/brand.png).

Актуальный интерфейс: [план объекта](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/identity-plan-desktop.png), [первое помещение](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/desktop-empty.png), [параметры на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/identity-params-mobile-kk.png), [графика шести видов зданий](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/identity-types.png). Демонстрационные отчёты: [RU](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/report-ru.pdf), [KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/report-kk.pdf). Последняя функциональная проверка: [run 40114747070](https://github.com/tocnohnayu-oss/OrtQalqan/actions/runs/40114747070) — 52 проверки ядра, серверные/HTTP тесты, сборка и полный браузерный сценарий, включая визуальное ревью на 320/1024 px.

Сервис предназначен для учебных заведений, офисов, магазинов, складов, производственных и других объектов. Для складского и производственного назначения пока доступны план, обход и реестр; автоматический расчёт требует отдельного проверенного профиля. Шаблоны не выдумывают площади и классы пожара.

Один из демонстрационных объектов — НИШ ЕМН г. Петропавловска. Название и адрес подтверждены публичными источниками школы; помещения, площади, условия и оборудование в демо синтетические. Прототип не является обследованием школы. Подробности — в нормативном исследовании.

Состояние функций и границы нормативной проверки поддерживаются в [HANDOFF.md](docs/HANDOFF.md).
