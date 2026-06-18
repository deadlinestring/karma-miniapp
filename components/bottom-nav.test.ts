import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("bottom navigation", () => {
  const source = readFileSync(join(__dirname, "bottom-nav.tsx"), "utf8");

  it("keeps every customer route link", () => {
    expect(source).toContain('href: "/"');
    expect(source).toContain('href: "/catalog"');
    expect(source).toContain('href: "/cart"');
    expect(source).toContain('href: "/orders"');
    expect(source).toContain('href: "/faq"');
    expect(source).toContain("grid-cols-5");
  });

  it("marks exact and nested routes active without changing hrefs", () => {
    expect(source).toContain('pathname.startsWith(`${item.href}/`)');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(source).toContain("safe-area-inset-bottom");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
