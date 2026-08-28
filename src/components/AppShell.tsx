import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  deleteDocument,
  isProcessing,
  listDocuments,
  searchDocuments,
  type UniDocument,
} from "../lib/api";
import { SEARCH_DEBOUNCE_MS, STATUS_POLL_MS } from "../lib/constants";
import { useAuth, type Session } from "../lib/auth";
import { DocumentGrid } from "./DocumentGrid";
import { LogoMark, LogoutIcon } from "./icons";
import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";
import { ToastStack, useToasts, type ToastKind } from "./Toast";
import { UploadDropzone } from "./UploadDropzone";

/** En yeni dosya üstte; createdAt yoksa mevcut sıra korunur. */
function sortByNewest(documents: UniDocument[]): UniDocument[] {
  return [...documents].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function AppShell({ session }: { session: Session }) {
  const { token, user } = session;
  const { signOut } = useAuth();
  const { toasts, push, dismiss } = useToasts();

  const [documents, setDocuments] = useState<UniDocument[]>([]);
  /** null: henüz denenmedi · false: GET /documents backend'de yok · true: uç çalışıyor */
  const [listEndpointAvailable, setListEndpointAvailable] = useState<boolean | null>(null);
  const [listLoading, setListLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UniDocument[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const notify = useCallback(
    (kind: ToastKind, message: string) => push(kind, message),
    [push],
  );

  const loadDocuments = useCallback(
    async (silent = false) => {
      if (!silent) setListLoading(true);
      try {
        const fetched = await listDocuments(token);
        if (fetched === null) {
          // Uç henüz yayında değil: bu oturumda yüklenenler ekranda kalsın.
          setListEndpointAvailable(false);
        } else {
          setListEndpointAvailable(true);
          setDocuments(sortByNewest(fetched));
        }
      } catch (caught) {
        if (caught instanceof ApiError && caught.status !== 401 && !silent) {
          notify("error", caught.message);
        }
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [notify, token],
  );

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Metin çıkarma süren dosya varsa (PENDING veya PROCESSING) listeyi tazele.
  const hasProcessing = useMemo(
    () => documents.some((document) => isProcessing(document.status)),
    [documents],
  );

  useEffect(() => {
    if (listEndpointAvailable !== true || !hasProcessing) return;
    const timer = window.setInterval(() => void loadDocuments(true), STATUS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [hasProcessing, listEndpointAvailable, loadDocuments]);

  const handleUploaded = useCallback((uploaded: UniDocument) => {
    setDocuments((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
  }, []);

  const handleDelete = useCallback(
    async (target: UniDocument) => {
      try {
        await deleteDocument(target.id, token);
        setDocuments((current) => current.filter((item) => item.id !== target.id));
        setResults((current) => current.filter((item) => item.id !== target.id));
        notify("success", `“${target.title}” silindi.`);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 404) {
          // Başka biri silmiş: listeden düşür, hata gibi gösterme.
          setDocuments((current) => current.filter((item) => item.id !== target.id));
          setResults((current) => current.filter((item) => item.id !== target.id));
          notify("info", caught.message);
          return;
        }
        if (caught instanceof ApiError && caught.status !== 401) {
          notify("error", caught.message);
        }
      }
    },
    [notify, token],
  );

  // Arama: debounce + eski yanıtları yoksayma.
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const found = await searchDocuments(trimmedQuery, token);
        if (cancelled) return;
        setResults(found);
        setSearchError(null);
      } catch (caught) {
        if (cancelled) return;
        setResults([]);
        setSearchError(
          caught instanceof ApiError ? caught.message : "Arama sırasında bir hata oluştu.",
        );
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token, trimmedQuery]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="text-base font-semibold tracking-tight text-white">UniNotes</span>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              title={`${user.email} — çıkış yap`}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200 sm:hidden"
            >
              <LogoutIcon className="size-4" />
              Çıkış
            </button>
          </div>

          <div className="sm:mx-auto sm:max-w-md sm:flex-1">
            <SearchBar value={query} onChange={setQuery} loading={searching} />
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="max-w-40 truncate text-sm text-slate-400" title={user.email}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex size-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              aria-label="Çıkış yap"
              title="Çıkış yap"
            >
              <LogoutIcon className="size-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:py-8">
        <UploadDropzone token={token} onUploaded={handleUploaded} notify={notify} />

        {trimmedQuery ? (
          <SearchResults
            query={trimmedQuery}
            results={results}
            loading={searching}
            error={searchError}
            onDelete={handleDelete}
          />
        ) : (
          <DocumentGrid
            documents={documents}
            listEndpointAvailable={listEndpointAvailable}
            loading={listLoading}
            onRefresh={() => void loadDocuments()}
            onDelete={handleDelete}
          />
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
