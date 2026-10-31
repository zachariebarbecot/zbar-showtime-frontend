import { FormControl } from '@angular/forms';
import { latestBirthDate, validBirthDate } from './birth-date';

describe('latestBirthDate', () => {
  it('should be yesterday in local time', () => {
    expect(latestBirthDate(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-30');
  });

  it('should cross month and year boundaries', () => {
    expect(latestBirthDate(new Date(2026, 2, 1))).toBe('2026-02-28');
    expect(latestBirthDate(new Date(2026, 0, 1))).toBe('2025-12-31');
  });
});

describe('validBirthDate', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 31, 23, 30));
  });
  afterEach(() => vi.useRealTimers());

  it.each(['1900-01-01', '1999-12-31', '2026-10-30'])('should accept %s', (value) => {
    expect(validBirthDate(new FormControl(value))).toBeNull();
  });

  it.each(['', '1899-12-31', '2026-10-31', '2026-11-01', '20000-01-01', 'not a date'])(
    'should refuse "%s"',
    (value) => {
      expect(validBirthDate(new FormControl(value))).toEqual({ birthDate: true });
    },
  );
});
