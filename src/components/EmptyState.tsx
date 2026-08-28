import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/5 text-slate-400">
        {icon}
      </div>
      <p className="text-base font-medium text-slate-200">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
