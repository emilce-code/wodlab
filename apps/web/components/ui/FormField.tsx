"use client";

import { useId, type ReactNode } from "react";

type ControlProps = {
  id: string;
  required: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
};
type Props = {
  id?: string;
  label: ReactNode;
  required?: boolean;
  optionalLabel?: ReactNode;
  help?: ReactNode;
  error?: string;
  className?: string;
  children: (props: ControlProps) => ReactNode;
};

// Required and optional semantics come from the caller's existing domain rules.
export default function FormField({
  id,
  label,
  required = false,
  optionalLabel,
  help,
  error,
  className = "",
  children,
}: Props) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const helpId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const describedBy =
    [help ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <label htmlFor={controlId} className="block text-sm font-semibold">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-red-400">
            *
          </span>
        ) : optionalLabel ? (
          <span className="ml-1 font-normal text-muted">{optionalLabel}</span>
        ) : null}
      </label>
      {children({
        id: controlId,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-errormessage": error ? errorId : undefined,
      })}
      {help ? (
        <p id={helpId} className="text-sm leading-relaxed text-muted">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
