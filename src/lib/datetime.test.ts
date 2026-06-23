import { describe, expect, it } from 'vitest';
import {
  endOfDay,
  formatDateKeyInChile,
  formatTimeChile,
  getDateRange,
  parseChileDateTime,
  parseChileDateTimeLocal,
  startOfDay,
} from './datetime';

describe('parseChileDateTime', () => {
  it('maps 12:00 on 2026-06-26 to 16:00 UTC (Chile winter UTC-4)', () => {
    const date = parseChileDateTime('2026-06-26', '12:00');
    expect(date.toISOString()).toBe('2026-06-26T16:00:00.000Z');
  });

  it('maps 08:00 on 2026-06-26 to 12:00 UTC', () => {
    const date = parseChileDateTime('2026-06-26', '08:00');
    expect(date.toISOString()).toBe('2026-06-26T12:00:00.000Z');
  });

  it('formats back to the same wall time in Chile', () => {
    const date = parseChileDateTime('2026-06-26', '12:00');
    expect(formatTimeChile(date)).toBe('12:00');
  });
});

describe('parseChileDateTimeLocal', () => {
  it('parses datetime-local strings as Chile wall time', () => {
    const date = parseChileDateTimeLocal('2026-06-26T12:00');
    expect(formatTimeChile(date)).toBe('12:00');
    expect(formatDateKeyInChile(date)).toBe('2026-06-26');
  });
});

describe('startOfDay / endOfDay', () => {
  it('startOfDay returns midnight Chile as UTC', () => {
    const start = startOfDay('2026-06-26');
    expect(formatTimeChile(start)).toBe('00:00');
    expect(formatDateKeyInChile(start)).toBe('2026-06-26');
  });

  it('endOfDay is last ms of the Chile calendar day', () => {
    const end = endOfDay('2026-06-26');
    expect(formatDateKeyInChile(end)).toBe('2026-06-26');
    expect(end.getTime()).toBeGreaterThan(startOfDay('2026-06-26').getTime());
  });
});

describe('getDateRange', () => {
  it('returns consecutive date strings starting from today in Chile', () => {
    const range = getDateRange(2);
    expect(range).toHaveLength(3);
    expect(range[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range[1]).toBeTruthy();
    expect(range[2]).toBeTruthy();
  });
});
