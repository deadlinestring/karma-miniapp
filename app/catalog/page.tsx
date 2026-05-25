import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog-page";
import { getStorefrontCatalog } from "@/lib/server/catalog-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  let data = null;
  let loadError = false;

  try {
    data = await getStorefrontCatalog();
  } catch (error) {
    console.error("Failed to load storefront catalog data", error);
    loadError = true;
  }

  return (
    <Suspense>
      <CatalogPage data={data} loadError={loadError} />
    </Suspense>
  );
}
