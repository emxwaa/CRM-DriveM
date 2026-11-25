import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as pause } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { authConfig, databaseUrl, localDatabase, mode, required } from "@drivem/config";
import { asUser, connect } from "@drivem/db";
import { enqueueSmoke, openQueue, waitForSmoke } from "@drivem/worker";
import { chromium, type Browser, type Page } from "playwright-core";

assert.equal(mode(), "test", "Use the isolated test Compose stack");
const auth = authConfig();
assert.equal(auth.url, "http://127.0.0.1:55321");
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(auth.url, required("SUPABASE_SERVICE_ROLE_KEY"), clientOptions);
const anon = createClient(auth.url, auth.key, clientOptions);
const db = connect(localDatabase());
const web = connect(databaseUrl("DATABASE_WEB_URL", "crm_web"), 1);
const workerDb = connect(databaseUrl("DATABASE_WORKER_URL", "crm_worker"), 1);
const base = "http://127.0.0.1:3300";
const children: ChildProcess[] = [];
const actors: string[] = [];
const orgs: string[] = [];
let browser: Browser;

function launch(args: string[], cwd = process.cwd()) {
  const env = { ...process.env };
  for (const key of ["DATABASE_MIGRATION_URL", "SUPABASE_SERVICE_ROLE_KEY", "GOTRUE_JWT_SECRET",
    "GOTRUE_DB_PASSWORD", "POSTGRES_PASSWORD", "WEB_DB_PASSWORD", "WORKER_DB_PASSWORD"]) delete env[key];
  const child = spawn(process.execPath, args, { cwd, env, stdio: ["ignore", "inherit", "inherit"] });
  children.push(child);
  return child;
}

async function waitForHealth(url: string, process: ChildProcess) {
  for (let attempt = 0; attempt < 80; attempt++) {
    assert.equal(process.exitCode, null, "Service exited before readiness");
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (response?.ok) return;
    await pause(250);
  }
  assert.fail("Service failed its readiness probe");
}

async function user() {
  const email = `foundation-${randomUUID()}@example.test`;
  const password = randomBytes(24).toString("hex");
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(error?.code, undefined, "Test Auth admin could not create fixture");
  assert.ok(data.user);
  actors.push(data.user.id);
  return { id: data.user.id, email, password };
}

let owner: Awaited<ReturnType<typeof user>>;
let viewer: Awaited<ReturnType<typeof user>>;
let outsider: Awaited<ReturnType<typeof user>>;
let orgId: string;
let foreignId: string;

