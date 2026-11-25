# Запуск DriveM CRM на Windows

## 1. Встановіть програми

1. Встановіть [Git for Windows](https://git-scm.com/download/win), [Node.js 24.22.3](https://nodejs.org/en/download) і [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/).
2. У Docker Desktop використовуйте WSL 2 та Linux-контейнери. Якщо Windows попросить встановити WSL, відкрийте PowerShell від адміністратора, виконайте `wsl --install` і перезавантажте комп’ютер за запитом.
3. Запустіть Docker Desktop. Дочекайтеся готовності, відкрийте новий PowerShell і виконайте команди по одному рядку. Варіант `pnpm.cmd` також працює, якщо PowerShell блокує файли `.ps1`.

```powershell
git --version
node --version
docker compose version
npm.cmd install --global pnpm@11.25.0
pnpm.cmd --version
```

## 2. Підготуйте папку проєкту

Якщо у вас уже є локальна копія цієї версії CRM, відкрийте її папку в PowerShell. Для отримання через GitHub переконайтеся, що поточну версію проєкту опубліковано й що у вас є доступ до репозиторію.

```powershell
git clone https://github.com/emxwaa/CRM-DriveM.git
cd CRM-DriveM
```

У папці мають бути `package.json`, `pnpm-lock.yaml` і підпапка `infra`. Якщо команда завершується помилкою, виправте її перед наступним кроком.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd env:init
pnpm.cmd infra:up
pnpm.cmd db:migrate
```

Перший запуск завантажує образи Docker і може тривати кілька хвилин. Збережіть створений файл `.env` для повторних запусків. Він містить локальні секрети. Не надсилайте його в чат і не додавайте до Git.

## 3. Створіть власника

```powershell
pnpm.cmd owner:create
```

Вкажіть пошту, ім’я власника, назву бізнесу й пароль. Виберіть пароль від 12 символів і до 72 байтів. Символи пароля не відображаються. Натисніть Enter, повторіть пароль і дочекайтеся повідомлення про створення власника. Підтвердження пошти листом для цього локального облікового запису не потрібне.

## 4. Запустіть CRM і воркер

Запустіть застосунок у першому вікні PowerShell і залиште вікно відкритим.

```powershell
pnpm.cmd dev
```

Відкрийте **http://127.0.0.1:3000** і введіть пошту та пароль власника. Головна покаже назву бізнесу. Для виходу відкрийте меню користувача у верхній панелі й натисніть **Вийти**.

У другому вікні PowerShell перейдіть у ту саму папку й виконайте `pnpm.cmd worker`. У третьому вікні виконайте `pnpm.cmd queue:smoke`. Успішний результат містить `applied` після двох спроб і `duplicate` для повторної доставки. Відповідь `{"status":"ok"}` на **http://127.0.0.1:3000/api/health** та **http://127.0.0.1:3101/health** означає готовність відповідного процесу.

## 5. Перевірте код і зупиніть сервіси

Базові перевірки виконуйте командами `pnpm.cmd lint`, `pnpm.cmd typecheck`, `pnpm.cmd test` і `pnpm.cmd build`. Для перевірок із Chromium спочатку зупиніть dev-сервер, щоб звільнити директорію збірки, і запустіть ізольований тестовий стек.

```powershell
pnpm.cmd env:init test
pnpm.cmd infra:test:up
pnpm.cmd db:migrate:test
pnpm.cmd build:test
pnpm.cmd test:bundle
pnpm.cmd exec playwright-core install chromium
pnpm.cmd test:integration
pnpm.cmd infra:test:down
```

Щоб зупинити звичайний стек, натисніть Ctrl+C у вікнах web і worker та виконайте `pnpm.cmd infra:down`. Дані залишаються в іменованих томах. Під час повторного запуску достатньо `infra:up`, `db:migrate`, `dev` і `worker`. Власника створюють один раз.

## Якщо щось не працює

- Якщо `pnpm.cmd` недоступна після встановлення, відкрийте нове вікно PowerShell і перевірте `node --version` та `pnpm.cmd --version`.
- Якщо Docker повідомляє про відсутній рушій, відкрийте Docker Desktop, дочекайтеся готовності й повторіть `pnpm.cmd infra:up`.
- Перевірте стан контейнерів командою `docker compose -f infra/compose.yml --env-file .env ps`. Статус `unhealthy` означає, що відповідна залежність ще не готова.
- Якщо браузер показує помилку з’єднання, перевірте адресу **http://127.0.0.1:3000** й переконайтеся, що `pnpm.cmd dev` продовжує працювати.
- Якщо вхід відхилено, перевірте пошту, розкладку клавіатури та результат `owner:create`.
