const supabaseStorageUrl = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null;
const catalogBucket = process.env.SUPABASE_CATALOG_BUCKET || "catalog-images";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseStorageUrl
      ? [
          {
            protocol: "https",
            hostname: supabaseStorageUrl.hostname,
            pathname: `/storage/v1/object/public/${catalogBucket}/**`
          }
        ]
      : []
  }
};

export default nextConfig;
