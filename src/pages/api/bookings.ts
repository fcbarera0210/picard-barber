import type { APIRoute } from 'astro';
import { and, desc, eq, gte, lte, ne } from 'drizzle-orm';
import { requireAdmin } from '../../lib/admin-auth';
import { getActiveBusiness } from '../../lib/business';
import { createBooking } from '../../lib/booking/conflicts';
import { db } from '../../lib/db';
import { bookings, clients, services } from '../../lib/db/schema';
import { endOfDay, startOfDay } from '../../lib/datetime';
import { normalizeEmail } from '../../lib/phone';
import { checkRateLimit } from '../../lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Demasiados intentos. Espera un momento.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: {
    serviceId?: string;
    date?: string;
    time?: string;
    name?: string;
    email?: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!body.serviceId || !body.date || !body.time || !body.name || !body.email || !body.phone) {
    return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), {
      status: 400,
    });
  }

  const result = await createBooking({
    serviceId: body.serviceId,
    date: body.date,
    time: body.time,
    name: body.name,
    email: body.email,
    phone: body.phone,
  });

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, bookingId: result.bookingId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async (context) => {
  const authError = await requireAdmin(context);
  if (authError) return authError;

  const { url } = context;
  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }

  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let conditions = [eq(bookings.businessId, biz.id)];

  if (date) {
    conditions.push(gte(bookings.startAt, startOfDay(date)));
    conditions.push(lte(bookings.startAt, endOfDay(date)));
  } else if (from && to) {
    conditions.push(gte(bookings.startAt, new Date(from)));
    conditions.push(lte(bookings.startAt, new Date(to)));
  }

  const rows = await db
    .select({
      id: bookings.id,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      status: bookings.status,
      cancelledAt: bookings.cancelledAt,
      clientName: clients.name,
      clientEmail: clients.email,
      clientPhone: clients.phone,
      serviceName: services.name,
      serviceId: services.id,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(...conditions))
    .orderBy(bookings.startAt);

  return new Response(JSON.stringify({ bookings: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async (context) => {
  const authError = await requireAdmin(context);
  if (authError) return authError;

  const { request } = context;
  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!body.id || body.status !== 'cancelled') {
    return new Response(JSON.stringify({ error: 'Solo se permite cancelar citas' }), { status: 400 });
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, body.id), ne(bookings.status, 'cancelled')))
    .returning();

  if (!updated) {
    return new Response(JSON.stringify({ error: 'Cita no encontrada' }), { status: 404 });
  }

  return new Response(JSON.stringify({ booking: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
