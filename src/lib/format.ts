export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** "Matematik_Notlari.pdf" -> "PDF" / "PNG" gibi kısa bir tür etiketi. */
export function fileKindLabel(mimeType: string | undefined, title: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType?.startsWith("image/")) return mimeType.slice(6).toUpperCase();
  const extension = title.includes(".") ? title.split(".").pop() : undefined;
  return extension ? extension.toUpperCase() : "DOSYA";
}
