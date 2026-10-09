"use client";
import Image from "next/image";
import { useState } from "react";
import { boxImageUrl } from "@/lib/box-images";
export default function BoxLogo({
  name,
  path,
  size = "default",
}: {
  name: string;
  path?: string | null;
  size?: "default" | "small";
}) {
  const src = boxImageUrl(path);
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-accent bg-background text-3xl font-black text-accent ${size === "small" ? "h-16 w-16" : "h-20 w-20"}`}
    >
      {src && failed !== src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={size === "small" ? "64px" : "80px"}
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
