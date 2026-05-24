import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <TopBar />
      <main className="mx-auto max-w-xl px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
