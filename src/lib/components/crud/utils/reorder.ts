/** Given the full row list in its new (post-drag) order, returns copies of
 * only the rows whose `attribute` no longer matches their new sequential
 * (0-based) position — the minimal set worth persisting. */
export function computeReorderChanges<T extends object>(
  rows: T[],
  attribute: keyof T & string,
): T[] {
  const changed: T[] = [];
  rows.forEach((row, index) => {
    const current = Number((row as Record<string, unknown>)[attribute]);
    if (current !== index) {
      changed.push({ ...row, [attribute]: index });
    }
  });
  return changed;
}
