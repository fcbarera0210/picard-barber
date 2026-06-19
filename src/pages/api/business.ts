import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../lib/admin-auth';
import { getActiveBusiness } from '../../lib/business';
import { db } from '../../lib/db';
import { business } from '../../lib/db/schema';

export const prerender = false;

export const GET: APIRoute = async () => {
  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }
  return new Response(
    JSON.stringify({
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        address: biz.address,
        phone: biz.phone,
        whatsappNumber: biz.whatsappNumber,
        mapsUrl: biz.mapsUrl,
        instagramUrl: biz.instagramUrl,
        minAdvanceHours: biz.minAdvanceHours,
        maxAdvanceDays: biz.maxAdvanceDays,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};

export const PATCH: APIRoute = async (context) => {
  const authError = await requireAdmin(context);
  if (authError) return authError;

  const { request } = context;
  const biz = await getActiveBusiness();
  if (!biz) {
    return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  const updates: Partial<typeof business.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.name === 'string') updates.name = body.name.trim();
  if (typeof body.description === 'string') updates.description = body.description.trim() || null;
  if (typeof body.address === 'string') updates.address = body.address.trim() || null;
  if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null;
  if (typeof body.whatsappNumber === 'string')
    updates.whatsappNumber = body.whatsappNumber.trim() || null;
  if (typeof body.mapsUrl === 'string') updates.mapsUrl = body.mapsUrl.trim() || null;
  if (typeof body.instagramUrl === 'string')
    updates.instagramUrl = body.instagramUrl.trim() || null;
  if (typeof body.maxAdvanceDays === 'number' && body.maxAdvanceDays >= 1 && body.maxAdvanceDays <= 60) {
    updates.maxAdvanceDays = body.maxAdvanceDays;
  }

  const [updated] = await db
    .update(business)
    .set(updates)
    .where(eq(business.id, biz.id))
    .returning();

  return new Response(JSON.stringify({ business: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
