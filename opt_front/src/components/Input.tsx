// src/components/Input.tsx
import React from "react";
import { cn } from "../lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onKeyDown"> {
    multiline?: boolean;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    ({ className, multiline, onKeyDown, ...props }, ref) => {
        if (multiline) {
            return (
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-lg border-none bg-[#4A4A4A] px-4 py-2 text-text placeholder-muted focus:outline-none resize-none",
                        className
                    )}
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    onKeyDown={onKeyDown}
                    {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                />
            );
        }

        return (
            <input
                className={cn(
                    "flex h-10 w-full rounded-lg border-none bg-[#4A4A4A] px-4 py-2 text-text placeholder-muted focus:outline-none",
                    className
                )}
                ref={ref as React.Ref<HTMLInputElement>}
                onKeyDown={onKeyDown}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";

export { Input };
