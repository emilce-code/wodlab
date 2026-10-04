import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

const BUCKET = "box-media";
const MAX_BYTES = 400_000;

type Context = { params: Promise<{ boxId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { boxId } = await context.params;
  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");

  if (!(file instanceof File) || (kind !== "logo" && kind !== "cover")) {
    return NextResponse.json({ message: "Invalid image upload" }, { status: 400 });
  }
  if (file.type !== "image/webp" || file.size > MAX_BYTES) {
    return NextResponse.json({ message: "Image must be an optimized WebP under 400 KB" }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ message: "Image storage is not configured" }, { status: 503 });
  }

  await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: MAX_BYTES,
      allowed_mime_types: ["image/webp"],
    }),
  });

  const authorization = await authenticatedApiFetch(`/boxes/${boxId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!authorization?.ok) {
    return NextResponse.json(
      { message: "Box owner access required" },
      { status: authorization?.status ?? 503 },
    );
  }

  const path = `boxes/${boxId}/${kind}-${Date.now()}.webp`;
  const storageUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`;
  const upload = await fetch(storageUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "image/webp",
      "x-upsert": "true",
      "Cache-Control": "3600",
    },
    body: await file.arrayBuffer(),
  });

  if (!upload.ok) {
    return NextResponse.json({ message: "Unable to store image" }, { status: 502 });
  }

  const field = kind === "logo" ? "logoPath" : "coverImagePath";
  const save = await authenticatedApiFetch(`/boxes/${boxId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: path }),
  });

  if (!save?.ok) {
    await fetch(storageUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    }).catch(() => undefined);
    return NextResponse.json({ message: "Unable to update Box image" }, { status: save?.status ?? 503 });
  }

  return NextResponse.json({ path });
}
