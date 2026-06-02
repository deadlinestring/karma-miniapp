import "server-only";

import type { TelegramAuthUser } from "@/lib/server/telegram-auth";
import { uploadPrivateCustomOrderImage } from "@/lib/server/supabase-storage";
import {
  validateCustomOrderImageFile,
  type ValidatedCustomOrderImageFile
} from "@/lib/server/upload-validation";

export type CustomOrderUploadServices = {
  validateImageFile: typeof validateCustomOrderImageFile;
  uploadImage: typeof uploadPrivateCustomOrderImage;
};

export type CustomOrderUploadResult = {
  customDesignKey: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  size: number;
};

const defaultServices: CustomOrderUploadServices = {
  validateImageFile: validateCustomOrderImageFile,
  uploadImage: uploadPrivateCustomOrderImage
};

export class CustomOrderUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomOrderUploadError";
  }
}

export async function uploadCustomOrderImage(file: File, telegramUser: TelegramAuthUser) {
  return uploadCustomOrderImageWithServices(file, telegramUser, defaultServices);
}

export async function uploadCustomOrderImageWithServices(
  file: File,
  telegramUser: TelegramAuthUser,
  services: CustomOrderUploadServices
): Promise<CustomOrderUploadResult> {
  if (!(file instanceof File)) {
    throw new CustomOrderUploadError("Выберите изображение для своего дизайна.");
  }

  const image = await validateUploadedImage(file, services);
  const uploaded = await services.uploadImage({
    telegramUserId: telegramUser.id,
    buffer: image.buffer,
    contentType: image.contentType,
    extension: image.extension
  });

  return {
    customDesignKey: uploaded.storagePath,
    storagePath: uploaded.storagePath,
    fileName: sanitizeFileName(file.name),
    contentType: image.contentType,
    size: image.size
  };
}

async function validateUploadedImage(file: File, services: CustomOrderUploadServices) {
  try {
    return await services.validateImageFile(file);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_image_size") {
      throw new CustomOrderUploadError("Загрузите изображение до 8 МБ.");
    }

    throw new CustomOrderUploadError("Поддерживаются только JPEG, PNG или WEBP изображения.");
  }
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();

  if (!trimmed) {
    return "custom-design";
  }

  return trimmed.slice(0, 120);
}

export type { ValidatedCustomOrderImageFile };
