import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin FAQ panel", () => {
  const source = readFileSync(join(__dirname, "admin-faq-panel.tsx"), "utf8");

  it("loads and saves FAQ through authenticated admin endpoints", () => {
    expect(source).toContain('fetch("/api/admin/faq"');
    expect(source).toContain('"X-Telegram-Init-Data": initData');
    expect(source).toContain('method: "PATCH"');
    expect(source).toContain("JSON.stringify({ sections })");
  });

  it("uses textarea/plain preview without raw HTML rendering", () => {
    expect(source).toContain("<textarea");
    expect(source).toContain("Preview");
    expect(source).toContain("useScrollIntoViewOnChange");
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
