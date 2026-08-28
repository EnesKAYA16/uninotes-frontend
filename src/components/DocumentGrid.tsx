import type { UniDocument } from "../lib/api";
import { DocumentCard } from "./DocumentCard";
import { EmptyState } from "./EmptyState";
import { FileIcon, InfoIcon, RefreshIcon } from "./icons";
import { Spinner } from "./Spinner";

interface DocumentGridProps {
  documents: UniDocument[];
  /** null: henüz denenmedi · false: backend'de GET /documents yok · true: uç çalışıyor */
  listEndpointAvailable: boolean | null;
  loading: boolean;
  onRefresh: () => void;
  onDelete: (document: UniDocument) => Promise<void>;
}

export function DocumentGrid({
  documents,
  listEndpointAvailable,
  loading,
  onRefresh,
  onDelete,
}: DocumentGridProps) {
  return (
    <section aria-labelledby="dosyalarim-baslik">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="dosyalarim-baslik" className="text-sm font-semibold tracking-wide text-slate-300">
          Arşiv
          {documents.length > 0 && (
            <span className="ml-2 text-slate-500">{documents.length}</span>
          )}
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
        >
          {loading ? <Spinner className="size-4" /> : <RefreshIcon className="size-4" />}
          Yenile
        </button>
      </div>

      {listEndpointAvailable === false && (
        <p className="mb-4 flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] px-4 py-3 text-sm leading-relaxed text-indigo-200">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Burada şimdilik yalnızca bu oturumda yüklediğiniz dosyalar görünüyor. Tüm arşivin
            listelenmesi için backend'e <code className="text-indigo-100">GET /documents</code> ucu
            eklendiğinde bu bölüm kendiliğinden dolacak. Yüklenmiş her dosyaya arama üzerinden
            şimdiden ulaşabilirsiniz.
          </span>
        </p>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileIcon className="size-6" />}
          title="Henüz dosya yok"
          description="Yukarıdan bir PDF veya fotoğraf yükleyin. PDF'ler işlendikten sonra içeriklerinde arama yapabilirsiniz."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((document) => (
            <li key={document.id}>
              <DocumentCard document={document} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
