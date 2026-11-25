import { createServerClient } from "@supabase/ssr";
import { authConfig } from "@drivem/config";
import { type NextRequest, NextResponse } from "next/server";
import { authCookieOptions } from "./lib/session-cookie";

export async function proxy(request: NextRequest) {
  if (!request.cookies.getAll().some(({ name }) => name === "drivem-session" || name.startsWith("drivem-session."))) {
    return NextResponse.next();
  }

  const { url, key, secure } = authConfig();
  let response = NextResponse.next({ request });
  const auth = createServerClient(url, key, {
    cookieOptions: authCookieOptions(secure),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates, headers) => {
        for (const { name, value } of updates) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of updates) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value);
      },
    },
  });
  await auth.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/((?!api/health|_next/static|_next/image|DriveM.svg|favicon.ico).*)"] };
