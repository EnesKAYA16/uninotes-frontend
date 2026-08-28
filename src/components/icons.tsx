interface IconProps {
  className?: string;
}

/** Ortak SVG iskeleti — tüm ikonlar 24x24 kutuda, çizgi stilinde. */
function Stroke({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </Stroke>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Stroke>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Stroke>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </Stroke>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17" />
      <path d="m14 15 1.6-1.6a2 2 0 0 1 2.8 0L20 15" />
    </Stroke>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17 5 12l5-5" />
      <path d="M5 12h11" />
    </Stroke>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M20 11a8 8 0 0 0-13.7-5.3L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 13.7 5.3L20 16" />
      <path d="M20 20v-4h-4" />
    </Stroke>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </Stroke>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Stroke>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Stroke>
  );
}

export function LogoMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" className="fill-indigo-500" />
      <path
        d="M9 8h9l5 5v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
        className="fill-white/95"
      />
      <path d="M18 8v5h5" className="fill-indigo-200" />
      <path
        d="M11 17h10M11 20.5h7"
        className="stroke-indigo-600"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
