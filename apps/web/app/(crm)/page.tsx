import { ArrowRight, Package, ShoppingBag, Warehouse } from "lucide-react";
import Link from "next/link";
import { requireMember } from "@/lib/access";

const shortcuts = [
  { href: "/orders", title: "Замовлення", text: "Опрацювання продажів", icon: ShoppingBag },
  { href: "/products", title: "Товари", text: "Каталог автозапчастин", icon: Package },
  { href: "/inventory", title: "Склад", text: "Залишки та резерви", icon: Warehouse },
];

export const metadata = { title: "Головна" };

export default async function Home() {
  const member = await requireMember();
  return <>
    <h1 className="text-3xl font-bold tracking-tight">Головна</h1>
    <section className="mt-6 rounded-2xl border border-line border-l-4 border-l-brand bg-white p-6 shadow-xs sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Вітаємо, {member.name}!</h2>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted">Ваш робочий простір «{member.organization}» налаштовано. Операційні модулі відкриватимуться в міру готовності.</p>
    </section>
    <h2 className="mb-4 mt-8 text-lg font-semibold">Розділи CRM</h2>
    <div className="grid gap-4 lg:grid-cols-3">
      {shortcuts.map(({ href, title, text, icon: Icon }) => <Link key={href} href={href} className="group rounded-xl border border-line bg-white p-5 shadow-xs hover:border-primary-action">
        <div className="mb-4 flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-light text-primary-action"><Icon size={19} aria-hidden="true" /></span>
          <ArrowRight size={17} className="text-muted group-hover:text-primary-action" aria-hidden="true" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{text}</p>
      </Link>)}
    </div>
  </>;
}
