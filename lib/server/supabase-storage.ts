import "server-only";

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type UploadPublicImageInput = {
  kind: "logo" | "hero";
  buffer: Buffer;
  contentType: string;
  extension: string;
};

type UploadedPublicImage = {
  publicUrl: string;
  storagePath: string;
};

type UploadPublicProductImageInput = {
  productId: string;
  buffer: Buffer;
  contentType: string;
  extension: string;
};

type UploadPrivateCustomOrderImageInput = {
  telegramUserId: string;
  buffer: Buffer;
  contentType: string;
  extension: string;
};

type UploadedPrivateCustomOrderImage = {
  storagePath: string;
};

type SignedPrivateCustomOrderImage = {
  signedUrl: string;
  expiresInSeconds: number;
};

let storageClient: SupabaseClient | null = null;

function getStorageBaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("supabase_storage_env_missing");
  }

  return { supabaseUrl, supabaseKey };
}

function getStorageConfig() {
  const baseConfig = getStorageBaseConfig();
  const bucket = process.env.SUPABASE_CATALOG_BUCKET;

  if (!bucket) {
    throw new Error("supabase_storage_env_missing");
  }

  return { ...baseConfig, bucket };
}

function getCustomOrderStorageConfig() {
  const baseConfig = getStorageBaseConfig();
  const bucket = process.env.SUPABASE_CUSTOM_ORDER_BUCKET;

  if (!bucket) {
    throw new Error("supabase_custom_order_storage_env_missing");
  }

  return { ...baseConfig, bucket };
}

function getSupabaseStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  const { supabaseUrl, supabaseKey } = getStorageBaseConfig();

  storageClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return storageClient;
}

export async function uploadPublicStoreImage(input: UploadPublicImageInput): Promise<UploadedPublicImage> {
  const { bucket } = getStorageConfig();
  const storagePath = `store/${input.kind}/${randomUUID()}.${input.extension}`;
  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(bucket).upload(storagePath, input.buffer, {
    contentType: input.contentType,
    cacheControl: "31536000",
    upsert: false
  });

  if (error) {
    throw new Error("supabase_storage_upload_failed");
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: data.publicUrl
  };
}

export async function deletePublicStoreImage(storagePath: string) {
  const { bucket } = getStorageConfig();
  const client = getSupabaseStorageClient();

  await client.storage.from(bucket).remove([storagePath]);
}

export async function uploadPublicProductImage(input: UploadPublicProductImageInput): Promise<UploadedPublicImage> {
  const { bucket } = getStorageConfig();
  const storagePath = `products/${input.productId}/${randomUUID()}.${input.extension}`;
  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(bucket).upload(storagePath, input.buffer, {
    contentType: input.contentType,
    cacheControl: "31536000",
    upsert: false
  });

  if (error) {
    throw new Error("supabase_storage_upload_failed");
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: data.publicUrl
  };
}

export async function deletePublicProductImage(productId: string, storagePath: string) {
  if (!isManagedProductImagePath(productId, storagePath)) {
    return;
  }

  const { bucket } = getStorageConfig();
  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(bucket).remove([storagePath]);

  if (error) {
    throw new Error("supabase_storage_delete_failed");
  }
}

export async function uploadPrivateCustomOrderImage(
  input: UploadPrivateCustomOrderImageInput
): Promise<UploadedPrivateCustomOrderImage> {
  const { bucket } = getCustomOrderStorageConfig();
  const storagePath = `custom-orders/${input.telegramUserId}/${randomUUID()}.${input.extension}`;
  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(bucket).upload(storagePath, input.buffer, {
    contentType: input.contentType,
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error("supabase_custom_order_upload_failed");
  }

  return { storagePath };
}

export async function createPrivateCustomOrderImageSignedUrl(
  storagePath: string,
  expiresInSeconds = 120
): Promise<SignedPrivateCustomOrderImage> {
  if (!isManagedCustomOrderImageStoragePath(storagePath)) {
    throw new Error("invalid_custom_order_storage_path");
  }

  const { bucket } = getCustomOrderStorageConfig();
  const client = getSupabaseStorageClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error("supabase_custom_order_signed_url_failed");
  }

  return {
    signedUrl: data.signedUrl,
    expiresInSeconds
  };
}

export function isManagedProductImagePath(productId: string, storagePath: string | null | undefined) {
  return typeof storagePath === "string" && storagePath.startsWith(`products/${productId}/`);
}

export function isManagedCustomOrderImagePath(
  telegramUserId: string,
  storagePath: string | null | undefined
) {
  return (
    typeof storagePath === "string" && storagePath.startsWith(`custom-orders/${telegramUserId}/`)
  );
}

export function isManagedCustomOrderImageStoragePath(storagePath: string | null | undefined) {
  return typeof storagePath === "string" && /^custom-orders\/[^/]+\/[^/]+$/.test(storagePath);
}
