# DriveM CRM

Моя власна CRM

CRM/ERP для інтернет-магазину автомобільних запчастин. Система об'єднує каталог, склад, замовлення, клієнтів, логістику, ціни й фінансову аналітику для Prom.ua, Rozetka та Епіцентру.

Етап 2 додає локальний каркас CRM із входом, захищеною навігацією, налаштуваннями бізнесу та окремим воркером. Операційні розділи показують статус розробки.

## Локальний запуск

Потрібні Git, Node.js **24.22.3**, **pnpm 11.25.0**, Docker Engine або Docker Desktop у режимі Linux-контейнерів із Docker Compose v2. Команди виконуйте в корені репозиторію. Для Windows є [покрокова інструкція](docs/SETUP.md).

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm env:init
pnpm infra:up
pnpm db:migrate
pnpm owner:create
```

`env:init` створює ігнорований Git файл `.env` із випадковими локальними секретами. Повторний запуск використовує наявний файл. Змінні описані в [.env.example](.env.example). Зберігайте `.env` разом із відповідним середовищем.

Під час `owner:create` введіть електронну пошту, ім’я, назву бізнесу та пароль щонайменше з 12 символів. Введення пароля приховане. Команда створює підтверджений обліковий запис власника й організацію.

Запустіть `pnpm dev` в одному терміналі та `pnpm worker` у другому. Відкрийте **http://127.0.0.1:3000** та увійдіть із даними власника. Перевірте чергу командою `pnpm queue:smoke`. Вебзастосунок має `GET /api/health` на порту 3000, а воркер — `GET /health` на порту 3101.

Для зупинки натисніть Ctrl+C в обох терміналах, потім виконайте `pnpm infra:down`. Іменовані томи зберігають PostgreSQL і Redis.

## Перевірки

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm env:init test
pnpm infra:test:up
pnpm db:migrate:test
pnpm build:test
pnpm test:bundle
pnpm exec playwright-core install chromium
pnpm test:integration
pnpm infra:test:down
```

Тестові PostgreSQL, Auth і Redis мають окремі порти, томи й облікові дані. Набір піднімає production-збірку Next.js і воркер з тестовою конфігурацією. Для наявного Chromium задайте `CHROMIUM_PATH`. `pnpm build` збирає застосунок, `pnpm start` запускає збірку локально. CI виконує перевірки без деплою.

## Типові проблеми

- **Docker не відповідає.** Запустіть Docker Desktop або Docker Engine. Перевірте `docker compose version`.
- **Зайнятий порт.** Перевірте порти 3000, 3101, 54321, 54322 і 16379, а для тестів — 3300, 3102, 55321, 55322 і 17379.
- **Auth або PostgreSQL не готовий.** Виконайте `docker compose -f infra/compose.yml --env-file .env ps`. Запускайте міграції після успішного `infra:up`.
- **Втрачено .env або пароль.** Відновіть файл із захищеної локальної копії. Наявний Docker-том зберігає попередній пароль бази. Скидання пароля через інтерфейс відкладено.
- **Chromium не запускається.** На підтримуваному Linux виконайте `pnpm exec playwright-core install --with-deps chromium`.

## Проєктна документація

| Документ | Зміст |
| --- | --- |
| [PRODUCT_SPEC](docs/PRODUCT_SPEC.md) | Межі продукту, сценарії й вимоги до інтерфейсу |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Модулі, середовища, структура й безпека |
| [DATABASE](docs/DATABASE.md) | Реляційна модель, транзакції складу та фінанси |
| [INTEGRATIONS](docs/INTEGRATIONS.md) | Адаптери, імпорт, синхронізація й дозвіл на запис |
| [ROADMAP](docs/ROADMAP.md) | Етапи, критерії приймання й ризики |
| [SETUP](docs/SETUP.md) | Покрокове налаштування Windows |
| [AGENTS](AGENTS.md) | Правила роботи в репозиторії |
