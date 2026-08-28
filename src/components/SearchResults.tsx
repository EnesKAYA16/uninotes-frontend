import type { UniDocument } from "../lib/api";
import { DocumentCard } from "./DocumentCard";
import { EmptyState } from "./EmptyState";
import { SearchIcon } from "./icons";
import { Spinner } from "./Spinner";

interface SearchResultsProps {
  query: string;
  results: UniDocument[];
  loading: boolean;
  error: string | null;
  onDelete: (document: UniDocument) => Promise<void>;
}

export function SearchResults({
  query,
  results,
  loading,
  error,
  onDelete,
}: SearchResultsProps) {
  return (
    <section aria-labelledby="arama-baslik" aria-busy={loading}>
      <h2 id="arama-baslik" className="mb-4 text-sm font-semibold tracking-wide text-slate-300">
        “{query}” için sonuçlar
        {!loading && !error && <span className="ml-2 text-slate-500">{results.length}</span>}
      </h2>

      {error ? (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : loading && results.length === 0 ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-sm text-slate-400">
          <Spinner className="size-4" />
          Aranıyor…
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="size-6" />}
          title="Sonuç bulunamadı"
          description="Farklı bir kelime deneyin. Yeni yüklenen PDF'ler metin çıkarma işlemi bittikten sonra aramada görünür."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((document) => (
            <li key={document.id}>
              <DocumentCard document={document} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
