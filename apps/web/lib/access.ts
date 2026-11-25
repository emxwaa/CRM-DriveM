import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { asUser, connect, type Database } from "@drivem/db";
import { databaseUrl } from "@drivem/config";
import { can, type Permission, type Role } from "@drivem/domain";
import { authClient } from "./auth";

let pool: Database | undefined;
export function webDatabase() {
  return pool ??= connect(databaseUrl("DATABASE_WEB_URL", "crm_web"));
}

export const requireMember = cache(async () => {
  const auth = await authClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const db = webDatabase();
  const [membership] = await asUser(db, user.id, null, async (sql) =>
    sql<{ org_id: string; role: Role }[]>`select org_id, role from crm.memberships order by org_id limit 1`,
  );
  if (!membership || !can(membership.role, "crm:read")) redirect("/access-denied");
  const orgId = membership.org_id;
  const account = await asUser(db, user.id, orgId, async (sql) => {
    const [org] = await sql<{ name: string }[]>`select name from crm.organizations where id = ${orgId}`;
    const [profile] = await sql<{ display_name: string }[]>`select display_name from crm.profiles`;
    return { org, profile };
  });
  if (!account.org || !account.profile) redirect("/access-denied");
  return { userId: user.id, orgId, role: membership.role, organization: account.org.name, name: account.profile.display_name };
});

export async function businessSettings() {
  const member = await requireMember();
  if (!can(member.role, "settings:read" satisfies Permission)) return null;
  const [settings] = await asUser(webDatabase(), member.userId, member.orgId, async (sql) =>
    sql<{ currency: string; timezone: string }[]>`select currency, timezone from crm.business_settings where org_id = ${member.orgId}`,
  );
  return settings ?? null;
}
