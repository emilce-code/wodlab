import type { InputHTMLAttributes } from "react";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "value" | "onChange"
> & {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  suffix?: string;
};

export default function ResultNumberField({
  id,
  label,
  value,
  onChange,
  error,
  suffix,
  step,
  className = "",
  ...props
}: Props) {
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode={step && step !== 1 && step !== "1" ? "decimal" : "numeric"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={[
            "min-h-12 w-full rounded-lg border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted",
            suffix ? "pr-14" : "",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              : "border-border focus:border-accent/60 focus:ring-2 focus:ring-accent/10",
          ].join(" ")}
          {...props}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
