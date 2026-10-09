import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { getFormControlClassName } from "./form-styles";

function invalid(value: InputHTMLAttributes<HTMLInputElement>["aria-invalid"]) {
  return (
    value === true ||
    value === "true" ||
    value === "grammar" ||
    value === "spelling"
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={getFormControlClassName({
        invalid: invalid(props["aria-invalid"]),
        className,
      })}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={getFormControlClassName({
        invalid: invalid(props["aria-invalid"]),
        className,
      })}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={getFormControlClassName({
        invalid: invalid(props["aria-invalid"]),
        className: `min-h-28 resize-y ${className ?? ""}`,
      })}
      {...props}
    />
  );
});

type SearchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "aria-label"
> & { "aria-label": string };
export const SearchInput = forwardRef<HTMLInputElement, SearchProps>(
  function SearchInput(props, ref) {
    return <TextInput ref={ref} type="search" {...props} />;
  },
);
