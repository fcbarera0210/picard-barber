import { describe, expect, it } from 'vitest';
import { computeAvailableSlots, type SlotContext } from './slots';

function baseCtx(overrides: Partial<SlotContext> = {}): SlotContext {
  return {
    date: '2026-06-20',
    serviceDurationMin: 30,
    minAdvanceHours: 2,
    maxAdvanceDays: 7,
    availabilityBlocks: [
      { dayOfWeek: 'SABADO', startTime: '10:00', endTime: '14:00', active: true },
    ],
    bookingBlocks: [],
    existingBookings: [],
    now: new Date('2026-06-18T08:00:00'),
    ...overrides,
  };
}

describe('computeAvailableSlots', () => {
  it('returns empty when no availability for day', () => {
    const slots = computeAvailableSlots(
      baseCtx({
        date: '2026-06-15',
        availabilityBlocks: [
          { dayOfWeek: 'LUNES', startTime: '09:00', endTime: '12:00', active: true },
        ],
      }),
    );
    expect(slots).toEqual([]);
  });

  it('generates 30-min slots on saturday', () => {
    const slots = computeAvailableSlots(baseCtx());
    expect(slots).toContain('10:00');
    expect(slots).toContain('10:30');
    expect(slots).toContain('13:00');
    expect(slots).toContain('13:30');
  });

  it('excludes booked slots', () => {
    const start = new Date('2026-06-20T10:00:00');
    const end = new Date('2026-06-20T10:30:00');
    const slots = computeAvailableSlots(
      baseCtx({
        existingBookings: [{ startAt: start, endAt: end, status: 'confirmed' }],
      }),
    );
    expect(slots).not.toContain('10:00');
    expect(slots).toContain('10:30');
  });

  it('ignores cancelled bookings', () => {
    const start = new Date('2026-06-20T10:00:00');
    const end = new Date('2026-06-20T10:30:00');
    const slots = computeAvailableSlots(
      baseCtx({
        existingBookings: [{ startAt: start, endAt: end, status: 'cancelled' }],
      }),
    );
    expect(slots).toContain('10:00');
  });

  it('respects min advance hours', () => {
    const slots = computeAvailableSlots(
      baseCtx({
        now: new Date('2026-06-20T09:30:00'),
      }),
    );
    expect(slots).not.toContain('10:00');
    expect(slots).toContain('12:00');
  });

  it('respects max advance days', () => {
    const slots = computeAvailableSlots(
      baseCtx({
        date: '2026-06-30',
        now: new Date('2026-06-18T08:00:00'),
        maxAdvanceDays: 7,
      }),
    );
    expect(slots).toEqual([]);
  });

  it('excludes booking blocks', () => {
    const slots = computeAvailableSlots(
      baseCtx({
        bookingBlocks: [
          {
            startAt: new Date('2026-06-20T10:00:00'),
            endAt: new Date('2026-06-20T11:00:00'),
          },
        ],
      }),
    );
    expect(slots).not.toContain('10:00');
    expect(slots).not.toContain('10:30');
    expect(slots).toContain('11:00');
  });
});
