import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("bottom navigation", () => {
  const source = readFileSync(join(__dirname, "bottom-nav.tsx"), "utf8");

  it("links customers to FAQ", () => {
    expect(source).toContain('href: "/faq"');
    expect(source).toContain('label: "FAQ"');
    expect(source).toContain("CircleHelp");
    expect(source).toContain("grid-cols-5");
  });
});
