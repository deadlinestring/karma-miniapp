import { FaqPage } from "@/components/faq-page";
import { getPublicFaqSections } from "@/lib/server/faq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  const sections = await getPublicFaqSections();

  return <FaqPage sections={sections} />;
}
