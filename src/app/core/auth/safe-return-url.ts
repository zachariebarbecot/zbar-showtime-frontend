const DEFAULT_URL = '/accueil';

export function safeReturnUrl(value: string | null): string {
  const isInternalPath = value !== null && value.startsWith('/') && !value.startsWith('//');
  return isInternalPath && !value.includes('\\') ? value : DEFAULT_URL;
}
