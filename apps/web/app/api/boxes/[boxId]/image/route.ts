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
    return NextResponse.json(
      { message: "Invalid image upload" },
      { status: 400 },
    );
  }
  if (file.type !== "image/webp" || file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "Image must be an optimized WebP under 400 KB" },
      { status: 400 },
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { message: "Image storage is not configured" },
      { status: 503 },
    );
  }

  const authorization = await authenticatedApiFetch(
    `/boxes/${encodeURIComponent(boxId)}`,
    {
      method: "GET",
    },
  );
  const access = authorization?.ok
    ? ((await authorization.json()) as { canEditDetails?: boolean })
    : null;
  if (!authorization?.ok || !access?.canEditDetails) {
    return NextResponse.json(
      { message: "Box owner access required" },
      { status: authorization?.ok ? 403 : (authorization?.status ?? 503) },
    );
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
    return NextResponse.json(
      { message: "Unable to store image" },
      { status: 502 },
    );
  }

  const field = kind === "logo" ? "logoPath" : "coverImagePath";
  const save = await authenticatedApiFetch(
    `/boxes/${encodeURIComponent(boxId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: path }),
    },
  );

  if (!save?.ok) {
    await fetch(storageUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    }).catch(() => undefined);
    return NextResponse.json(
      { message: "Unable to update Box image" },
      { status: save?.status ?? 503 },
    );
  }

  return NextResponse.json({ path });
}

export async function DELETE(request: NextRequest, context: Context) {
  const { boxId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    kind?: unknown;
  } | null;
  const kind = body?.kind;

  if (kind !== "logo" && kind !== "cover") {
    return NextResponse.json(
      { message: "Invalid image removal" },
      { status: 400 },
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const field = kind === "logo" ? "logoPath" : "coverImagePath";

  const currentResponse = await authenticatedApiFetch(
    `/boxes/${encodeURIComponent(boxId)}`,
    {
      method: "GET",
    },
  );

  if (!currentResponse?.ok) {
    return NextResponse.json(
      { message: "Box owner access required" },
      { status: currentResponse?.status ?? 503 },
    );
  }

  const current = (await currentResponse.json().catch(() => null)) as {
    logoPath?: string | null;
    coverImagePath?: string | null;
  } | null;
  if (!(current as { canEditDetails?: boolean } | null)?.canEditDetails)
    return NextResponse.json(
      { message: "Box owner access required" },
      { status: 403 },
    );
  const previousPath = current?.[field] ?? null;

  const save = await authenticatedApiFetch(
    `/boxes/${encodeURIComponent(boxId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: null }),
    },
  );

  if (!save?.ok) {
    return NextResponse.json(
      { message: "Unable to remove Box image" },
      { status: save?.status ?? 503 },
    );
  }

  if (
    previousPath?.startsWith(`boxes/${boxId}/`) &&
    /^[A-Za-z0-9_-]+\.webp$/.test(
      previousPath.slice(`boxes/${boxId}/`.length),
    ) &&
    supabaseUrl &&
    serviceKey
  ) {
    await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${previousPath}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    }).catch(() => undefined);
  }

  return NextResponse.json({ path: null });
}
