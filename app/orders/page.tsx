import { AppShell } from "@/components/app-shell";

export default function Page() {
  return (
    <AppShell>
      <section className="rounded-[28px] border border-white/10 bg-white/7 p-6 shadow-violet">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">будущий этап</p>
        <h1 className="mt-3 text-3xl font-black text-white">Заказы</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Здесь появится история заказов после подключения backend, Telegram-пользователей и базы данных.
        </p>
      </section>
    </AppShell>
  );
}
