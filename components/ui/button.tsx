import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "sm";
};

export default function Button({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <Link
      className={`button ${variant} ${size === "sm" ? "buttonSm" : ""} ${className}`.trim()}
      {...props}
    />
  );
}
