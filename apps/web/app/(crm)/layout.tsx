import { ChevronDown } from "lucide-react";
import { can, roleLabels } from "@drivem/domain";
import { Brand } from "@/components/brand";
import { Navigation } from "@/components/navigation";
import { requireMember } from "@/lib/access";
import { signOut } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  return <div className="min-h-dvh bg-workspace md:grid md:grid-cols-[240px_minmax(0,1fr)]">
    <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3">До вмісту</a>
    <aside className="border-b border-line bg-white p-4 md:border-r md:border-b-0">
      <div className="mb-4 px-2 md:mb-8 md:mt-2"><Brand /></div>
      <Navigation settings={can(member.role, "settings:read")} />
    </aside>
    <div>
      <header className="flex min-h-[72px] items-center justify-between gap-3 border-b border-line bg-white px-5 sm:px-9">
        <span className="min-w-0 truncate text-sm font-semibold">{member.organization}</span>
        <details className="relative shrink-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-workspace">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-brand-light text-primary-action">{member.name.slice(0, 1).toLocaleUpperCase("uk")}</span>
            <span className="hidden max-w-36 truncate sm:inline">{member.name}</span>
            <span className="sr-only sm:hidden">Меню користувача</span>
            <ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-line bg-white p-2 shadow-lg">
            <p className="px-3 py-2 text-sm text-muted">{roleLabels[member.role]}</p>
            <form action={signOut}><button className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-brand-light">Вийти</button></form>
          </div>
        </details>
      </header>
      <main id="content" className="mx-auto max-w-6xl p-5 sm:p-9">{children}</main>
    </div>
  </div>;
}
