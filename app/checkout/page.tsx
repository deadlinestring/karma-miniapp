import { CheckoutPage } from "@/components/checkout-page";
import { getStorefrontSettings } from "@/lib/server/catalog-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  const settings = await getStorefrontSettings();

  return <CheckoutPage settings={settings} />;
}
