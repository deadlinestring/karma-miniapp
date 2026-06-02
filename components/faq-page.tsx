import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  FAQ_CONTACT_CTA_SLUG,
  FAQ_HERO_EYEBROW_SLUG,
  FAQ_HERO_SLUG,
  getFaqSectionBySlug,
  getOrdinaryFaqSections,
  type FaqSectionDto
} from "@/lib/server/faq";

const supportBotUrl = "https://t.me/karmashopsupportbot";

export function FaqPage({ sections }: { sections: FaqSectionDto[] }) {
  const eyebrow = getFaqSectionBySlug(sections, FAQ_HERO_EYEBROW_SLUG);
  const hero = getFaqSectionBySlug(sections, FAQ_HERO_SLUG);
  const contactCta = getFaqSectionBySlug(sections, FAQ_CONTACT_CTA_SLUG);
  const ordinarySections = getOrdinaryFaqSections(sections);

  return (
    <AppShell>
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">{eyebrow.title}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{hero.title}</h1>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-white/62">
          {renderFaqContent(hero.content)}
        </div>
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
        {ordinarySections.map((section, index) => (
          <details
            key={section.slug}
            open={index < 2}
            className="group rounded-[24px] border border-white/10 bg-white/7 p-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-neon-cyan/35 hover:bg-white/10 focus-within:border-neon-cyan/50 open:border-neon-cyan/45 open:bg-neon-cyan/10 open:shadow-glow motion-reduce:transform-none motion-reduce:transition-none"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl text-base font-black text-white outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70">
              <span>{section.title}</span>
              <ChevronDown
                size={18}
                className="shrink-0 text-neon-cyan transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-white/64">
              {renderFaqContent(section.content)}
            </div>
          </details>
        ))}
      </section>

      <section className="mt-5 rounded-[28px] border border-white/10 bg-white/7 p-5">
        <h2 className="text-xl font-black text-white">{contactCta.title}</h2>
        <div className="mt-2 grid gap-2 text-sm leading-6 text-white/62">
          {renderFaqContent(contactCta.content)}
        </div>
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
