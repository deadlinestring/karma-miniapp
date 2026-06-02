import { fileTypeFromBuffer } from "file-type";

export const MAX_ADMIN_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
export const MAX_CUSTOM_ORDER_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const allowedImageTypes = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export type ValidatedAdminImageFile = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  size: number;
};

export type ValidatedCustomOrderImageFile = ValidatedAdminImageFile;

export async function validateAdminImageFile(file: File): Promise<ValidatedAdminImageFile> {
  return validateImageFile(file, MAX_ADMIN_IMAGE_SIZE_BYTES);
}

export async function validateCustomOrderImageFile(
  file: File
): Promise<ValidatedCustomOrderImageFile> {
  return validateImageFile(file, MAX_CUSTOM_ORDER_IMAGE_SIZE_BYTES);
}

async function validateImageFile(
  file: File,
  maxSizeBytes: number
): Promise<ValidatedAdminImageFile> {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("unsupported_image_type");
  }

  if (file.size <= 0 || file.size > maxSizeBytes) {
    throw new Error("invalid_image_size");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const actualType = await fileTypeFromBuffer(buffer);
  const extension = actualType?.mime ? allowedImageTypes.get(actualType.mime) : undefined;

  if (!extension) {
    throw new Error("unsupported_image_type");
  }

  if (actualType?.mime !== file.type) {
    throw new Error("image_type_mismatch");
  }

  return {
    buffer,
    contentType: actualType.mime,
    extension,
    size: file.size
  };
}

export function validateAdminUploadKind(value: FormDataEntryValue | null): "logo" | "hero" {
  if (value === "logo" || value === "hero") {
    return value;
  }

  throw new Error("invalid_upload_kind");
}
