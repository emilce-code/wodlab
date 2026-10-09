"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import BoxDetailsIcon from "./BoxDetailsIcon";

export default function BoxLocationMap({
  destination,
  name,
  thumbnail = false,
  responsive = false,
}: {
  destination: string;
  name: string;
  thumbnail?: boolean;
  responsive?: boolean;
}) {
  const t = useTranslations("boxDetailsV4");
  const [failedDestination, setFailedDestination] = useState<string | null>(
    null,
  );
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;
  useEffect(() => {
    const controller = new AbortController();
    // Opaque HEAD responses suffice to detect network failure without reading
    // cross-origin map content. HTTP/provider failures may remain opaque.
    void fetch(mapUrl, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    }).catch(() => {
      if (!controller.signal.aborted) setFailedDestination(destination);
    });
    return () => controller.abort();
  }, [destination, mapUrl]);
  const height = thumbnail
    ? "h-24"
    : responsive
      ? "h-[120px] md:h-48"
      : "h-[120px]";
  return (
    <div
      className={`${height} overflow-hidden rounded-xl border border-border bg-surface-elevated`}
    >
      {failedDestination === destination ? (
        <p
          role="status"
          className="flex h-full items-center gap-3 p-3 text-xs leading-5 text-muted"
        >
          <BoxDetailsIcon
            name="location"
            className="h-6 w-6 shrink-0 text-accent"
          />
          {t("mapUnavailable")}
        </p>
      ) : (
        <iframe
          title={t("mapTitle", { name })}
          src={mapUrl}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`${height} w-full border-0`}
          onError={() => setFailedDestination(destination)}
        />
      )}
    </div>
  );
}
