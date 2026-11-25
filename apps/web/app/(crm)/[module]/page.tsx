import { notFound } from "next/navigation";
import { requireMember } from "@/lib/access";

const sections: Record<string, { title: string; description: string }> = {
  orders: { title: "Замовлення", description: "Тут будуть замовлення та історія їх опрацювання." },
  products: { title: "Товари", description: "Тут буде каталог деталей і публікації товарів." },
  inventory: { title: "Склад", description: "Тут будуть залишки, резерви та історія рухів." },
  pricing: { title: "Ціноутворення", description: "Тут будуть ціни каналів та історія змін." },
  customers: { title: "Клієнти", description: "Тут будуть клієнти та пов’язані замовлення." },
  logistics: { title: "Логістика", description: "Тут будуть відправлення та повернення." },
  finance: { title: "Фінанси та аналітика", description: "Тут будуть звіти за операціями бізнесу." },
  integrations: { title: "Інтеграції", description: "Тут буде стан підключень і синхронізації." },
};

export default async function Module({ params }: { params: Promise<{ module: string }> }) {
  const key = (await params).module;
  if (!Object.hasOwn(sections, key)) notFound();
  await requireMember();
  const section = sections[key];
  return <>
    <h1 className="text-3xl font-bold tracking-tight">{section.title}</h1>
    <section className="mt-6 rounded-xl border border-line bg-white p-6">
      <h2 className="text-lg font-semibold">Розділ у розробці</h2>
      <p className="mt-2 text-sm text-muted">{section.description}</p>
    </section>
  </>;
}
