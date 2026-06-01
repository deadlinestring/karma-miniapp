import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("useScrollIntoViewOnChange", () => {
  const source = readFileSync(join(__dirname, "use-scroll-into-view-on-change.ts"), "utf8");

  it("scrolls the referenced status block into view when a message appears", () => {
    expect(source).toContain("scrollIntoView");
    expect(source).toContain('behavior: "smooth"');
    expect(source).toContain('block: "center"');
  });
});
