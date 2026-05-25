import { describe, expect, it } from "vitest";

describe("seed image cover policy", () => {
  it("creates a seed cover only when the product has no cover", async () => {
    const { shouldSeedImageBeCover } = await import("./seed-image-policy.mjs");

    expect(
      shouldSeedImageBeCover({
        imageIndex: 0,
        existingCoverImageId: null,
        seedImageId: "seed-image-naruto-uzumaki-cover"
      })
    ).toBe(true);
  });

  it("keeps an existing seed cover as cover on repeated seed", async () => {
    const { shouldSeedImageBeCover } = await import("./seed-image-policy.mjs");

    expect(
      shouldSeedImageBeCover({
        imageIndex: 0,
        existingCoverImageId: "seed-image-naruto-uzumaki-cover",
        seedImageId: "seed-image-naruto-uzumaki-cover"
      })
    ).toBe(true);
  });

  it("does not make seed cover active when an admin-uploaded cover already exists", async () => {
    const { shouldSeedImageBeCover } = await import("./seed-image-policy.mjs");

    expect(
      shouldSeedImageBeCover({
        imageIndex: 0,
        existingCoverImageId: "admin-uploaded-cover",
        seedImageId: "seed-image-naruto-uzumaki-cover"
      })
    ).toBe(false);
  });

  it("never marks seed gallery images as cover", async () => {
    const { shouldSeedImageBeCover } = await import("./seed-image-policy.mjs");

    expect(
      shouldSeedImageBeCover({
        imageIndex: 1,
        existingCoverImageId: null,
        seedImageId: "seed-image-naruto-uzumaki-gallery-1"
      })
    ).toBe(false);
  });
});
