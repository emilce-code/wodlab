import { NextRequest, NextResponse } from "next/server";

import { authenticatedApiFetch } from "@/lib/api";

const BUCKET = "box-media";
const MAX_BYTES = 250_000;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Invalid profile image upload" }, { status: 400 });
  }
  if (file.type !== "image/webp" || file.size > MAX_BYTES) {
    return NextResponse.json({ message: "Profile image must be an optimized WebP under 250 KB" }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ message: "Image storage is not configured" }, { status: 503 });
  }

  const profileResponse = await authenticatedApiFetch("/athlete-profile");
  if (!profileResponse?.ok) {
    return NextResponse.json({ message: "Athlete profile is required" }, { status: profileResponse?.status ?? 503 });
  }
  const profile = (await profileResponse.json()) as { id: string };
  const path = `profiles/${profile.id}/avatar-${Date.now()}.webp`;
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
    const detail = process.env.NODE_ENV === "development" ? await upload.text() : undefined;
    return NextResponse.json(
      { message: "Unable to store profile image", ...(detail ? { detail } : {}) },
      { status: 502 },
    );
  }

  const save = await authenticatedApiFetch("/athlete-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarPath: path }),
  });

  if (!save?.ok) {
    return NextResponse.json({ message: "Unable to update profile image" }, { status: save?.status ?? 503 });
  }

  return NextResponse.json({ path });
}