before(async () => {
  owner = await user();
  viewer = await user();
  outsider = await user();
  const [org] = await db<{ id: string }[]>`insert into crm.organizations(name) values ('Тестовий простір DriveM') returning id`;
  orgId = org.id;
  orgs.push(orgId);
  const [foreign] = await db<{ id: string }[]>`insert into crm.organizations(name) values ('Інша тестова організація') returning id`;
  foreignId = foreign.id;
  orgs.push(foreignId);
  await db`insert into crm.business_settings(org_id) values (${orgId}), (${foreignId})`;
  await db`insert into crm.profiles values (${owner.id}, 'Тестовий власник'), (${viewer.id}, 'Тестовий спостерігач')`;
  await db`insert into crm.memberships (org_id, auth_user_id, role) values (${orgId}, ${owner.id}, 'owner'), (${orgId}, ${viewer.id}, 'viewer')`;

  const next = launch([resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3300"], resolve("apps/web"));
  const worker = launch(["--import", "tsx", "apps/worker/src/main.ts"]);
  await Promise.all([
    waitForHealth(`${base}/api/health`, next),
    waitForHealth(`http://127.0.0.1:${required("WORKER_HEALTH_PORT")}/health`, worker),
  ]);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
});

after(async () => {
  try {
    await browser?.close();
    for (const child of children) {
      if (child.exitCode !== null || child.signalCode !== null) continue;
      const exited = new Promise<void>((done) => child.once("exit", () => done()));
      child.kill("SIGTERM");
      const controller = new AbortController();
      try {
        await Promise.race([exited, pause(8000, undefined, { signal: controller.signal }).then(() => { child.kill("SIGKILL"); return exited; })]);
      } finally {
        controller.abort();
      }
    }
    for (const id of actors) await admin.auth.admin.deleteUser(id);
    for (const id of orgs) {
      await db`delete from crm.business_settings where org_id = ${id}`;
      await db`delete from crm.organizations where id = ${id}`;
    }
  } finally {
    await Promise.all([db.end(), web.end(), workerDb.end()]);
  }
});

async function session(run: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  try {
    await run(await context.newPage());
  } finally {
    await context.close();
  }
}

async function screenshot(page: Page, file: string) {
  const directory = process.env.SCREENSHOT_DIR;
  if (directory) {
    await mkdir(directory, { recursive: true });
    await page.screenshot({ path: resolve(directory, file) });
  }
}

async function login(page: Page, actor: typeof owner, target: string) {
  await page.goto(`${base}/login`);
  await page.getByLabel("Електронна пошта").fill(actor.email);
  await page.getByLabel("Пароль", { exact: true }).fill(actor.password);
  await page.getByRole("button", { name: "Увійти" }).click();
  await page.waitForURL(`${base}${target}`);
}

test("PostgreSQL RLS scopes membership, profiles and settings and clears pooled context", async () => {
  assert.equal((await web`select * from crm.memberships`).length, 0);
  assert.equal((await asUser(web, owner.id, foreignId, async (sql) => sql`select * from crm.organizations`)).length, 0);
  assert.equal((await asUser(web, owner.id, foreignId, async (sql) => sql`select * from crm.business_settings`)).length, 0);
  assert.equal((await asUser(web, owner.id, orgId, async (sql) => sql`select * from crm.business_settings`)).length, 1);
  assert.equal((await asUser(web, viewer.id, orgId, async (sql) => sql`select * from crm.business_settings`)).length, 0);
  assert.equal((await asUser(web, viewer.id, orgId, async (sql) => sql`select * from crm.profiles where auth_user_id = ${owner.id}`)).length, 0);
  assert.equal((await web`select * from crm.organizations`).length, 0);
  await assert.rejects(workerDb`select * from crm.memberships`, { code: "42501" });
});

test("web and worker report readiness, queue retries and deduplicates the PostgreSQL effect", async () => {
  const queue = openQueue();
  queue.on("error", () => {});
  const operation = randomUUID();
  try {
    const job = await enqueueSmoke(queue, operation, true);
    assert.deepEqual(await waitForSmoke(queue, job), { status: "applied", attempts: 2 });
    const duplicate = await enqueueSmoke(queue, operation);
    assert.notEqual(duplicate.id, job.id);
    assert.deepEqual(await waitForSmoke(queue, duplicate), { status: "duplicate", attempts: 1 });
    const [row] = await workerDb<{ count: number }[]>`select count(*)::int as count from crm_jobs.smoke_effects where operation_id = ${operation}`;
    assert.equal(row.count, 1);
  } finally {
    await queue.close();
    await db`delete from crm_jobs.smoke_effects where operation_id = ${operation}`;
  }
});

test("unauthenticated users are redirected and public signup is disabled", async () => {
  for (const path of ["/", "/orders", "/settings"]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "/login");
  }
  const { error } = await anon.auth.signUp({ email: `public-${randomUUID()}@example.test`, password: randomBytes(24).toString("hex") });
  assert.equal(error?.code, "signup_disabled");
  await session(async (page) => {
    await page.goto(`${base}/login`);
    await page.getByRole("heading", { name: "Вхід у DriveM CRM" }).waitFor();
    await screenshot(page, "drivem-login.png");
  });
});

test("owner can sign in, reload, see settings and sign out", async () => {
  await session(async (page) => {
    await login(page, owner, "/");
    await page.getByRole("heading", { name: "Головна" }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Вітаємо, Тестовий власник!" }).waitFor();
    const cookies = (await page.context().cookies()).filter(({ name }) => name.startsWith("drivem-session"));
    assert.ok(cookies.length);
    assert.ok(cookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax"));
    await screenshot(page, "drivem-dashboard.png");
    await page.goto(`${base}/orders`);
    await page.getByRole("heading", { name: "Розділ у розробці" }).waitFor();
    await page.goto(`${base}/settings`);
    await page.getByText("Europe/Kyiv", { exact: true }).waitFor();
    await page.getByText("UAH", { exact: true }).waitFor();
    await page.goto(`${base}/unknown-test-route`);
    await page.getByRole("heading", { name: "Сторінку не знайдено" }).waitFor();
    await page.goto(`${base}/settings`);
    await page.locator("summary").click();
    await page.getByRole("button", { name: "Вийти" }).click();
    await page.waitForURL(`${base}/login`);
    assert.equal((await page.context().cookies()).filter(({ name }) => name.startsWith("drivem-session")).length, 0);
    await page.goto(base);
    await page.waitForURL(`${base}/login`);
  });
});

test("viewer cannot read settings and an authenticated non-member cannot enter", async () => {
  await session(async (page) => {
    await login(page, viewer, "/");
    await page.goto(`${base}/settings`);
    await page.getByText("Ви не маєте доступу до налаштувань бізнесу.").waitFor();
    assert.equal(await page.getByText("Europe/Kyiv", { exact: true }).count(), 0);
  });
  await session(async (page) => {
    await login(page, outsider, "/access-denied");
    await page.getByRole("heading", { name: "Доступ обмежено" }).waitFor();
  });
});
