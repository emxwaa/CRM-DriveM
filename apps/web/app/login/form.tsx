"use client";

import { useActionState } from "react";
import { Button, Input } from "@drivem/ui";
import { signIn } from "@/lib/actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(signIn, "");
  return <form action={action} className="grid gap-5">
    <label className="grid gap-2 text-sm font-semibold" htmlFor="email">Електронна пошта
      <Input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
    </label>
    <label className="grid gap-2 text-sm font-semibold" htmlFor="password">Пароль
      <Input id="password" name="password" type="password" autoComplete="current-password" maxLength={72} required />
    </label>
    {error && <p role="alert" className="rounded-lg bg-brand-light p-3 text-sm text-primary-action">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Вхід…" : "Увійти"}</Button>
  </form>;
}
