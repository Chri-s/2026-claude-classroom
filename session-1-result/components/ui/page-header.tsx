import type { ReactNode } from "react";

/** The app bar every signed-in page sits under: title left, actions right. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </span>
        ) : null}
      </div>
      {children}
    </header>
  );
}
