import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { updateAdminSettingsImage } from "@/lib/server/admin-settings";
import { deletePublicStoreImage, uploadPublicStoreImage } from "@/lib/server/supabase-storage";
import { validateAdminImageFile, validateAdminUploadKind } from "@/lib/server/upload-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  let uploadedPath: string | null = null;

  try {
    const formData = await request.formData();
    const kind = validateAdminUploadKind(formData.get("kind"));
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const image = await validateAdminImageFile(file);
    const uploaded = await uploadPublicStoreImage({
      kind,
      buffer: image.buffer,
      contentType: image.contentType,
      extension: image.extension
    });

    uploadedPath = uploaded.storagePath;
    const settings = await updateAdminSettingsImage(kind, uploaded.publicUrl);

    return NextResponse.json({ ok: true, settings });
  } catch {
    if (uploadedPath) {
      await deletePublicStoreImage(uploadedPath).catch(() => undefined);
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
