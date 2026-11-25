import { Brand } from "@/components/brand";
import { LoginForm } from "./form";

export const metadata = { title: "Вхід" };

export default function Login() {
  return <main className="grid min-h-dvh bg-workspace px-5 py-10 place-items-center">
    <div className="w-full max-w-md">
      <div className="mb-7"><Brand /></div>
      <section className="rounded-2xl border border-line border-t-4 border-t-brand bg-white p-7 shadow-sm sm:p-9">
        <h1 className="text-3xl font-bold tracking-tight">Вхід у DriveM CRM</h1>
        <p className="mb-7 mt-2 text-sm text-muted">Увійдіть з обліковим записом вашого бізнесу.</p>
        <LoginForm />
      </section>
    </div>
  </main>;
}
