import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin access panel navigation", () => {
  const source = readFileSync(join(__dirname, "admin-access-panel.tsx"), "utf8");

  it("contains the orders section and renders the orders panel", () => {
    expect(source).toContain('id: "orders"');
    expect(source).toContain('title: "Заказы"');
    expect(source).toContain("<AdminOrdersPanel initData={initData}");
  });
});

