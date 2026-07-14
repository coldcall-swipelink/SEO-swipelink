import { NextRequest, NextResponse } from "next/server";
import { getUpload } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sert une image stockée en base (fallback sans Vercel Blob).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let upload: Awaited<ReturnType<typeof getUpload>> = null;
  try {
    upload = await getUpload(id);
  } catch {
    return NextResponse.json({ error: "Stockage indisponible" }, { status: 500 });
  }
  if (!upload) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(upload.data), {
    status: 200,
    headers: {
      "Content-Type": upload.contentType,
      // Nom de fichier immuable → cache long côté navigateur et CDN.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
