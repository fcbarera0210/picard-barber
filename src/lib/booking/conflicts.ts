import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { db } from '../db';
import {
  availabilityBlocks,
  bookingBlocks,
  bookings,
  business,
  clients,
  services,
} from '../db/schema';
import { getActiveBusiness } from '../business';
import { endOfDay, getDateRange, parseLocalDateTime, startOfDay } from '../datetime';
import { isValidChilePhone, isValidEmail, normalizeEmail, normalizePhone } from '../phone';
import { computeAvailableSlots, isSlotAvailable, type SlotContext } from './slots';

export async function buildSlotContext(
  businessId: string,
  date: string,
  serviceId: string,
): Promise<SlotContext | null> {
  const [biz, service] = await Promise.all([
    db.select().from(business).where(eq(business.id, businessId)).limit(1),
    db.select().from(services).where(eq(services.id, serviceId)).limit(1),
  ]);

  if (!biz[0] || !service[0] || !service[0].active) return null;

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [avail, blocks, existing] = await Promise.all([
    db
      .select()
      .from(availabilityBlocks)
      .where(eq(availabilityBlocks.businessId, businessId)),
    db
      .select()
      .from(bookingBlocks)
      .where(
        and(
          eq(bookingBlocks.businessId, businessId),
          lte(bookingBlocks.startAt, dayEnd),
          gte(bookingBlocks.endAt, dayStart),
        ),
      ),
    db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, businessId),
          gte(bookings.startAt, dayStart),
          lte(bookings.startAt, dayEnd),
          ne(bookings.status, 'cancelled'),
        ),
      ),
  ]);

  return {
    date,
    serviceDurationMin: service[0].durationMin,
    minAdvanceHours: biz[0].minAdvanceHours,
    maxAdvanceDays: biz[0].maxAdvanceDays,
    availabilityBlocks: avail.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      active: a.active,
    })),
    bookingBlocks: blocks.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
    existingBookings: existing.map((b) => ({
      startAt: b.startAt,
      endAt: b.endAt,
      status: b.status,
    })),
  };
}

export async function getAvailableBookingDates(
  businessId: string,
  serviceId: string,
): Promise<string[]> {
  const [bizRows, serviceRows] = await Promise.all([
    db.select().from(business).where(eq(business.id, businessId)).limit(1),
    db.select().from(services).where(eq(services.id, serviceId)).limit(1),
  ]);

  const biz = bizRows[0];
  const service = serviceRows[0];
  if (!biz || !service?.active) return [];

  const dates = getDateRange(biz.maxAdvanceDays);
  if (dates.length === 0) return [];

  const rangeStart = startOfDay(dates[0]);
  const rangeEnd = endOfDay(dates[dates.length - 1]);

  const [avail, blocks, existing] = await Promise.all([
    db
      .select()
      .from(availabilityBlocks)
      .where(eq(availabilityBlocks.businessId, businessId)),
    db
      .select()
      .from(bookingBlocks)
      .where(
        and(
          eq(bookingBlocks.businessId, businessId),
          lte(bookingBlocks.startAt, rangeEnd),
          gte(bookingBlocks.endAt, rangeStart),
        ),
      ),
    db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, businessId),
          gte(bookings.startAt, rangeStart),
          lte(bookings.startAt, rangeEnd),
          ne(bookings.status, 'cancelled'),
        ),
      ),
  ]);

  const shared = {
    serviceDurationMin: service.durationMin,
    minAdvanceHours: biz.minAdvanceHours,
    maxAdvanceDays: biz.maxAdvanceDays,
    availabilityBlocks: avail.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      active: a.active,
    })),
    bookingBlocks: blocks.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
    existingBookings: existing.map((b) => ({
      startAt: b.startAt,
      endAt: b.endAt,
      status: b.status,
    })),
  };

  return dates.filter((date) => {
    const ctx: SlotContext = { ...shared, date };
    return computeAvailableSlots(ctx).length > 0;
  });
}

export type CreateBookingInput = {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
};

export type CreateBookingResult =
  | { success: true; bookingId: string }
  | { success: false; error: string; status: number };

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const biz = await getActiveBusiness();
  if (!biz) {
    return { success: false, error: 'Negocio no configurado', status: 404 };
  }

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!name || name.length < 2) {
    return { success: false, error: 'Nombre requerido', status: 400 };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Email inválido', status: 400 };
  }
  if (!isValidChilePhone(phone)) {
    return {
      success: false,
      error: 'El teléfono debe tener 9 dígitos y comenzar con 9',
      status: 400,
    };
  }

  const ctx = await buildSlotContext(biz.id, input.date, input.serviceId);
  if (!ctx) {
    return { success: false, error: 'Servicio no encontrado', status: 404 };
  }

  if (!isSlotAvailable(ctx, input.time)) {
    return {
      success: false,
      error: 'El horario seleccionado no está disponible',
      status: 409,
    };
  }

  const startAt = parseLocalDateTime(input.date, input.time);
  const endAt = new Date(startAt.getTime() + ctx.serviceDurationMin * 60_000);

  const conflict = ctx.existingBookings
    .filter((b) => b.status === 'confirmed')
    .some(
      (b) => startAt < b.endAt && endAt > b.startAt,
    );

  if (conflict) {
    return { success: false, error: 'Conflicto de horario. Intenta de nuevo.', status: 409 };
  }

  const existingClient = await db
    .select()
    .from(clients)
    .where(eq(clients.email, email))
    .limit(1);

  let clientId: string;

  if (existingClient[0]) {
    clientId = existingClient[0].id;
    await db
      .update(clients)
      .set({ name, phone, updatedAt: new Date() })
      .where(eq(clients.id, clientId));
  } else {
    const [created] = await db
      .insert(clients)
      .values({ email, name, phone })
      .returning();
    clientId = created.id;
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      businessId: biz.id,
      clientId,
      serviceId: input.serviceId,
      startAt,
      endAt,
      status: 'confirmed',
    })
    .returning();

  return { success: true, bookingId: booking.id };
}
