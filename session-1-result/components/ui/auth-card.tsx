import type { ComponentProps, ReactNode } from "react";

type AuthCardProps = ComponentProps<"form"> & {
  title: string;
  footer: ReactNode;
};

/** Centred card shell shared by /signup and /login; children are the fields. */
export function AuthCard({
  title,
  footer,
  children,
  className = "",
  ...props
}: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <form
        className={`flex w-full max-w-sm flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
        {...props}
      >
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {children}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{footer}</p>
      </form>
    </main>
  );
}
