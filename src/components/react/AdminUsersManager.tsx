import { useEffect, useState } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { toast } from '../../lib/toast';

type AdminUser = {
  id: string;
  username: string;
  createdAt: string;
};

type CreateForm = {
  username: string;
  password: string;
  confirmPassword: string;
};

const emptyForm = (): CreateForm => ({
  username: '',
  password: '',
  confirmPassword: '',
});

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const { run, isLoading } = useAsyncAction();

  async function loadUsers() {
    const res = await fetch('/api/admin-users');
    if (!res.ok) {
      toast.error('No se pudieron cargar los administradores');
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    await run('create', async () => {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo crear el administrador');
        return;
      }

      setUsers((prev) => [...prev, data.user]);
      setForm(emptyForm());
      setShowForm(false);
      toast.success('Administrador creado correctamente');
    });
  }

  if (loading) {
    return (
      <div className="card">
        <p className="text-muted">Cargando administradores...</p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Usuarios administradores</h2>
          <p className="mt-1 text-sm text-muted">
            Cuentas con acceso al panel de gestión del local.
          </p>
        </div>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            + Nuevo administrador
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted">No hay administradores registrados.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-muted">
                  Creado el {new Date(user.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-border bg-surface/50 p-4"
        >
          <h3 className="font-heading font-bold">Nuevo administrador</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-muted" htmlFor="admin-username">
                Usuario
              </label>
              <input
                id="admin-username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="input-field"
                required
                minLength={3}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="admin-password">
                Contraseña
              </label>
              <input
                id="admin-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input-field"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="admin-confirm-password">
                Confirmar contraseña
              </label>
              <input
                id="admin-confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="input-field"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isLoading('create')} className="btn-primary">
              {isLoading('create') ? 'Creando...' : 'Crear administrador'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={isLoading('create')}
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm());
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
