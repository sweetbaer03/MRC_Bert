export function formatDate(d: Date | null | undefined) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(d);
}

export function formatDateTime(d: Date | null | undefined) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(d);
}

/** <input type="date"> 값(yyyy-mm-dd)으로 변환 */
export function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatPercent(rate: number | null) {
  return rate === null ? "-" : `${Math.round(rate * 100)}%`;
}
