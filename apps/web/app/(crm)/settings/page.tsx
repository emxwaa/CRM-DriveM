import { businessSettings } from "@/lib/access";

export const metadata = { title: "Налаштування" };

export default async function Settings() {
  const settings = await businessSettings();
  return <>
    <h1 className="text-3xl font-bold tracking-tight">Налаштування</h1>
    {settings ? <section className="mt-6 rounded-xl border border-line bg-white p-6">
      <h2 className="text-lg font-semibold">Параметри бізнесу</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div><dt className="text-sm text-muted">Валюта</dt><dd className="mt-1 font-semibold">{settings.currency}</dd></div>
        <div><dt className="text-sm text-muted">Часовий пояс</dt><dd className="mt-1 font-semibold">{settings.timezone}</dd></div>
      </dl>
    </section> : <p className="mt-5 rounded-lg border border-line bg-white p-5" role="status">Ви не маєте доступу до налаштувань бізнесу.</p>}
  </>;
}
