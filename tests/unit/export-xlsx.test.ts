import { describe, it, expect, vi } from 'vitest';
import { downloadXlsx } from '$lib/components/table/export.js';
import type { XlsxModule } from '$lib/index.js';
import type { ColumnDefinition } from '$lib/types/crud/columns.js';

// The signatures SheetJS 0.20 declares (xlsx/types/index.d.ts), trimmed to what runeforge calls.
interface WorkSheet {
	'!ref'?: string;
}
interface WorkBook {
	SheetNames: string[];
	Sheets: Record<string, WorkSheet>;
}
interface SheetJSUtils {
	aoa_to_sheet<T>(data: T[][], opts?: object): WorkSheet;
	aoa_to_sheet(data: unknown[][], opts?: object): WorkSheet;
	book_new(ws?: WorkSheet, wsname?: string): WorkBook;
	book_append_sheet(
		workbook: WorkBook,
		worksheet: WorkSheet,
		name?: string,
		roll?: boolean
	): string;
}
interface SheetJSModule {
	utils: SheetJSUtils;
	writeFile(data: WorkBook, filename: string, opts?: object): void;
}

function fakeSheetJS() {
	const workbook: WorkBook = { SheetNames: [], Sheets: {} };
	const sheetjs = {
		utils: {
			aoa_to_sheet: vi.fn(() => ({ '!ref': 'A1' })),
			book_new: vi.fn(() => workbook),
			book_append_sheet: vi.fn(() => 'Sheet1')
		},
		writeFile: vi.fn()
	} as unknown as SheetJSModule;
	return { sheetjs, workbook };
}

describe('downloadXlsx', () => {
	it('accepts the SheetJS module as is, without a cast', () => {
		const { sheetjs } = fakeSheetJS();
		// Fails to compile if XlsxModule stops matching SheetJS's own types.
		const xlsx: XlsxModule = sheetjs;
		expect(xlsx).toBe(sheetjs);
	});

	it('builds one sheet with the headers and rows, and writes it to <filename>.xlsx', () => {
		const { sheetjs, workbook } = fakeSheetJS();
		type Row = { name: string };
		const columns = [{ attribute: 'name', title: 'Name' }] as ColumnDefinition<Row>[];

		downloadXlsx([{ name: 'Alice' }], columns, 'people', sheetjs);

		expect(sheetjs.utils.aoa_to_sheet).toHaveBeenCalledWith([['Name'], ['Alice']]);
		expect(sheetjs.utils.book_append_sheet).toHaveBeenCalledWith(workbook, { '!ref': 'A1' });
		expect(sheetjs.writeFile).toHaveBeenCalledWith(workbook, 'people.xlsx');
	});
});
