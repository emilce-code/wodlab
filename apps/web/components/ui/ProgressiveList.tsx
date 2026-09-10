"use client";

import { Children, ReactNode, useState } from "react";
import { useTranslations } from "next-intl";

import Button from "./Button";

type Props = {
  children: ReactNode;
  className?: string;
  initialCount?: number;
  increment?: number;
};

export default function ProgressiveList({
  children,
  className,
  initialCount = 10,
  increment = 10,
}: Props) {
  const t = useTranslations("pagination");
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const shownCount = Math.min(visibleCount, items.length);
  const remainingCount = items.length - shownCount;

  return (
    <>
      <div className={className}>{items.slice(0, shownCount)}</div>

      {remainingCount > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() =>
              setVisibleCount((current) =>
                Math.min(current + increment, items.length),
              )
            }
          >
            {t("loadMore", { count: Math.min(increment, remainingCount) })}
          </Button>
          <p className="text-xs text-muted" aria-live="polite">
            {t("showing", { shown: shownCount, total: items.length })}
          </p>
        </div>
      ) : null}
    </>
  );
}
