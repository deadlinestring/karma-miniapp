import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  className = ""
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={className}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-cyan">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      {children ? <div className="mt-2 text-sm leading-6 text-white/58">{children}</div> : null}
    </header>
  );
}
