import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const uiDir = join(__dirname);

describe("shared UI foundation", () => {
  const buttonSource = readFileSync(join(uiDir, "button.tsx"), "utf8");
  const emptyStateSource = readFileSync(join(uiDir, "empty-state.tsx"), "utf8");
  const maskSource = readFileSync(join(uiDir, "brand-mask-watermark.tsx"), "utf8");
  const tokenSource = readFileSync(join(uiDir, "neon-mask-tokens.ts"), "utf8");
  const statusBadgeSource = readFileSync(join(uiDir, "status-badge.tsx"), "utf8");
  const surfaceSource = readFileSync(join(uiDir, "surface.tsx"), "utf8");
  const headingSource = readFileSync(join(uiDir, "section-heading.tsx"), "utf8");

  it("keeps shared button basics accessible and overridable", () => {
    expect(buttonSource).toContain('type = "button"');
    expect(buttonSource).toContain("disabled:cursor-not-allowed");
    expect(buttonSource).toContain("focus-visible:ring-neon-cyan");
    expect(buttonSource).toContain('"mask"');
    expect(buttonSource).toContain('"primary"');
    expect(buttonSource).toContain('"secondary"');
    expect(buttonSource).toContain('"ghost"');
    expect(buttonSource).toContain("className");
  });

  it("renders empty states through text props and optional CTA", () => {
    expect(emptyStateSource).toContain("bodyLines.map");
    expect(emptyStateSource).toContain("UiButtonLink");
    expect(emptyStateSource).toContain("ctaHref");
    expect(emptyStateSource).toContain("BrandMaskWatermark");
    expect(emptyStateSource).not.toContain("dangerouslySetInnerHTML");
  });

  it("renders brand mask watermark as decorative non-interactive UI", () => {
    expect(maskSource).toContain('aria-hidden="true"');
    expect(maskSource).toContain("pointer-events-none");
    expect(maskSource).toContain('const maskAssetPath = "/brand/karma-mask.svg"');
    expect(maskSource).toContain("<img");
    expect(maskSource).toContain('alt=""');
    expect(maskSource).toContain("draggable={false}");
    expect(maskSource).toContain("variant = \"subtle\"");
    expect(maskSource).toContain("hero");
    expect(maskSource).toContain("empty");
    expect(maskSource).not.toContain("http");
    expect(maskSource).not.toContain("<svg");
  });

  it("keeps Neon Mask tokens as lightweight class constants", () => {
    expect(tokenSource).toContain("neonMaskBackground");
    expect(tokenSource).toContain("neonMaskSurface");
    expect(tokenSource).toContain("neonMaskHover");
    expect(tokenSource).toContain("motion-reduce");
  });

  it("provides reusable surface, status badge and section heading patterns", () => {
    expect(surfaceSource).toContain("toneClass");
    expect(surfaceSource).toContain('"default"');
    expect(surfaceSource).toContain('"mask"');
    expect(statusBadgeSource).toContain("StatusBadgeTone");
    expect(statusBadgeSource).toContain("success");
    expect(headingSource).toContain("text-neon-cyan");
  });
});
