"use client";
import Image from "next/image";
import { useState } from "react";
import { boxImageUrl } from "@/lib/box-images";
export default function BoxLogo({
  name,
  path,
}: {
  name: string;
  path?: string | null;
}) {
  const src = boxImageUrl(path);
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-elevated text-3xl font-black text-accent">
      {src && failed !== src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="80px"
          unoptimized
          className="object-cover"
          onError={() => setFailed(src)}
        />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
