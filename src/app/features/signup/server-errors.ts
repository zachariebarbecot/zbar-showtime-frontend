/** Names of the fields the server rejected in a 400 body `{ errors: [{ field, message }] }`. */
export function rejectedFields(body: unknown): string[] {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('errors' in body) ||
    !Array.isArray(body.errors)
  ) {
    return [];
  }
  return body.errors.flatMap((entry: unknown) =>
    typeof entry === 'object' &&
    entry !== null &&
    'field' in entry &&
    typeof entry.field === 'string'
      ? [entry.field]
      : [],
  );
}
