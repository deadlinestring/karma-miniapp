import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FAQ page UI", () => {
  const source = readFileSync(join(__dirname, "faq-page.tsx"), "utf8");

  it("renders public FAQ content and support link safely", () => {
    expect(source).toContain("Как заказать");
    expect(source).toContain("Стиль №1");
    expect(source).toContain("Стиль №2");
    expect(source).toContain("Стиль №3");
    expect(source).toContain("karmashopsupportbot");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
