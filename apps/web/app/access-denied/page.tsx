import { Button } from "@drivem/ui";
import { signOut } from "@/lib/actions";
import { Brand } from "@/components/brand";

export const metadata = { title: "Доступ обмежено" };

export default async function AccessDenied({ searchParams }: { searchParams: Promise<{ logout?: string }> }) {
  const { logout } = await searchParams;
  return <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-5 px-6">
    <Brand />
    <h1 className="text-2xl font-bold">{logout === "failed" ? "Не вдалося завершити сеанс" : "Доступ обмежено"}</h1>
    <p className="text-muted">{logout === "failed" ? "Повторіть спробу виходу." : "Для доступу до CRM потрібне активне членство в організації."}</p>
    <form action={signOut}><Button type="submit">Вийти</Button></form>
  </main>;
}
