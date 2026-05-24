import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog-page";

export default function Page() {
  return (
    <Suspense>
      <CatalogPage />
    </Suspense>
  );
}
