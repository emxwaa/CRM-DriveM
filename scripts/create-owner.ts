import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { createClient } from "@supabase/supabase-js";
import { authConfig, localDatabase, required } from "@drivem/config";
import { connect } from "@drivem/db";

async function main() {
  const connection = localDatabase();
  const auth = authConfig();
  if (auth.url !== "http://127.0.0.1:54321") throw new Error("Local Auth required");
  if (!process.stdin.isTTY) throw new Error("Interactive terminal required");
  let hidden = false;
  const output = new Writable({
    write(chunk, encoding, done) {
      if (!hidden) process.stdout.write(chunk, encoding, done);
      else done();
    },
  });
  const input = createInterface({ input: process.stdin, output, terminal: true });
  input.on("SIGINT", () => process.exit(130));
  const askPassword = async (prompt: string) => {
    process.stdout.write(prompt);
    hidden = true;
    try {
      return await input.question("");
    } finally {
      hidden = false;
      process.stdout.write("\n");
    }
  };
  const credentials = await (async () => {
    try {
      const email = (await input.question("Електронна пошта: ")).trim();
      const name = (await input.question("Ім’я власника: ")).trim();
      const organization = (await input.question("Назва бізнесу: ")).trim();
      const password = await askPassword("Пароль (принаймні 12 символів, введення приховане): ");
      const confirmation = await askPassword("Повторіть пароль: ");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
          !name || name.length > 120 || !organization || organization.length > 120 ||
          password.length < 12 || Buffer.byteLength(password) > 72 || password !== confirmation) {
        throw new Error("Некоректні поля або паролі не збігаються");
      }
      return { email, name, organization, password };
    } finally {
      input.close();
    }
  })();

  const clientOptions = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url: Parameters<typeof fetch>[0], init?: RequestInit) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) } };
  const admin = createClient(auth.url, required("SUPABASE_SERVICE_ROLE_KEY"), clientOptions);
  const db = connect(connection, 1);
  try {
    const created = await db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(12020002)`;
      const [existing] = await sql`select id from crm.organizations limit 1`;
      if (existing) return false;
      const { email, password, name, organization } = credentials;
      const result = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      let user = result.data.user;
      if ((!user || result.error) && ["email_exists", "user_already_exists"].includes(result.error?.code ?? "")) {
        // Recover a local Auth user created before an interrupted PostgreSQL commit.
        const verify = createClient(auth.url, auth.key, clientOptions);
        const previous = await verify.auth.signInWithPassword({ email, password });
        user = previous.data.user;
        if (user) await verify.auth.signOut();
      }
      if (!user) throw new Error("Auth owner provisioning failed");
      const [org] = await sql<{ id: string }[]>`insert into crm.organizations (name) values (${organization}) returning id`;
      await sql`insert into crm.profiles values (${user.id}, ${name})`;
      await sql`insert into crm.memberships (org_id, auth_user_id, role) values (${org.id}, ${user.id}, 'owner')`;
      await sql`insert into crm.business_settings (org_id) values (${org.id})`;
      await sql`insert into crm.audit_events (org_id, actor_id, action) values (${org.id}, ${user.id}, 'owner.created')`;
      return true;
    });
    console.log(created ? "Власника створено. Увійдіть за вказаною поштою та паролем." : "Організація вже існує. Власник залишився без змін.");
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error && error.message.startsWith("Некоректні")
    ? error.message : "Власника не створено. Перевірте локальний Auth, .env і міграції.");
  process.exitCode = 1;
});
