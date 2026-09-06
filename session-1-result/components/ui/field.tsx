import type { ComponentProps } from "react";

type FieldProps = ComponentProps<"input"> & { label: string };

/** A labelled text input; `id` doubles as the field's `name`. */
export function Field({ label, id, className = "", ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        className={`rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:border-zinc-50 dark:focus-visible:outline-zinc-50 ${className}`}
        {...props}
      />
    </div>
  );
}
