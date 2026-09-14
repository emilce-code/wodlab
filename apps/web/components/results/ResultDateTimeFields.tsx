"use client";

import { useId } from "react";

type Props = {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  legend: string;
  dateLabel: string;
  timeLabel: string;
  todayLabel: string;
  nowLabel: string;
  helpText?: string;
  dateError?: string;
  timeError?: string;
  disabled?: boolean;
};

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function localTimeValue(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default function ResultDateTimeFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  legend,
  dateLabel,
  timeLabel,
  todayLabel,
  nowLabel,
  helpText,
  dateError,
  timeError,
  disabled = false,
}: Props) {
  const generatedId = useId();
  const dateId = `${generatedId}-date`;
  const timeId = `${generatedId}-time`;
  const dateErrorId = `${dateId}-error`;
  const timeErrorId = `${timeId}-error`;

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold">{legend}</legend>

      <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-1.5 flex min-h-8 items-center justify-between gap-3">
            <label htmlFor={dateId} className="text-sm font-medium">
              {dateLabel}
            </label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDateChange(localDateValue())}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            >
              {todayLabel}
            </button>
          </div>
          <input
            id={dateId}
            type="date"
            value={date}
            required
            disabled={disabled}
            onChange={(event) => onDateChange(event.target.value)}
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? dateErrorId : undefined}
            className="min-h-12 w-full min-w-0 appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {dateError ? (
            <p id={dateErrorId} className="mt-1.5 text-sm text-red-500">
              {dateError}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex min-h-8 items-center justify-between gap-3">
            <label htmlFor={timeId} className="text-sm font-medium">
              {timeLabel}
            </label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onTimeChange(localTimeValue())}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            >
              {nowLabel}
            </button>
          </div>
          <input
            id={timeId}
            type="time"
            value={time}
            required
            disabled={disabled}
            onChange={(event) => onTimeChange(event.target.value)}
            aria-invalid={Boolean(timeError)}
            aria-describedby={timeError ? timeErrorId : undefined}
            className="min-h-12 w-full min-w-0 appearance-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {timeError ? (
            <p id={timeErrorId} className="mt-1.5 text-sm text-red-500">
              {timeError}
            </p>
          ) : null}
        </div>
      </div>

      {helpText ? <p className="mt-3 text-xs text-muted">{helpText}</p> : null}
    </fieldset>
  );
}
