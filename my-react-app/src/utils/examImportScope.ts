import type { CodeLabelOption } from '../types';

export function scopeShowsField(
  scope: CodeLabelOption | undefined,
  field: string
): boolean {
  return scope?.fields?.includes(field) ?? false;
}

export function examScopeLabel(
  scopes: CodeLabelOption[] | undefined,
  id: string | undefined
): string | undefined {
  if (!id) return undefined;
  return scopes?.find((s) => s.id === id)?.label ?? id;
}

export function organizerTypeLabel(
  types: CodeLabelOption[] | undefined,
  id: string | undefined
): string | undefined {
  if (!id) return undefined;
  return types?.find((t) => t.id === id)?.label ?? id;
}
