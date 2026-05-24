import { AppShell } from "@/components/app-shell";
import Link from "next/link";

export default function Page() {
  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">заказы</p>
        <h1 className="mt-2 text-3xl font-black text-white">Заказы</h1>
      </section>

      <section className="mt-6 rounded-[28px] border border-white/10 bg-white/7 p-8 text-center shadow-violet">
        <div className="mx-auto h-24 w-24 rounded-full bg-neon-cyan/15 blur-sm" />
        <h2 className="mt-4 text-xl font-black text-white">У вас пока нет заказов</h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Когда вы оформите первый ночник, здесь появится его статус и история заказа.
        </p>
        <Link
          href="/catalog"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
        >
          Перейти в каталог
        </Link>
      </section>
    </AppShell>
  );
}
