import type { ComponentProps } from "react";

/** The one filled-button look; every auth form submits through it. */
export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      className={`rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus-visible:outline-zinc-50 ${className}`}
      {...props}
    />
  );
}
