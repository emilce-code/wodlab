import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "./Button";

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export default function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ variant, size, className })}
      {...props}
    />
  );
}
