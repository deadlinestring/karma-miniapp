import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog-page";
import { getStorefrontCatalog, getStorefrontSettings } from "@/lib/server/catalog-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Page() {
  let data = null;
  let settings = null;
  let loadError = false;

  try {
    [data, settings] = await Promise.all([getStorefrontCatalog(), getStorefrontSettings()]);
  } catch (error) {
    console.error("Failed to load storefront catalog data", error);
    loadError = true;
    try {
      settings = await getStorefrontSettings();
    } catch {
      settings = null;
    }
  }

  return (
    <Suspense>
      <CatalogPage data={data} loadError={loadError} settings={settings ?? undefined} />
    </Suspense>
  );
}
