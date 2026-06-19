import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getActiveBusiness } from '../../lib/business';
import { buildSlotContext, getAvailableBookingDates } from '../../lib/booking/conflicts';
import { computeAvailableSlots } from '../../lib/booking/slots';
import { checkRateLimit } from '../../lib/rate-limit';

export const prerender = false;

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Demasiados intentos. Espera un momento.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const date = url.searchParams.get('date');
  const serviceId = url.searchParams.get('serviceId');

  if (!serviceId) {
    return new Response(JSON.stringify({ error: 'serviceId requerido' }), { status: 400 });
  }

  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }

  if (!date) {
    const dates = await getAvailableBookingDates(biz.id, serviceId);
    return new Response(
      JSON.stringify({ serviceId, dates, maxAdvanceDays: biz.maxAdvanceDays }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  const ctx = await buildSlotContext(biz.id, date, serviceId);
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'Servicio no encontrado' }), { status: 404 });
  }

  const slots = computeAvailableSlots(ctx);

  return new Response(
    JSON.stringify({ date, serviceId, slots, maxAdvanceDays: biz.maxAdvanceDays }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
