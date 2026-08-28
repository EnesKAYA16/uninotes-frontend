import { isProcessing, type DocumentStatus } from "../lib/api";

const STYLES: Record<DocumentStatus, { label: string; className: string; title: string }> = {
  PENDING: {
    label: "Sırada",
    className: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    title: "Dosya metin çıkarma sırasında bekliyor.",
  },
  PROCESSING: {
    label: "İşleniyor",
    className: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    title: "İçerik çıkarılıyor, bitince aranabilir olacak.",
  },
  COMPLETED: {
    label: "Aranabilir",
    className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    title: "İçerik işlendi, bu dosya aramada bulunabilir.",
  },
  FAILED: {
    label: "İşlenemedi",
    className: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    title: "İçerik çıkarılamadı; dosya yine de açılabilir.",
  },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const style = STYLES[status] ?? {
    label: status,
    className: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
    title: "",
  };

  return (
    <span
      title={style.title}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.className}`}
    >
      {isProcessing(status) && (
        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
      )}
      {style.label}
    </span>
  );
}
