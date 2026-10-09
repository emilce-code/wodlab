"use client";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
export type StaffMode = "details" | "edit" | "attendance";
export default function StaffClassActions({
  boxId,
  classId,
  day,
  onOpen,
}: {
  boxId: string;
  classId: string;
  day?: string;
  onOpen?: (mode: StaffMode) => void;
}) {
  const t = useTranslations("classStaff");
  return (
    <div
      className={`flex gap-2 ${onOpen ? "flex-wrap" : "flex-col sm:flex-row"}`}
    >
      {(["edit", "attendance"] as const).map((mode) =>
        onOpen ? (
          <Button
            key={mode}
            type="button"
            variant="secondary"
            onClick={() => onOpen(mode)}
          >
            {t(mode)}
          </Button>
        ) : (
          <Link
            key={mode}
            href={`/classes/${encodeURIComponent(boxId)}/${encodeURIComponent(classId)}/${mode}${day ? `?${new URLSearchParams({ day })}` : ""}`}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent ${mode === "edit" ? "bg-accent text-accent-foreground hover:bg-accent-strong" : "border border-border bg-surface hover:bg-surface-elevated"}`}
          >
            {t(mode)}
          </Link>
        ),
      )}
    </div>
  );
}
