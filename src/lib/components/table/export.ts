import type { ColumnDefinition, FieldDefinition } from '$lib/types/crud.js';
import { cellRenderedText } from '$lib/components/table/utils.js';
import { formatEmbeddedFieldValue } from '$lib/components/crud/utils/embedded.js';

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

function isEmbeddedColumn<T extends object>(
  col: ColumnDefinition<T>,
): col is ColumnDefinition<T> & { fields: FieldDefinition[] } {
  return col.type === 'embedded' && !!col.fields?.length;
}

// Embedded columns hold one array of sub-records per row — there's no single
// plain-text cell for that, so export (unlike the on-screen table, which
// shows a joined summary) expands each one into its own row per item and one
// sub-column per field, duplicating the row's other column values across
// them. Rows are aligned by index across embedded columns rather than
// cross-joined, since unrelated embedded lists on the same row (e.g. two
// independent one-to-many relations) have no meaningful pairing.
export function buildTable<T extends object>(
  rows: T[],
  columns: ColumnDefinition<T>[],
): { headers: string[]; body: string[][] } {
  const embeddedColumns = columns.filter(isEmbeddedColumn);

  if (embeddedColumns.length === 0) {
    const headers = columns.map((col) => col.title ?? col.attribute);
    const body = rows.map((row) => columns.map((col) => cellRenderedText(row, col)));
    return { headers, body };
  }

  const headers = columns.flatMap((col) =>
    isEmbeddedColumn(col)
      ? col.fields.map((f) => `${col.title ?? col.attribute} - ${f.title ?? f.attribute}`)
      : [col.title ?? col.attribute],
  );

  const body: string[][] = [];
  for (const row of rows) {
    const itemCount = Math.max(
      1,
      ...embeddedColumns.map(
        (col) => ((row as Record<string, unknown>)[col.attribute] as unknown[] | undefined)?.length ?? 0,
      ),
    );
    for (let i = 0; i < itemCount; i++) {
      const line = columns.flatMap((col) => {
        if (!isEmbeddedColumn(col)) return [cellRenderedText(row, col)];
        const items =
          ((row as Record<string, unknown>)[col.attribute] as Record<string, unknown>[] | undefined) ?? [];
        const item = items[i];
        return col.fields.map((f) => (item ? formatEmbeddedFieldValue(f, item[f.attribute]) : ''));
      });
      body.push(line);
    }
  }
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
