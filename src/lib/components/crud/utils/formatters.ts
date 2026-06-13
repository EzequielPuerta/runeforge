export const formatBoolean = (trueLabel = 'Sí', falseLabel = 'No') =>
  () => (value: boolean): string => (value ? trueLabel : falseLabel);

// Supported tokens: dd · mm · YYYY · HH · MM · ss
const TOKENS: Record<string, (d: Date) => string> = {
  dd: (d) => String(d.getDate()).padStart(2, '0'),
  mm: (d) => String(d.getMonth() + 1).padStart(2, '0'),
  YYYY: (d) => String(d.getFullYear()),
  HH: (d) => String(d.getHours()).padStart(2, '0'),
  MM: (d) => String(d.getMinutes()).padStart(2, '0'),
  ss: (d) => String(d.getSeconds()).padStart(2, '0'),
};

export const formatDatetime = (format = 'dd/mm/YYYY HH:MM'): () => (value: Date) => string => {
  const fmt = (value: Date): string => {
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

export function formatInstance<T extends { _id: string }>(
  attribute: keyof T & string,
  instances: T[],
  urlPath: string
): (value: unknown) => string {
  const map = new Map(instances.map((i) => [i._id, i]));
  return (value) => {
    const id = String(value ?? '');
    const instance = map.get(id);
    const label = instance ? String(instance[attribute] ?? id) : id;
    const href = `${urlPath}?id=${encodeURIComponent(id)}`;
    return `<a href="${href}" class="link link-primary">${escapeHtml(label)}</a>`;
  };
}
