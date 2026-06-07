import { CustomerOrderDetailPage } from "@/components/customer-order-detail-page";
import { getStorefrontSettings } from "@/lib/server/catalog-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page({ params }: { params: { publicNumber: string } }) {
  const settings = await getStorefrontSettings();

  return <CustomerOrderDetailPage publicNumber={params.publicNumber} settings={settings} />;
}
