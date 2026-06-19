import { useEffect, useState } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';

type Business = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  mapsUrl: string | null;
  instagramUrl: string | null;
  maxAdvanceDays: number;
};

export function BusinessConfig() {
  const [form, setForm] = useState<Business | null>(null);
  const [message, setMessage] = useState('');
  const { run, isLoading } = useAsyncAction();

  useEffect(() => {
    fetch('/api/business')
      .then((r) => r.json())
      .then((d) => setForm(d.business));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMessage('');
    await run('save', async () => {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('Guardado correctamente');
      } else {
        setMessage('Error al guardar');
      }
    });
  }

  if (!form) return <p className="text-muted">Cargando...</p>;

  return (
    <form onSubmit={handleSave} className="card mx-auto max-w-2xl space-y-4">
      <h2 className="font-display text-xl">Configuración del local</h2>
      {message && <p className="text-sm text-success">{message}</p>}
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
      <button type="submit" disabled={isLoading('save')} className="btn-primary">
        Guardar cambios
      </button>
    </form>
  );
}
