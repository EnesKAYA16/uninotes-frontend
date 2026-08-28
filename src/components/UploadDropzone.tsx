import { useCallback, useRef, useState } from "react";
import { ApiError, uploadDocument, type UniDocument } from "../lib/api";
import { ACCEPTED_MIME_PREFIXES, FILE_ACCEPT, MAX_FILE_SIZE } from "../lib/constants";
import { formatFileSize } from "../lib/format";
import { UploadIcon } from "./icons";
import { Spinner } from "./Spinner";
import type { ToastKind } from "./Toast";

interface UploadDropzoneProps {
  token: string;
  onUploaded: (document: UniDocument) => void;
  notify: (kind: ToastKind, message: string) => void;
}

interface Progress {
  fileName: string;
  percent: number;
  index: number;
  total: number;
}

/** İstek gönderilmeden önce istemci tarafında doğrulama. */
function validate(file: File): string | null {
  const accepted = ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
  if (!accepted) {
    return `“${file.name}” desteklenmiyor. Yalnızca PDF ve fotoğraf yükleyebilirsiniz.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `“${file.name}” çok büyük (${formatFileSize(file.size)}). Üst sınır 20 MB.`;
  }
  return null;
}

export function UploadDropzone({ token, onUploaded, notify }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const uploadAll = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      for (const [index, file] of files.entries()) {
        const problem = validate(file);
        if (problem) {
          notify("error", problem);
          continue;
        }

        setProgress({ fileName: file.name, percent: 0, index: index + 1, total: files.length });
        try {
          const uploaded = await uploadDocument(file, token, (percent) => {
            setProgress((current) => (current ? { ...current, percent } : current));
          });
          onUploaded(uploaded);
          notify("success", `“${uploaded.title}” yüklendi.`);
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : "Dosya yüklenirken bir hata oluştu.";
          // 409 bir hata değil, bilgi: dosya zaten arşivde.
          notify(error instanceof ApiError && error.status === 409 ? "info" : "error", message);
        }
      }

      setProgress(null);
    },
    [notify, onUploaded, token],
  );

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void uploadAll(Array.from(event.dataTransfer.files));
  };

  const busy = progress !== null;

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={handleDrop}
      className={`rounded-2xl border border-dashed p-5 transition sm:p-7 ${
        dragging
          ? "border-indigo-400 bg-indigo-500/10"
          : "border-white/12 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => {
          void uploadAll(Array.from(event.target.files ?? []));
          event.target.value = ""; // Aynı dosya tekrar seçilebilsin.
        }}
      />

      {busy ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Spinner className="size-4 shrink-0 text-indigo-300" />
            <span className="min-w-0 flex-1 truncate">
              {progress.total > 1 && (
                <span className="text-slate-500">
                  {progress.index}/{progress.total}{" "}
                </span>
              )}
              {progress.fileName}
            </span>
            <span className="shrink-0 tabular-nums text-slate-400">%{progress.percent}</span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-indigo-400 transition-[width] duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <UploadIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200">
              Dosyaları buraya sürükleyin
              <span className="hidden sm:inline"> veya seçin</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              PDF ve fotoğraf · en fazla 20 MB · PDF'lerin metni otomatik çıkarılır
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-11 w-full shrink-0 rounded-xl bg-indigo-500 px-5 text-sm font-medium text-white transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 sm:w-auto"
          >
            Dosya seç
          </button>
        </div>
      )}
    </div>
  );
}
