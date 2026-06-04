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

  it("contains the FAQ section and renders the FAQ panel", () => {
    expect(source).toContain('id: "faq"');
    expect(source).toContain('title: "FAQ / Как заказать"');
    expect(source).toContain("<AdminFaqPanel initData={initData}");
  });

  it("contains the content blocks section and renders the content blocks panel", () => {
    expect(source).toContain('id: "content"');
    expect(source).toContain('title: "Блоки интерфейса"');
    expect(source).toContain("<AdminContentBlocksPanel initData={initData}");
  });
});
