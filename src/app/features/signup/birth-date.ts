export const EARLIEST_BIRTH_DATE = '1900-01-01';

/** Yesterday in local time, as yyyy-MM-dd. */
export function latestBirthDate(now = new Date()): string {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${yesterday.getFullYear()}-${month}-${day}`;
}
