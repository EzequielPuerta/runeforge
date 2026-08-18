export const formatBoolean =
	(trueLabel = 'Sí', falseLabel = 'No') =>
	() =>
	(value: boolean): string =>
		value ? trueLabel : falseLabel;

// Supported tokens: dd · mm · YYYY · HH · MM · ss
const TOKENS: Record<string, (d: Date) => string> = {
	dd: (d) => String(d.getDate()).padStart(2, '0'),
	mm: (d) => String(d.getMonth() + 1).padStart(2, '0'),
	YYYY: (d) => String(d.getFullYear()),
	HH: (d) => String(d.getHours()).padStart(2, '0'),
	MM: (d) => String(d.getMinutes()).padStart(2, '0'),
	ss: (d) => String(d.getSeconds()).padStart(2, '0')
};

export const formatDatetime = (format = 'dd/mm/YYYY HH:MM'): (() => (value: Date) => string) => {
	const fmt = (value: Date): string => {
		// `null`/`undefined`/`''` (an unset field) must render blank, not epoch 0
		// — `new Date(null)` is 1970-01-01, a "valid" Date whose getTime() isn't
		// NaN, so it would otherwise slip past the invalid-date check below.
		if (value === null || value === undefined || (value as unknown) === '') return '';
		const d = new Date(value);
		if (isNaN(d.getTime())) return '';
		return format.replace(/dd|mm|YYYY|HH|MM|ss/g, (token) => TOKENS[token](d));
	};
	return () => fmt;
};

export function formatTruncateTextUpTo(maxLength: number): () => (value: string) => string {
	return () => (value: string) => {
		const str = String(value ?? '');
		return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
	};
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function formatInstance<T extends Record<string, unknown>>(
	attribute: keyof T & string,
	instances: T[],
	urlPath: string,
	idKey: keyof T & string = '_id' as keyof T & string
): (value: unknown) => string {
	const map = new Map(instances.map((i) => [String(i[idKey] ?? ''), i]));
	return (value) => {
		const id = String(value ?? '');
		const instance = map.get(id);
		const label = instance ? String(instance[attribute] ?? id) : id;
		const href = `${urlPath}?id=${encodeURIComponent(id)}`;
		return `<a href="${href}" class="link link-primary">${escapeHtml(label)}</a>`;
	};
}
