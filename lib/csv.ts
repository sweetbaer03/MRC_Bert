/** RFC 4180 CSV. 엑셀 한글 깨짐 방지를 위해 UTF-8 BOM을 붙이고, 수식 주입을 막습니다. */
export function toCsv(rows: (string | number | null | undefined)[][]) {
  const body = rows.map((row) => row.map(cell).join(",")).join("\r\n");
  return `﻿${body}\r\n`;
}

function cell(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
