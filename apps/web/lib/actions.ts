"use server";

import { redirect } from "next/navigation";
import { authClient } from "./auth";

export async function signIn(_state: string, data: FormData) {
  const email = data.get("email");
  const password = data.get("password");
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" || !password.length || Buffer.byteLength(password) > 72) {
    return "Перевірте електронну пошту й пароль.";
  }
  try {
    const auth = await authClient(true);
    const { error } = await auth.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return "Не вдалося увійти. Перевірте пошту й пароль або повторіть спробу пізніше.";
  } catch {
    return "Сервіс входу тимчасово недоступний.";
  }
  redirect("/");
}

export async function signOut() {
  const auth = await authClient(true);
  const { error } = await auth.auth.signOut({ scope: "local" });
  if (error) redirect("/access-denied?logout=failed");
  redirect("/login");
}
