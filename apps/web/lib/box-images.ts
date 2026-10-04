const BOX_MEDIA_BUCKET = "box-media";

export function boxImageUrl(
  path: string | null | undefined,
  version?: string | number | null,
) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const url = `${base}/storage/v1/object/public/${BOX_MEDIA_BUCKET}/${path}`;
  return version ? `${url}?v=${version}` : url;
}

export async function optimizeBoxImage(
  file: File,
  kind: "logo" | "cover",
): Promise<File> {
  const image = await createImageBitmap(file);
  const maxWidth = kind === "logo" ? 256 : 1200;
  const maxHeight = kind === "logo" ? 256 : 400;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image optimization is unavailable");
  context.drawImage(image, 0, 0, width, height);
  image.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Unable to optimize image"))),
      "image/webp",
      kind === "logo" ? 0.82 : 0.78,
    ),
  );
  return new File([blob], `${kind}.webp`, { type: "image/webp" });
}
