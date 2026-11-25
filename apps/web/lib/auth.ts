import "server-only";
import { createServerClient } from "@supabase/ssr";
import { authConfig } from "@drivem/config";
import { cookies } from "next/headers";

import { authCookieOptions } from "./session-cookie";

export async function authClient(writable = false) {
  const config = authConfig();
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: authCookieOptions(config.secure),
    cookies: {
      getAll: () => store.getAll(),
      setAll: (updates) => {
        if (writable) for (const { name, value, options } of updates) store.set(name, value, options);
      },
    },
  });
}
