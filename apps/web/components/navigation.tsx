"use client";

import {
  BarChart3, Boxes, Handshake, House, Package, Settings, ShoppingBag, Tag, Truck, Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", title: "Головна", icon: House },
  { href: "/orders", title: "Замовлення", icon: ShoppingBag },
  { href: "/products", title: "Товари", icon: Package },
  { href: "/inventory", title: "Склад", icon: Boxes },
  { href: "/pricing", title: "Ціноутворення", icon: Tag },
  { href: "/customers", title: "Клієнти", icon: Users },
  { href: "/logistics", title: "Логістика", icon: Truck },
  { href: "/finance", title: "Фінанси та аналітика", icon: BarChart3 },
  { href: "/integrations", title: "Інтеграції", icon: Handshake },
  { href: "/settings", title: "Налаштування", icon: Settings },
] as const;

export function Navigation({ settings }: { settings: boolean }) {
  const current = usePathname();
  return <nav aria-label="Основна навігація" className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-1">
    {items.filter(({ href }) => settings || href !== "/settings").map(({ href, title, icon: Icon }) => {
      const active = current === href;
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-brand-light font-semibold text-primary-action" : "text-muted hover:bg-workspace hover:text-ink"}`}>
        <Icon size={18} aria-hidden="true" className="shrink-0" />
        {title}
      </Link>;
    })}
  </nav>;
}
