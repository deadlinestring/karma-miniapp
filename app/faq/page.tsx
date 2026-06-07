import { FaqPage } from "@/components/faq-page";
import { getPublicFaqSections } from "@/lib/server/faq";
import { getStorefrontSettings } from "@/lib/server/catalog-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  const [sections, settings] = await Promise.all([getPublicFaqSections(), getStorefrontSettings()]);

  return <FaqPage sections={sections} settings={settings} />;
}
