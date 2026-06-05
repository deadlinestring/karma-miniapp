import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const uiDir = join(__dirname);

describe("shared UI foundation", () => {
  const buttonSource = readFileSync(join(uiDir, "button.tsx"), "utf8");
  const emptyStateSource = readFileSync(join(uiDir, "empty-state.tsx"), "utf8");
  const statusBadgeSource = readFileSync(join(uiDir, "status-badge.tsx"), "utf8");
  const surfaceSource = readFileSync(join(uiDir, "surface.tsx"), "utf8");
  const headingSource = readFileSync(join(uiDir, "section-heading.tsx"), "utf8");

  it("keeps shared button basics accessible and overridable", () => {
    expect(buttonSource).toContain('type = "button"');
    expect(buttonSource).toContain("disabled:cursor-not-allowed");
    expect(buttonSource).toContain("focus-visible:ring-neon-cyan");
    expect(buttonSource).toContain("className");
  });

  it("renders empty states through text props and optional CTA", () => {
    expect(emptyStateSource).toContain("bodyLines.map");
    expect(emptyStateSource).toContain("UiButtonLink");
    expect(emptyStateSource).toContain("ctaHref");
    expect(emptyStateSource).not.toContain("dangerouslySetInnerHTML");
  });

  it("provides reusable surface, status badge and section heading patterns", () => {
    expect(surfaceSource).toContain("toneClass");
    expect(statusBadgeSource).toContain("StatusBadgeTone");
    expect(statusBadgeSource).toContain("success");
    expect(headingSource).toContain("text-neon-cyan");
  });
});
