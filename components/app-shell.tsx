import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";
import { neonMaskAppBackground } from "@/components/ui/neon-mask-tokens";
import type { StorefrontSettings } from "@/lib/storefront-types";

export function AppShell({
  children,
  settings
}: {
  children: React.ReactNode;
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  return (
    <div className={`relative min-h-screen overflow-x-hidden pb-28 ${neonMaskAppBackground}`}>
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(155,92,255,0.13),transparent_70%)]" />
      <TopBar settings={settings} />
      <main className="relative mx-auto max-w-xl px-4 pb-7 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}
