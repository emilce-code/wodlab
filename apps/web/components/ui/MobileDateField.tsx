"use client";

import { useId, useRef } from "react";
import { useTranslations } from "next-intl";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  planningShortcuts?: boolean;
  className?: string;
};

function dateValue(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MobileDateField({
  value,
  onChange,
  label,
  id,
  name,
  min,
  max,
  required,
  disabled,
  planningShortcuts = false,
  className = "",
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("common.datePicker");

  function choose(nextValue: string) {
    if ((!min || nextValue >= min) && (!max || nextValue <= max)) {
      onChange(nextValue);
    }
  }

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="date"
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full min-w-0 appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-12 text-base text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.showPicker?.()}
          aria-label={t("open")}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-xl text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <span aria-hidden="true">▣</span>
        </button>
      </div>
      {planningShortcuts ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            [t("today"), dateValue(0)],
            [t("tomorrow"), dateValue(1)],
            [t("nextWeek"), dateValue(7)],
          ].map(([text, nextValue]) => (
            <button
              key={nextValue}
              type="button"
              disabled={disabled || nextValue === value}
              onClick={() => choose(nextValue)}
              className="min-h-10 rounded-lg border border-border px-2 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-foreground disabled:bg-accent/10 disabled:text-accent"
            >
              {text}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
