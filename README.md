# OrtQalqan

Рабочее место инспектора ЧС: конструктор этажей из готовых блоков, разные объекты, последовательный обход, реестр оборудования, предварительный расчёт ОП/ОУ и PDF-отчёт на русском и казахском языках.

Конкурс Smart Inspector. Защита — 6 ноября 2026 года, демонстрация — 3–5 минут.

## Для команды

Начните с [AGENTS.md](AGENTS.md) и [текущего состояния](docs/HANDOFF.md). Решения и ограничения записаны в репозитории, поэтому перечитывать чат не требуется.

| Документ | Содержание |
| --- | --- |
| [Продукт](docs/PRODUCT.md) | Пользователь, сценарий, поля ввода, функции |
| [Дизайн и экраны](docs/EXPERIENCE.md) | Визуальная система, графика, мобильный интерфейс |
| [Бренд и визуальное ревью](docs/BRAND.md) | Светлая тема, айдентика полевого атласа, иллюстрации и сравнение с другими продуктами |
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

После запуска откройте адрес Vite, обычно `http://127.0.0.1:5173`. Для сборки требуется Node.js, совместимый с Vite 7 (например, Node 22.12+).

Сборка: `npm run build`. Проверки расчётного ядра: `npm test`. Браузерный сценарий: `npm run smoke` после установки Chromium для Playwright.

Первая сборка и проверки браузера [прошли в GitHub Actions](https://github.com/tocnohnayu-oss/OrtQalqan/actions/runs/39940598222). Готовая сборка, снимки экрана и примеры PDF доступны в [артефакте проверки](https://github.com/tocnohnayu-oss/OrtQalqan/actions/runs/39940598222/artifacts/12496071631).

Новые экраны: [конструктор](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/editor.png), [конструктор на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/editor-mobile.png), [объекты](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/objects.png), [обход](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/inspection.png), [журнал на телефоне](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/mobile-inspection.png), [знак](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/brand.png).

Актуальный интерфейс: [рабочее место](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/desktop.png), [мобильный лист параметров](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/mobile-room.png), [сценарии](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/scenarios.png). Демонстрационные отчёты: [RU](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/report-ru.pdf), [KK](https://github.com/tocnohnayu-oss/OrtQalqan/blob/design-review/review/report-kk.pdf). Последняя функциональная проверка: [run 40072643274](https://github.com/tocnohnayu-oss/OrtQalqan/actions/runs/40072643274): 38 проверок, сборка и полный браузерный сценарий.

Сервис предназначен для учебных заведений, офисов, магазинов, складов, производственных и других объектов. Для складского и производственного назначения пока доступны план, обход и реестр; автоматический расчёт требует отдельного проверенного профиля. Шаблоны не выдумывают площади и классы пожара.

Один из демонстрационных объектов — НИШ ЕМН г. Петропавловска. Название и адрес подтверждены публичными источниками школы; помещения, площади, условия и оборудование в демо синтетические. Прототип не является обследованием школы. Подробности — в нормативном исследовании.

Состояние функций и границы нормативной проверки поддерживаются в [HANDOFF.md](docs/HANDOFF.md).
