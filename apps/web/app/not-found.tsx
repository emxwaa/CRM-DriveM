import Link from "next/link";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return <main className="mx-auto grid max-w-lg content-center gap-4 px-6 py-24">
    <Brand />
    <h1 className="text-3xl font-bold">Сторінку не знайдено</h1>
    <p className="text-muted">Перевірте адресу або поверніться до головної сторінки.</p>
    <Link href="/" className="w-fit font-semibold text-primary-action underline underline-offset-4">На головну</Link>
  </main>;
}
