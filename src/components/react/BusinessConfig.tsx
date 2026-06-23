import { useEffect, useState } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { toast } from '../../lib/toast';
import {
  BOOKING_WHATSAPP_VARIABLES,
  CLIENT_WHATSAPP_VARIABLES,
  WhatsAppMessageEditor,
} from './WhatsAppMessageEditor';

import {
  DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
  DEFAULT_WHATSAPP_CLIENT_TEMPLATE,
} from '../../lib/whatsapp';

type Business = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  whatsappMessageTemplate: string | null;
  whatsappClientMessageTemplate: string | null;
  mapsUrl: string | null;
  instagramUrl: string | null;
  maxAdvanceDays: number;
};

export function BusinessConfig() {
  const [form, setForm] = useState<Business | null>(null);
  const { run, isLoading } = useAsyncAction();

  useEffect(() => {
    fetch('/api/business')
      .then((r) => r.json())
      .then((d) => setForm(d.business));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    await run('save', async () => {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error('Error al guardar la configuración');
      }
    });
  }

  if (!form) return <p className="text-muted">Cargando...</p>;

  return (
    <form onSubmit={handleSave} className="card space-y-4">
      <h2 className="font-heading font-bold text-xl">Configuración del local</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-muted">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-muted">Descripción</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })}
            className="input-field min-h-[80px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Dirección</label>
          <input
            value={form.address ?? ''}
            onChange={(e) => setForm((f) => f && { ...f, address: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Teléfono</label>
          <input
            value={form.phone ?? ''}
            onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">WhatsApp (con código país)</label>
          <input
            value={form.whatsappNumber ?? ''}
            onChange={(e) => setForm((f) => f && { ...f, whatsappNumber: e.target.value })}
            className="input-field"
            placeholder="56912345678"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Días máx. para reservar</label>
          <input
            type="number"
            min={1}
            max={60}
            value={form.maxAdvanceDays}
            onChange={(e) =>
              setForm((f) => f && { ...f, maxAdvanceDays: Number(e.target.value) })
            }
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Google Maps URL</label>
          <input
            value={form.mapsUrl ?? ''}
            onChange={(e) => setForm((f) => f && { ...f, mapsUrl: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Instagram URL</label>
          <input
            value={form.instagramUrl ?? ''}
            onChange={(e) => setForm((f) => f && { ...f, instagramUrl: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="font-heading font-bold text-lg">Mensajes de WhatsApp</h3>
        <p className="text-sm text-muted">
          Personaliza los mensajes que se abren al contactar clientes. Pasa el cursor sobre cada variable para ver qué hace.
        </p>
        <WhatsAppMessageEditor
          label="Mensaje al contactar por una cita (agenda)"
          value={form.whatsappMessageTemplate ?? ''}
          placeholder={DEFAULT_WHATSAPP_BOOKING_TEMPLATE}
          variables={BOOKING_WHATSAPP_VARIABLES}
          onChange={(whatsappMessageTemplate) =>
            setForm((f) => f && { ...f, whatsappMessageTemplate })
          }
        />
        <WhatsAppMessageEditor
          label="Mensaje al contactar un cliente (listado)"
          value={form.whatsappClientMessageTemplate ?? ''}
          placeholder={DEFAULT_WHATSAPP_CLIENT_TEMPLATE}
          variables={CLIENT_WHATSAPP_VARIABLES}
          onChange={(whatsappClientMessageTemplate) =>
            setForm((f) => f && { ...f, whatsappClientMessageTemplate })
          }
        />
      </div>
      <button type="submit" disabled={isLoading('save')} className="btn-primary">
        Guardar cambios
      </button>
    </form>
  );
}
