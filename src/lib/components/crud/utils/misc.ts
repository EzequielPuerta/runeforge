export function fieldLabel(field: { attribute: string; title?: string }): string {
  return (field.title ?? field.attribute).replace(/_/g, ' ');
}

export function initials(firstName?: string, lastName?: string): string {
  const a = (firstName ?? '').trim().charAt(0);
  const b = (lastName ?? '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}
