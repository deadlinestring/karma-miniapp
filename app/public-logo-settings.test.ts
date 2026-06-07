import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeFiles = [
  "catalog/page.tsx",
  "cart/page.tsx",
  "checkout/page.tsx",
  "orders/page.tsx",
  "orders/[publicNumber]/page.tsx",
  "faq/page.tsx"
];

describe("public page logo settings wiring", () => {
  it.each(routeFiles)("%s passes StoreSettings to the shared public header", (routeFile) => {
    const source = readFileSync(join(__dirname, routeFile), "utf8");

    expect(source).toContain("getStorefrontSettings");
    expect(source).toContain("settings");
  });
});
