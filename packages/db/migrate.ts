import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { localDatabase } from "@drivem/config";
import { connect } from "./src/index";

const dir = new URL("./migrations/", import.meta.url);
try {
  const db = connect(localDatabase(), 1);
  try {
    const files = (await readdir(dir)).filter((file) => /^\d{3}_[a-z_]+\.sql$/.test(file)).sort();
    await db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(12020001)`;
      await sql`create table if not exists public.crm_migrations (name text primary key, checksum text not null)`;
      const applied = new Map((await sql<{ name: string; checksum: string }[]>`select name, checksum from public.crm_migrations`).map((row) => [row.name, row.checksum]));
      for (const name of applied.keys()) {
        if (!files.includes(name)) throw new Error(`Missing applied migration ${name}`);
      }
      for (const name of files) {
        const contents = await readFile(new URL(name, dir), "utf8");
        const checksum = createHash("sha256").update(contents.replaceAll("\r\n", "\n")).digest("hex");
        if (applied.has(name)) {
          if (applied.get(name) !== checksum) throw new Error(`Checksum mismatch: ${name}`);
          continue;
        }
        await sql.unsafe(contents).simple();
        await sql`insert into public.crm_migrations values (${name}, ${checksum})`;
        console.log(`Застосовано ${name}`);
      }
    });
  } finally {
    await db.end();
  }
} catch {
  console.error("Міграції не завершено. Перевірте стан локального PostgreSQL, Auth і журнал міграцій.");
  process.exitCode = 1;
}
