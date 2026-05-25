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

let storageClient: SupabaseClient | null = null;

function getStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_CATALOG_BUCKET;

  if (!supabaseUrl || !supabaseKey || !bucket) {
    throw new Error("supabase_storage_env_missing");
  }

  return { supabaseUrl, supabaseKey, bucket };
}

function getSupabaseStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  const { supabaseUrl, supabaseKey } = getStorageConfig();

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
