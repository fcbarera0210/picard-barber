import {
  addMinutes,
  formatTime,
  getDayOfWeekFromDate,
  intervalsOverlap,
  parseLocalDateTime,
} from '../datetime';

export type AvailabilityBlock = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type BookingBlock = {
  startAt: Date;
  endAt: Date;
};

export type ExistingBooking = {
  startAt: Date;
  endAt: Date;
  status: string;
};

export type SlotContext = {
  date: string;
  serviceDurationMin: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  availabilityBlocks: AvailabilityBlock[];
  bookingBlocks: BookingBlock[];
  existingBookings: ExistingBooking[];
  now?: Date;
};

function isRangeBlockedByBookingBlock(
  slotStart: Date,
  slotEnd: Date,
  bookingBlocks: BookingBlock[],
): boolean {
  return bookingBlocks.some((block) =>
    intervalsOverlap(slotStart, slotEnd, block.startAt, block.endAt),
  );
}

function isRangeBooked(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: ExistingBooking[],
): boolean {
  return existingBookings
    .filter((b) => b.status === 'confirmed')
    .some((b) => intervalsOverlap(slotStart, slotEnd, b.startAt, b.endAt));
}

function alignToInterval(date: Date, intervalMin: number): Date {
  const aligned = new Date(date);
  const minutes = aligned.getMinutes();
  if (intervalMin >= 30) {
    if (minutes !== 0 && minutes !== 30) {
      if (minutes < 30) {
        aligned.setMinutes(30, 0, 0);
      } else {
        aligned.setHours(aligned.getHours() + 1);
        aligned.setMinutes(0, 0, 0);
      }
    }
  } else if (minutes % intervalMin !== 0) {
    const next = Math.ceil(minutes / intervalMin) * intervalMin;
    if (next >= 60) {
      aligned.setHours(aligned.getHours() + 1);
      aligned.setMinutes(0, 0, 0);
    } else {
      aligned.setMinutes(next, 0, 0);
    }
  }
  return aligned;
}

export function computeAvailableSlots(ctx: SlotContext): string[] {
  const now = ctx.now ?? new Date();
  const dayOfWeek = getDayOfWeekFromDate(ctx.date);
  const dayBlocks = ctx.availabilityBlocks.filter(
    (b) => b.active && b.dayOfWeek === dayOfWeek,
  );

  if (dayBlocks.length === 0) return [];

  const minStart = new Date(now.getTime() + ctx.minAdvanceHours * 60 * 60 * 1000);
  const maxDate = new Date(now);
  maxDate.setHours(23, 59, 59, 999);
  maxDate.setDate(maxDate.getDate() + ctx.maxAdvanceDays);

  const [year, month, day] = ctx.date.split('-').map(Number);
  const selectedDay = new Date(year, month - 1, day, 12, 0, 0);
  if (selectedDay > maxDate) return [];

  const intervalMin = ctx.serviceDurationMin >= 30 ? 30 : 15;
  const slots: string[] = [];

  for (const block of dayBlocks) {
    let cursor = parseLocalDateTime(ctx.date, block.startTime);
    const blockEnd = parseLocalDateTime(ctx.date, block.endTime);

    cursor = alignToInterval(cursor, intervalMin);

    while (cursor < blockEnd) {
      const slotEnd = addMinutes(cursor, ctx.serviceDurationMin);
      if (slotEnd > blockEnd) break;

      if (ctx.serviceDurationMin >= 30) {
        const m = cursor.getMinutes();
        if (m !== 0 && m !== 30) {
          cursor = addMinutes(cursor, intervalMin);
          continue;
        }
      }

      if (cursor >= minStart && cursor <= maxDate) {
        if (
          !isRangeBlockedByBookingBlock(cursor, slotEnd, ctx.bookingBlocks) &&
          !isRangeBooked(cursor, slotEnd, ctx.existingBookings)
        ) {
          const time = formatTime(cursor);
          if (!slots.includes(time)) {
            slots.push(time);
          }
        }
      }

      cursor = addMinutes(cursor, intervalMin);
    }
  }

  return slots.sort();
}

export function isSlotAvailable(
  ctx: SlotContext,
  time: string,
): boolean {
  return computeAvailableSlots(ctx).includes(time);
}
