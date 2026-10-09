import Button, { type ButtonProps } from "./Button";

type Props = Omit<ButtonProps, "size" | "aria-label"> & {
  "aria-label": string;
};

export default function IconButton({ variant = "ghost", ...props }: Props) {
  return <Button variant={variant} size="icon" {...props} />;
}
