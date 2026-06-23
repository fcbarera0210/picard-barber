import type { APIRoute } from 'astro';
import { asc, eq } from 'drizzle-orm';
import { requireAdmin } from '../../lib/admin-auth';
import { isBarberIcon } from '../../lib/barber-icons';
import { getActiveBusiness } from '../../lib/business';
import { db } from '../../lib/db';
import { services } from '../../lib/db/schema';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { url } = context;
  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }

  const admin = url.searchParams.get('admin') === '1';
  if (admin) {
    const authError = await requireAdmin(context);
    if (authError) return authError;
  }
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.businessId, biz.id))
    .orderBy(asc(services.sortOrder));

  const filtered = admin ? rows : rows.filter((s) => s.active);

  return new Response(JSON.stringify({ services: filtered }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async (context) => {
  const authError = await requireAdmin(context);
  if (authError) return authError;

  const { request } = context;
  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }

  let body: {
    name?: string;
    description?: string;
    durationMin?: number;
    priceCents?: number;
    active?: boolean;
    sortOrder?: number;
    icon?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!body.name?.trim() || !body.durationMin || body.durationMin < 5) {
    return new Response(JSON.stringify({ error: 'Nombre y duración requeridos' }), { status: 400 });
  }

  if (body.icon !== undefined && body.icon !== null && !isBarberIcon(body.icon)) {
    return new Response(JSON.stringify({ error: 'Icono inválido' }), { status: 400 });
  }

  const [created] = await db
    .insert(services)
    .values({
      businessId: biz.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      durationMin: body.durationMin,
      priceCents: body.priceCents ?? 0,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
      icon: body.icon && isBarberIcon(body.icon) ? body.icon : null,
    })
    .returning();

  return new Response(JSON.stringify({ service: created }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async (context) => {
  const authError = await requireAdmin(context);
  if (authError) return authError;

  const { request } = context;
  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }

  let body: {
    id?: string;
    name?: string;
    description?: string;
    durationMin?: number;
    priceCents?: number;
    active?: boolean;
    sortOrder?: number;
    icon?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!body.id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  if (body.icon !== undefined && body.icon !== null && !isBarberIcon(body.icon)) {
    return new Response(JSON.stringify({ error: 'Icono inválido' }), { status: 400 });
  }

  if (body.name !== undefined && !body.name.trim()) {
    return new Response(JSON.stringify({ error: 'Nombre requerido' }), { status: 400 });
  }

  if (body.durationMin !== undefined && body.durationMin < 5) {
    return new Response(JSON.stringify({ error: 'Duración mínima de 5 minutos' }), { status: 400 });
  }

  const updates: Partial<typeof services.$inferInsert> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.durationMin !== undefined) updates.durationMin = body.durationMin;
  if (body.priceCents !== undefined) updates.priceCents = body.priceCents;
  if (body.active !== undefined) updates.active = body.active;
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
  if (body.icon !== undefined) updates.icon = body.icon && isBarberIcon(body.icon) ? body.icon : null;

  const [updated] = await db
    .update(services)
    .set(updates)
    .where(eq(services.id, body.id))
    .returning();

  return new Response(JSON.stringify({ service: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async (context) => {
  const authError = await requireAdmin(context);
  if (authError) return authError;

  const { request } = context;
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!body.id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });
  }

  await db.delete(services).where(eq(services.id, body.id));
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
