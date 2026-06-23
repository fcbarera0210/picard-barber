import { useEffect, useState } from 'react';
import { formatPriceCents } from '../../lib/format';
import {
  DEFAULT_BARBER_ICON,
  resolveBarberIcon,
  serviceBarberIcon,
  type BarberIconName,
} from '../../lib/barber-icons';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { toast } from '../../lib/toast';
import { BarberIcon } from './BarberIcon';
import { BarberIconPicker } from './BarberIconPicker';

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
  active: boolean;
  sortOrder: number;
  icon: string | null;
};

type ServiceForm = {
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  icon: BarberIconName;
};

const emptyCreateForm = (): ServiceForm => ({
  name: '',
  description: '',
  durationMin: 30,
  priceCents: 0,
  icon: DEFAULT_BARBER_ICON,
});

function toEditForm(service: Service, index: number): ServiceForm {
  return {
    name: service.name,
    description: service.description ?? '',
    durationMin: service.durationMin,
    priceCents: service.priceCents,
    icon: serviceBarberIcon(service.icon, service.name, index),
  };
}

function ServiceFields({
  form,
  onChange,
  iconName,
  disabled,
}: {
  form: ServiceForm;
  onChange: (next: ServiceForm) => void;
  iconName: string;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          placeholder="Nombre"
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="input-field"
          disabled={disabled}
        />
        <input
          type="number"
          placeholder="Duración (min)"
          required
          min={5}
          value={form.durationMin}
          onChange={(e) => onChange({ ...form, durationMin: Number(e.target.value) })}
          className="input-field"
          disabled={disabled}
        />
        <input
          type="number"
          placeholder="Precio (CLP)"
          value={form.priceCents}
          onChange={(e) => onChange({ ...form, priceCents: Number(e.target.value) })}
          className="input-field"
          disabled={disabled}
        />
        <input
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className="input-field"
          disabled={disabled}
        />
      </div>
      <BarberIconPicker
        name={iconName}
        value={form.icon}
        onChange={(icon) => onChange({ ...form, icon })}
        disabled={disabled}
      />
    </>
  );
}

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState<ServiceForm>(emptyCreateForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ServiceForm>(emptyCreateForm);
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

  function startEdit(service: Service, index: number) {
    setEditingId(service.id);
    setEditForm(toEditForm(service, index));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyCreateForm());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await run('create', async () => {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          priceCents: Math.round(createForm.priceCents),
          icon: createForm.icon,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Error al crear el servicio');
        return;
      }
      setCreateForm(emptyCreateForm());
      await load();
      toast.success('Servicio agregado correctamente');
    });
  }

  async function handleUpdate(e: React.FormEvent, id: string) {
    e.preventDefault();
    await run(`save:${id}`, async () => {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          durationMin: editForm.durationMin,
          priceCents: Math.round(editForm.priceCents),
          icon: editForm.icon,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Error al guardar el servicio');
        return;
      }
      cancelEdit();
      await load();
      toast.success('Servicio actualizado correctamente');
    });
  }

  async function toggleActive(id: string, active: boolean) {
    await run(`toggle:${id}`, async () => {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      });
      if (!res.ok) {
        toast.error('Error al cambiar el estado del servicio');
        return;
      }
      await load();
      toast.success(active ? 'Servicio desactivado' : 'Servicio activado');
    });
  }

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="card space-y-4">
        <h2 className="font-heading text-xl font-bold">Nuevo servicio</h2>
        <ServiceFields
          form={createForm}
          onChange={(next) => {
            setCreateForm((prev) => ({
              ...next,
              icon:
                next.name !== prev.name && prev.icon === DEFAULT_BARBER_ICON
                  ? resolveBarberIcon(next.name, 0)
                  : next.icon,
            }));
          }}
          iconName="create-icon"
          disabled={isLoading('create')}
        />
        <button type="submit" disabled={isLoading('create')} className="btn-primary">
          Agregar
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-heading text-xl font-bold">Servicios</h2>
        {services.length === 0 ? (
          <p className="text-muted">No hay servicios creados.</p>
        ) : (
          services.map((s, idx) => {
            const currentIcon = serviceBarberIcon(s.icon, s.name, idx);
            const isEditing = editingId === s.id;

            return (
              <div key={s.id} className="card space-y-4">
                {isEditing ? (
                  <form onSubmit={(e) => void handleUpdate(e, s.id)} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-mono text-xs uppercase tracking-widest text-accent">
                        // Editando servicio
                      </p>
                      {!s.active && <span className="text-sm text-muted">(inactivo)</span>}
                    </div>
                    <ServiceFields
                      form={editForm}
                      onChange={setEditForm}
                      iconName={`edit-icon-${s.id}`}
                      disabled={isLoading(`save:${s.id}`)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={isLoading(`save:${s.id}`)}
                        className="btn-primary"
                      >
                        Guardar cambios
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isLoading(`save:${s.id}`)}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-white/10 bg-surface-light">
                          <BarberIcon icon={currentIcon} tone="accent" size="lg" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {s.name}{' '}
                            {!s.active && <span className="text-sm text-muted">(inactivo)</span>}
                          </p>
                          {s.description && (
                            <p className="mt-1 text-sm text-muted">{s.description}</p>
                          )}
                          <p className="mt-1 text-sm text-muted">
                            {s.durationMin} min · {formatPriceCents(s.priceCents)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(s, idx)}
                          disabled={editingId !== null}
                          className="btn-secondary text-sm"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(s.id, s.active)}
                          disabled={isLoading(`toggle:${s.id}`) || editingId !== null}
                          className="btn-secondary text-sm"
                        >
                          {s.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
