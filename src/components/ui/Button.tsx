"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "inverted";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 font-semibold rounded-full " +
  "transition-[transform,background-color,color,box-shadow,border-color] duration-200 ease-out " +
  "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-on-ink hover:bg-[#2a241c] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink hover:-translate-y-0.5 shadow-[var(--shadow-xs)]",
  ghost: "text-ink hover:bg-paper-2 border border-transparent",
  inverted:
    "bg-accent text-white hover:bg-accent-2 shadow-[var(--shadow-accent)] hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-4 h-9",
  md: "text-[0.95rem] px-6 h-12",
  lg: "text-base px-8 h-14",
};

interface ButtonOwnProps {
  variant?: Variant;
  size?: Size;
  href?: string;
  withArrow?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = ButtonOwnProps &
  Omit<ComponentProps<"button">, keyof ButtonOwnProps> &
  Partial<Pick<ComponentProps<typeof Link>, "target" | "rel">>;

export default function Button({
  variant = "primary",
  size = "md",
  href,
  withArrow = false,
  children,
  className = "",
  target,
  rel,
  ...rest
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  const inner = (
    <>
      <span className="relative">{children}</span>
      {withArrow && (
        <ArrowRight
          className="h-[1.05em] w-[1.05em] transition-transform duration-300 ease-out group-hover:translate-x-1"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (href) {
    const external = href.startsWith("http");
    return (
      <Link
        href={href}
        className={cls}
        target={target ?? (external ? "_blank" : undefined)}
        rel={rel ?? (external ? "noopener noreferrer" : undefined)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}
