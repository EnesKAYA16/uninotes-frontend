import { useEffect, useState } from "react";
import { isProcessing, type UniDocument } from "../lib/api";
import { fileKindLabel, formatDate, formatFileSize } from "../lib/format";
import { ExternalIcon, FileIcon, ImageIcon, TrashIcon } from "./icons";
import { Spinner } from "./Spinner";
import { StatusBadge } from "./StatusBadge";

/** Yanlışlıkla silmeyi önlemek için onay bu süre sonunda kendiliğinden iptal olur. */
const CONFIRM_TIMEOUT_MS = 4000;

interface DocumentCardProps {
  document: UniDocument;
  /** Verilmezse kartta silme butonu çıkmaz. */
  onDelete?: (document: UniDocument) => Promise<void>;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const isImage = document.mimeType?.startsWith("image/");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = [
    fileKindLabel(document.mimeType, document.title),
    formatFileSize(document.size),
    formatDate(document.createdAt),
  ].filter(Boolean);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  async function handleDeleteClick() {
    if (!onDelete || deleting) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setDeleting(true);
    try {
      await onDelete(document);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-indigo-400/40 hover:bg-white/[0.06] focus-within:border-indigo-400/40">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
          {isImage ? <ImageIcon className="size-5" /> : <FileIcon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          {/* Bağlantı kartın tamamını kaplıyor; silme butonu üstte kalsın diye z-10 alıyor. */}
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            title={document.title}
            className="block truncate text-sm font-medium text-slate-100 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            {document.title}
          </a>
          <p className="mt-0.5 truncate text-xs text-slate-400">{meta.join(" · ")}</p>
        </div>
        <ExternalIcon className="size-4 shrink-0 text-slate-500 transition group-hover:text-indigo-300" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={document.status} />

        <div className="flex min-w-0 items-center gap-2">
          {isProcessing(document.status) && (
            <span className="truncate text-xs text-slate-500">Aramada birazdan görünür</span>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              onBlur={() => setConfirming(false)}
              disabled={deleting}
              aria-label={confirming ? `${document.title} dosyasını sil` : "Dosyayı sil"}
              title={confirming ? "Silmeyi onayla" : "Dosyayı sil"}
              className={`relative z-10 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs transition disabled:opacity-50 ${
                confirming
                  ? "bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-500/40"
                  : "text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
              }`}
            >
              {deleting ? <Spinner className="size-4" /> : <TrashIcon className="size-4" />}
              {confirming && !deleting && "Emin misiniz?"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
