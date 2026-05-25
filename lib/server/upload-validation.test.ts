import { describe, expect, it } from "vitest";
import { MAX_ADMIN_IMAGE_SIZE_BYTES, validateAdminImageFile } from "./upload-validation";

const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const pngBytes = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
]);
const webpBytes = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
]);

function makeFile(type: string, bytes: Uint8Array) {
  return new File([bytes], "test-file", { type });
}

describe("admin image upload validation", () => {
  it("accepts valid JPEG by signature", async () => {
    await expect(validateAdminImageFile(makeFile("image/jpeg", jpegBytes))).resolves.toMatchObject({
      contentType: "image/jpeg",
      extension: "jpg",
      size: jpegBytes.length
    });
  });

  it("accepts valid PNG by signature", async () => {
    await expect(validateAdminImageFile(makeFile("image/png", pngBytes))).resolves.toMatchObject({
      contentType: "image/png",
      extension: "png",
      size: pngBytes.length
    });
  });

  it("accepts valid WEBP by signature", async () => {
    await expect(validateAdminImageFile(makeFile("image/webp", webpBytes))).resolves.toMatchObject({
      contentType: "image/webp",
      extension: "webp",
      size: webpBytes.length
    });
  });

  it("rejects SVG files", async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    await expect(validateAdminImageFile(makeFile("image/svg+xml", svg))).rejects.toThrow("unsupported_image_type");
  });

  it("rejects HTML/text content even when declared as image/png", async () => {
    const html = new TextEncoder().encode("<html><body>not an image</body></html>");

    await expect(validateAdminImageFile(makeFile("image/png", html))).rejects.toThrow("unsupported_image_type");
  });

  it("rejects files larger than 4 MB before reading content", async () => {
    await expect(
      validateAdminImageFile(makeFile("image/png", new Uint8Array(MAX_ADMIN_IMAGE_SIZE_BYTES + 1)))
    ).rejects.toThrow("invalid_image_size");
  });

  it("processes a file in the allowed size range", async () => {
    const result = await validateAdminImageFile(makeFile("image/png", pngBytes));

    expect(result.size).toBeLessThanOrEqual(MAX_ADMIN_IMAGE_SIZE_BYTES);
  });

  it("uses storage extension from confirmed actual format", async () => {
    const result = await validateAdminImageFile(makeFile("image/png", pngBytes));

    expect(result.extension).toBe("png");
  });

  it("rejects files where declared MIME does not match actual signature", async () => {
    await expect(validateAdminImageFile(makeFile("image/png", jpegBytes))).rejects.toThrow("image_type_mismatch");
  });
});
