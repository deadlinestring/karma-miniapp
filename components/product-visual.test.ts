import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("product visual image fit", () => {
  const source = readFileSync(join(__dirname, "product-visual.tsx"), "utf8");

  it("shows the complete product photo without crop or scale hover", () => {
    expect(source).toContain("object-contain object-center");
    expect(source).toContain("duration-150");
    expect(source).not.toContain("object-cover");
    expect(source).not.toContain("group-hover:scale");
  });

  it("keeps decorative overlays away from the product image", () => {
    expect(source).not.toContain("via-white/45");
    expect(source).not.toContain("absolute inset-0 bg-gradient-to-t");
    expect(source).toContain("border-t border-neon-violet/15");
  });
});
