import { CloseIcon, SearchIcon } from "./icons";
import { Spinner } from "./Spinner";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export function SearchBar({ value, onChange, loading }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
        <SearchIcon className="size-4.5" />
      </span>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Notlarınızın içinde arayın…"
        aria-label="Notlarınızın içinde arayın"
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-11 pl-11 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-indigo-400/50 focus:bg-white/[0.07] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />

      <span className="absolute inset-y-0 right-2 flex items-center">
        {loading ? (
          <Spinner className="mr-1.5 size-4 text-slate-400" />
        ) : (
          value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              aria-label="Aramayı temizle"
            >
              <CloseIcon className="size-4" />
            </button>
          )
        )}
      </span>
    </div>
  );
}
