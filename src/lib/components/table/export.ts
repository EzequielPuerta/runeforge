import type { ColumnDefinition } from '$lib/types/crud.js';
import { cellRenderedText } from '$lib/components/table/utils.js';

/**
 * Minimal duck-typed subset of the SheetJS (`xlsx`) module API used for
 * building a workbook. Runeforge never imports `xlsx` itself — the consumer
 * installs it and passes the resolved module in, so the dependency stays
 * fully optional and never affects consumers who don't use Excel export.
 */
export interface XlsxModule {
  utils: {
    aoa_to_sheet: (data: unknown[][]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (workbook: unknown, worksheet: unknown, name?: string) => void;
  };
  writeFile: (workbook: unknown, filename: string) => void;
}

function buildTable<T extends object>(
  rows: T[],
  columns: ColumnDefinition<T>[],
): { headers: string[]; body: string[][] } {
  const headers = columns.map((col) => col.title ?? col.attribute);
  const body = rows.map((row) => columns.map((col) => cellRenderedText(row, col)));
  return { headers, body };
}

function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv<T extends object>(
  rows: T[],
  columns: ColumnDefinition<T>[],
  filename: string,
): void {
  const { headers, body } = buildTable(rows, columns);
  const csv = [headers, ...body]
    .map((line) => line.map(escapeCsvCell).join(','))
    .join('\r\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function downloadXlsx<T extends object>(
  rows: T[],
  columns: ColumnDefinition<T>[],
  filename: string,
  xlsx: XlsxModule,
): void {
  const { headers, body } = buildTable(rows, columns);
  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...body]);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet);
  xlsx.writeFile(workbook, `${filename}.xlsx`);
}
