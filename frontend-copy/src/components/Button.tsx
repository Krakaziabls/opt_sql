import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils"; // Утилита для объединения классов

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-white hover:bg-primary/90",
                outline: "border border-muted text-muted hover:bg-muted/20",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 px-3",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    )
);
Button.displayName = "Button";

export { Button, buttonVariants };
