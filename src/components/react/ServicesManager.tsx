import { useEffect, useState } from 'react';
import { formatPriceCents } from '../../lib/format';
import { useAsyncAction } from '../../hooks/useAsyncAction';

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  active: boolean;
  sortOrder: number;
};

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMin: 30,
    priceCents: 0,
  });
  const { run, isLoading } = useAsyncAction();

  async function load() {
    const res = await fetch('/api/services?admin=1');
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await run('create', async () => {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          priceCents: Math.round(form.priceCents),
        }),
      });
      setForm({ name: '', description: '', durationMin: 30, priceCents: 0 });
      await load();
    });
  }

  async function toggleActive(id: string, active: boolean) {
    await run(`toggle:${id}`, async () => {
      await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      });
      await load();
    });
  }

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="card space-y-4">
        <h2 className="font-display text-xl">Nuevo servicio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Nombre"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Duración (min)"
            required
            min={5}
            value={form.durationMin}
            onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Precio (CLP)"
            value={form.priceCents}
            onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))}
            className="input-field"
          />
          <input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={isLoading('create')} className="btn-primary">
          Agregar
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-xl">Servicios activos</h2>
        {services.map((s) => (
          <div
            key={s.id}
            className="card flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold">
                {s.name}{' '}
                {!s.active && <span className="text-sm text-muted">(inactivo)</span>}
              </p>
              <p className="text-sm text-muted">
                {s.durationMin} min · {formatPriceCents(s.priceCents)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleActive(s.id, s.active)}
              disabled={isLoading(`toggle:${s.id}`)}
              className="btn-secondary text-sm"
            >
              {s.active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
