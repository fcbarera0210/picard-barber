import {
  addMinutes,
  addDaysToDateStr,
  endOfDay,
  formatTimeChile,
  getChileTimeParts,
  getDayOfWeekFromDate,
  intervalsOverlap,
  parseChileDateTime,
  formatDateKeyInChile,
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

function alignToInterval(date: Date, intervalMin: number, dateStr: string): Date {
  const { hours, minutes } = getChileTimeParts(date);
  let h = hours;
  let m = minutes;

  if (intervalMin >= 30) {
    if (m !== 0 && m !== 30) {
      if (m < 30) {
        m = 30;
      } else {
        h += 1;
        m = 0;
      }
    }
  } else if (m % intervalMin !== 0) {
    const next = Math.ceil(m / intervalMin) * intervalMin;
    if (next >= 60) {
      h += 1;
      m = 0;
    } else {
      m = next;
    }
  }

  return parseChileDateTime(
    dateStr,
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  );
}

export function computeAvailableSlots(ctx: SlotContext): string[] {
  const now = ctx.now ?? new Date();
  const dayOfWeek = getDayOfWeekFromDate(ctx.date);
  const dayBlocks = ctx.availabilityBlocks.filter(
    (b) => b.active && b.dayOfWeek === dayOfWeek,
  );

  if (dayBlocks.length === 0) return [];

  const minStart = new Date(now.getTime() + ctx.minAdvanceHours * 60 * 60 * 1000);
  const todayKey = formatDateKeyInChile(now);
  const maxDayKey = addDaysToDateStr(todayKey, ctx.maxAdvanceDays);
  const maxInstant = endOfDay(maxDayKey);

  if (startOfDayCheck(ctx.date) > maxInstant.getTime()) return [];

  const intervalMin = ctx.serviceDurationMin >= 30 ? 30 : 15;
  const slots: string[] = [];

  for (const block of dayBlocks) {
    let cursor = parseChileDateTime(ctx.date, block.startTime);
    const blockEnd = parseChileDateTime(ctx.date, block.endTime);

    cursor = alignToInterval(cursor, intervalMin, ctx.date);

    while (cursor < blockEnd) {
      const slotEnd = addMinutes(cursor, ctx.serviceDurationMin);
      if (slotEnd > blockEnd) break;

      if (ctx.serviceDurationMin >= 30) {
        const { minutes } = getChileTimeParts(cursor);
        if (minutes !== 0 && minutes !== 30) {
          cursor = addMinutes(cursor, intervalMin);
          continue;
        }
      }

      if (cursor >= minStart && cursor <= maxInstant) {
        if (
          !isRangeBlockedByBookingBlock(cursor, slotEnd, ctx.bookingBlocks) &&
          !isRangeBooked(cursor, slotEnd, ctx.existingBookings)
        ) {
          const time = formatTimeChile(cursor);
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

function startOfDayCheck(dateStr: string): number {
  return parseChileDateTime(dateStr, '00:00').getTime();
}

export function isSlotAvailable(
  ctx: SlotContext,
  time: string,
): boolean {
  return computeAvailableSlots(ctx).includes(time);
}
