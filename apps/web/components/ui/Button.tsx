"use client";
import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  getButtonClassName,
  type ButtonVariant,
  type ButtonSize,
} from "./button-styles";
export {
  getButtonClassName,
  type ButtonVariant,
  type ButtonSize,
} from "./button-styles";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled,
    className = "",
    ...props
  },
  ref,
) {
  const element = useRef<HTMLButtonElement>(null);
  const idleWidth = useRef<number | null>(null);
  useImperativeHandle(ref, () => element.current!, []);
  useLayoutEffect(() => {
    const button = element.current;
    if (!button) return;
    if (!isLoading) {
      idleWidth.current = button.getBoundingClientRect().width;
      return;
    }
    const original = button.style.width;
    if (idleWidth.current !== null)
      button.style.width = `${idleWidth.current}px`;
    function resize() {
      if (!button) return;
      button.style.width = original;
      button.style.width = `${button.getBoundingClientRect().width}px`;
    }
    window.addEventListener("resize", resize);
    return () => {
      button.style.width = original;
      window.removeEventListener("resize", resize);
    };
  }, [isLoading, children]);
  return (
    <button
      ref={element}
      className={getButtonClassName({
        variant,
        size,
        className: `relative ${className}`,
      })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="absolute h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}

      <span
        className={`inline-flex items-center justify-center gap-2 ${isLoading ? "opacity-0" : ""}`}
      >
        {children}
      </span>
    </button>
  );
});

export default Button;
