import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { FaqSectionDto } from "@/lib/server/faq";

const supportBotUrl = "https://t.me/karmashopsupportbot";

export function FaqPage({ sections }: { sections: FaqSectionDto[] }) {
  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">help</p>
        <h1 className="mt-2 text-3xl font-black text-white">Как заказать</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Коротко о видах светильников, своей картинке, доставке и связи с менеджером.
        </p>
      </section>

      <section className="mt-6 rounded-[28px] border border-neon-cyan/20 bg-neon-cyan/8 p-5">
        <h2 className="text-xl font-black text-white">Заказ по своей картинке</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/68">
          <p>
            Стиль №1 «Линиями» <span className="font-black text-white">+690 ₽</span>
          </p>
          <p>
            Стиль №2 «Линии + заливка основных элементов» <span className="font-black text-white">+790 ₽</span>
          </p>
          <p>
            Стиль №3 «Линии + заливка + полутона, тени, блики»{" "}
            <span className="font-black text-white">+990 ₽</span>
          </p>
        </div>
      </section>

      <section className="mt-5 grid gap-3">
        {sections.map((section, index) => (
          <details
            key={section.slug}
            open={index < 2}
            className="rounded-[24px] border border-white/10 bg-white/7 p-4"
          >
            <summary className="cursor-pointer list-none text-base font-black text-white">
              {section.title}
            </summary>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-white/64">
              {renderFaqContent(section.content)}
            </div>
          </details>
        ))}
      </section>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-white/7 p-5">
        <h2 className="text-xl font-black text-white">Остались вопросы?</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Напишите менеджеру в Telegram. Поддержка работает через отдельный bot, подключённый к BlueSales.
        </p>
        <Link
          href={supportBotUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-violet to-neon-cyan px-5 text-sm font-black text-white shadow-glow"
        >
          <MessageCircle size={18} />
          Связаться
        </Link>
      </section>
    </AppShell>
  );
}

function renderFaqContent(content: string) {
  return content
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => <p key={line}>{line}</p>);
}
