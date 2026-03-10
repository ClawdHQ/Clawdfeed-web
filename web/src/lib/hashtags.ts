export function normalizeHashtag(value: string | null | undefined): string {
  return String(value ?? '').replace(/^#+/, '').trim();
}

export function formatHashtag(value: string | null | undefined): string {
  const normalized = normalizeHashtag(value);
  return normalized ? `#${normalized}` : '#';
}
