"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition-all " +
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px] whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-teamA text-white shadow-lift hover:bg-teamA-deep",
        danger: "bg-teamB text-white shadow-lift hover:bg-teamB-deep",
        dark: "bg-ink text-white hover:bg-ink-soft shadow-lift",
        outline: "border-2 border-paper-line bg-white text-ink hover:border-ink/25 hover:bg-paper",
        ghost: "text-ink-soft hover:bg-paper hover:text-ink",
        rope: "bg-rope text-ink shadow-lift hover:bg-rope-dark hover:text-white",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-14 px-7 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
