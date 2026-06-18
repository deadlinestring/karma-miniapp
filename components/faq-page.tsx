import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Surface } from "@/components/ui/surface";
import { neonMaskGradientText, neonMaskMutedText } from "@/components/ui/neon-mask-tokens";
import {
  FAQ_CONTACT_CTA_SLUG,
  FAQ_HERO_EYEBROW_SLUG,
  FAQ_HERO_SLUG,
  getFaqSectionBySlug,
  getOrdinaryFaqSections,
  type FaqSectionDto
} from "@/lib/server/faq";
import type { StorefrontSettings } from "@/lib/storefront-types";

const supportBotUrl = "https://t.me/karmashopsupportbot";

export function FaqPage({
  sections,
  settings
}: {
  sections: FaqSectionDto[];
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  const eyebrow = getFaqSectionBySlug(sections, FAQ_HERO_EYEBROW_SLUG);
  const hero = getFaqSectionBySlug(sections, FAQ_HERO_SLUG);
  const contactCta = getFaqSectionBySlug(sections, FAQ_CONTACT_CTA_SLUG);
  const ordinarySections = getOrdinaryFaqSections(sections);

  return (
    <AppShell settings={settings}>
      <Surface as="section" tone="mask" className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-violet/55 to-transparent" />
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-neon-cyan">{eyebrow.title}</p>
        <h1 className={`mt-3 text-3xl font-black leading-tight ${neonMaskGradientText}`}>{hero.title}</h1>
        <div className={`mt-3 grid gap-2 text-sm leading-6 ${neonMaskMutedText}`}>
          {renderFaqContent(hero.content)}
        </div>
      </Surface>

      <Surface as="section" tone="muted" className="mt-5 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-violet">KARMA CUSTOM</p>
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
      </Surface>

      <section className="mt-5 grid gap-3">
        {ordinarySections.map((section, index) => (
          <details
            key={section.slug}
            open={index < 2}
            className="group rounded-xl border border-neon-violet/18 bg-[linear-gradient(145deg,rgba(19,10,35,0.9),rgba(7,4,14,0.92))] p-4 transition duration-150 hover:border-neon-violet/30 focus-within:border-neon-violet/40 open:border-neon-violet/38 open:bg-neon-violet/8 motion-reduce:transition-none"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-base font-black text-white outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/70">
              <span>{section.title}</span>
              <ChevronDown
                size={18}
                className="shrink-0 text-[#b89cff] transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-white/64">
              {renderFaqContent(section.content)}
            </div>
          </details>
        ))}
      </section>

      <Surface as="section" tone="mask" className="mt-5 p-5">
        <h2 className="text-xl font-black text-white">{contactCta.title}</h2>
        <div className="mt-2 grid gap-2 text-sm leading-6 text-white/62">
          {renderFaqContent(contactCta.content)}
        </div>
        <Link
          href={supportBotUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-neon-violet/40 bg-[linear-gradient(100deg,#7f32ff,#a83cff)] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(86,36,180,0.28)] transition duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/70"
        >
          <MessageCircle size={18} />
          Связаться
        </Link>
      </Surface>
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
