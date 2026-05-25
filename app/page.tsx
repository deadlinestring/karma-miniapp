import { HomePage } from "@/components/home-page";
import { getStorefrontHomeData } from "@/lib/server/catalog-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  try {
    const data = await getStorefrontHomeData();

    return <HomePage data={data} />;
  } catch (error) {
    console.error("Failed to load storefront home data", error);

    return <HomePage data={null} loadError />;
  }
}
