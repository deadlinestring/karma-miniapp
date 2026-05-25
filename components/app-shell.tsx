import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";
import type { StorefrontSettings } from "@/lib/storefront-types";

export function AppShell({
  children,
  settings
}: {
  children: React.ReactNode;
  settings?: Pick<StorefrontSettings, "storeName" | "subtitle" | "logoUrl">;
}) {
  return (
    <div className="min-h-screen pb-24">
      <TopBar settings={settings} />
      <main className="mx-auto max-w-xl px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
