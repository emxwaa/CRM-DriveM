import type { ComponentProps } from "react";

// Adapted from the shadcn/ui New York registry. See LICENSE.shadcn.md.
export function Button({ className = "", type = "button", ...props }: ComponentProps<"button">) {
  return <button data-slot="button" type={type} className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-action px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props} />;
}

export function Input({ className = "", type, ...props }: ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={`h-11 w-full min-w-0 rounded-lg border border-line bg-white px-3 py-1 text-base shadow-xs transition-[color,box-shadow] selection:bg-brand-light selection:text-primary-action placeholder:text-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-primary-action md:text-sm ${className}`} {...props} />;
}
