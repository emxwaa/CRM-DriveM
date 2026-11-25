import postgres from "postgres";

export function connect(url: string, max = 5) {
  const secure = new URL(url).searchParams.get("sslmode") === "verify-full";
  return postgres(url, {
    max, connect_timeout: 5, idle_timeout: 20,
    connection: { statement_timeout: 8000 },
    ...(secure ? { ssl: { rejectUnauthorized: true } } : {}),
  });
}

export type Database = ReturnType<typeof connect>;

export function asUser<T>(db: Database, userId: string, orgId: string | null, task: (sql: postgres.TransactionSql) => Promise<T>) {
  return db.begin(async (sql) => {
    await sql`select set_config('crm.user_id', ${userId}, true), set_config('crm.org_id', ${orgId ?? ""}, true)`;
    return task(sql);
  });
}
