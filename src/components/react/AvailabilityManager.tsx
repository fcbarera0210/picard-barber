import { useEffect, useState } from 'react';
import { DAYS_ORDER, DAY_LABELS } from '../../lib/schedule';
import { useAsyncAction } from '../../hooks/useAsyncAction';

type Block = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

const emptyBlock = (): Block => ({ dayOfWeek: 'LUNES', startTime: '09:00', endTime: '13:00', active: true });

export function AvailabilityManager() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [emergencyBlocks, setEmergencyBlocks] = useState<
    Array<{ id: string; startAt: string; endAt: string; reason: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [emergencyForm, setEmergencyForm] = useState({
    startAt: '',
    endAt: '',
    reason: '',
  });
  const { run, isLoading } = useAsyncAction();

  async function load() {
    const [availRes, blockRes] = await Promise.all([
      fetch('/api/availability'),
      fetch('/api/booking-blocks'),
    ]);
    const availData = await availRes.json();
    const blockData = await blockRes.json();
    setBlocks(availData.blocks?.length ? availData.blocks : [emptyBlock()]);
    setEmergencyBlocks(blockData.blocks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function addBlock(day: string) {
    setBlocks((b) => [...b, { dayOfWeek: day, startTime: '09:00', endTime: '13:00', active: true }]);
  }

  function updateBlock(index: number, field: keyof Block, value: string | boolean) {
    setBlocks((b) => b.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeBlock(index: number) {
    setBlocks((b) => b.filter((_, i) => i !== index));
  }

  async function saveAvailability() {
    await run('save-avail', async () => {
      await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      await load();
    });
  }

  async function addEmergency(e: React.FormEvent) {
    e.preventDefault();
    await run('emergency', async () => {
      await fetch('/api/booking-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyForm),
      });
      setEmergencyForm({ startAt: '', endAt: '', reason: '' });
      await load();
    });
  }

  async function removeEmergency(id: string) {
    await run(`del:${id}`, async () => {
      await fetch('/api/booking-blocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await load();
    });
  }

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="space-y-8">
      <section className="card space-y-4">
        <h2 className="font-display text-xl">Horarios semanales</h2>
        <p className="text-sm text-muted">
          Puedes agregar varios rangos por día (ej. mañana y tarde con pausa de almuerzo).
        </p>
        {DAYS_ORDER.map((day) => {
          const dayBlocks = blocks
            .map((b, i) => ({ ...b, index: i }))
            .filter((b) => b.dayOfWeek === day);
          return (
            <div key={day} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">{DAY_LABELS[day]}</h3>
                <button type="button" onClick={() => addBlock(day)} className="text-sm text-accent">
                  + Rango
                </button>
              </div>
              {dayBlocks.length === 0 ? (
                <p className="text-sm text-muted">Sin horario</p>
              ) : (
                dayBlocks.map((b) => (
                  <div key={b.index} className="mb-2 flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={b.startTime}
                      onChange={(e) => updateBlock(b.index, 'startTime', e.target.value)}
                      className="input-field w-auto"
                    />
                    <span className="text-muted">—</span>
                    <input
                      type="time"
                      value={b.endTime}
                      onChange={(e) => updateBlock(b.index, 'endTime', e.target.value)}
                      className="input-field w-auto"
                    />
                    <button
                      type="button"
                      onClick={() => removeBlock(b.index)}
                      className="text-sm text-danger"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={saveAvailability}
          disabled={isLoading('save-avail')}
          className="btn-primary"
        >
          Guardar horarios
        </button>
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-xl">Bloqueadores de emergencia</h2>
        <form onSubmit={addEmergency} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Desde</label>
            <input
              type="datetime-local"
              required
              value={emergencyForm.startAt}
              onChange={(e) => setEmergencyForm((f) => ({ ...f, startAt: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Hasta</label>
            <input
              type="datetime-local"
              required
              value={emergencyForm.endAt}
              onChange={(e) => setEmergencyForm((f) => ({ ...f, endAt: e.target.value }))}
              className="input-field"
            />
          </div>
          <input
            placeholder="Motivo (opcional)"
            value={emergencyForm.reason}
            onChange={(e) => setEmergencyForm((f) => ({ ...f, reason: e.target.value }))}
            className="input-field sm:col-span-2"
          />
          <button type="submit" disabled={isLoading('emergency')} className="btn-primary sm:col-span-2">
            Agregar bloqueo
          </button>
        </form>
        <ul className="space-y-2">
          {emergencyBlocks.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div>
                <p className="text-sm">
                  {new Date(b.startAt).toLocaleString('es-CL')} —{' '}
                  {new Date(b.endAt).toLocaleString('es-CL')}
                </p>
                {b.reason && <p className="text-xs text-muted">{b.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeEmergency(b.id)}
                disabled={isLoading(`del:${b.id}`)}
                className="text-sm text-danger"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
