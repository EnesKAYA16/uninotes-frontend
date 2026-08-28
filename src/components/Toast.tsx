import { useCallback, useRef, useState } from "react";
import { CloseIcon } from "./icons";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const AUTO_DISMISS_MS = 6000;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}

const KIND_STYLES: Record<ToastKind, string> = {
  success: "border-emerald-500/30 bg-emerald-950/80 text-emerald-100",
  error: "border-rose-500/30 bg-rose-950/80 text-rose-100",
  info: "border-indigo-500/30 bg-indigo-950/80 text-indigo-100",
};

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${KIND_STYLES[toast.kind]}`}
        >
          <p className="flex-1 leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="-m-1 shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
            aria-label="Bildirimi kapat"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
