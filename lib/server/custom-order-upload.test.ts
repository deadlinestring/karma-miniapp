import { describe, expect, it, vi } from "vitest";
import {
  CustomOrderUploadError,
  uploadCustomOrderImageWithServices,
  type CustomOrderUploadServices
} from "./custom-order-upload";

const telegramUser = { id: "12345", username: "buyer" };

function makeFile(name = "idea.png") {
  return new File(["image"], name, { type: "image/png" });
}

function makeServices(overrides: Partial<CustomOrderUploadServices> = {}) {
  return {
    validateImageFile: vi.fn().mockResolvedValue({
      buffer: Buffer.from("image"),
      contentType: "image/png",
      extension: "png",
      size: 5
    }),
    uploadImage: vi.fn().mockResolvedValue({
      storagePath: "custom-orders/12345/image.png"
    }),
    ...overrides
  } satisfies CustomOrderUploadServices;
}

describe("uploadCustomOrderImageWithServices", () => {
  it("uploads a validated image into private custom order storage", async () => {
    const services = makeServices();

    const result = await uploadCustomOrderImageWithServices(makeFile(), telegramUser, services);

    expect(services.validateImageFile).toHaveBeenCalled();
    expect(services.uploadImage).toHaveBeenCalledWith({
      telegramUserId: "12345",
      buffer: Buffer.from("image"),
      contentType: "image/png",
      extension: "png"
    });
    expect(result).toEqual({
      customDesignKey: "custom-orders/12345/image.png",
      storagePath: "custom-orders/12345/image.png",
      fileName: "idea.png",
      contentType: "image/png",
      size: 5
    });
  });

  it("returns safe validation errors for size and unsupported type", async () => {
    await expect(
      uploadCustomOrderImageWithServices(
        makeFile(),
        telegramUser,
        makeServices({
          validateImageFile: vi.fn().mockRejectedValue(new Error("invalid_image_size"))
        })
      )
    ).rejects.toThrow(new CustomOrderUploadError("Загрузите изображение до 8 МБ."));

    await expect(
      uploadCustomOrderImageWithServices(
        makeFile(),
        telegramUser,
        makeServices({
          validateImageFile: vi.fn().mockRejectedValue(new Error("unsupported_image_type"))
        })
      )
    ).rejects.toThrow(
      new CustomOrderUploadError("Поддерживаются только JPEG, PNG или WEBP изображения.")
    );
  });
});
