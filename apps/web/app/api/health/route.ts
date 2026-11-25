import { authConfig } from "@drivem/config";
import { webDatabase } from "@/lib/access";

export async function GET() {
  try {
    const auth = authConfig();
    const [, response] = await Promise.all([
      webDatabase()`select 1 from crm.organizations limit 0`,
      fetch(new URL("/auth/v1/health", auth.url), {
        headers: { apikey: auth.key }, cache: "no-store", signal: AbortSignal.timeout(4000),
      }),
    ]);
    if (!response.ok) throw new Error("Auth unavailable");
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
