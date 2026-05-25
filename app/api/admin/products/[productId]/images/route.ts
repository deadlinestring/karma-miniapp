import { NextResponse } from "next/server";
import { requireTelegramAdmin } from "@/lib/server/admin-auth";
import { addAdminProductGalleryImage, uploadAdminProductCoverImage } from "@/lib/server/admin-products";
import { validateAdminImageFile } from "@/lib/server/upload-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    productId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const admin = requireTelegramAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if ((kind !== "cover" && kind !== "gallery") || !(file instanceof File)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const image = await validateAdminImageFile(file);
    const product =
      kind === "cover"
        ? await uploadAdminProductCoverImage(context.params.productId, image)
        : await addAdminProductGalleryImage(context.params.productId, image);

    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
