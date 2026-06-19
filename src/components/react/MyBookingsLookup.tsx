import { useState } from 'react';
import { formatDateTimeChile } from '../../lib/datetime';

type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  serviceName: string;
  serviceId: string;
};

export function MyBookingsLookup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientName, setClientName] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al buscar');
        return;
      }
      setClientName(data.client?.name ?? '');
      setBookings(data.bookings ?? []);
      setSearched(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.startAt) >= new Date(),
  );
  const past = bookings.filter(
    (b) => b.status !== 'confirmed' || new Date(b.startAt) < new Date(),
  );

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <form onSubmit={handleSearch} className="card space-y-4">
        <h2 className="font-display text-2xl">Mis reservas</h2>
        <p className="text-sm text-muted">Ingresa tu email para ver tu historial de citas.</p>
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="lookup-email">
            Email
          </label>
          <input
            id="lookup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Buscando...' : 'Buscar reservas'}
        </button>
      </form>

      {searched && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-center text-muted">No hay reservas con este email.</p>
          ) : (
            <>
              {clientName && (
                <p className="text-center text-sm text-muted">
                  Hola, <span className="text-ink">{clientName}</span>
                </p>
              )}
              {upcoming.length > 0 && (
                <section className="card">
                  <h3 className="font-display text-lg text-accent">Próximas citas</h3>
                  <ul className="mt-4 space-y-3">
                    {upcoming.map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-light p-3"
                      >
                        <div>
                          <p className="font-medium">{b.serviceName}</p>
                          <p className="text-sm text-muted">
                            {formatDateTimeChile(new Date(b.startAt))}
                          </p>
                        </div>
                        <span className="status-confirmed text-sm">Confirmada</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {past.length > 0 && (
                <section className="card">
                  <h3 className="font-display text-lg">Historial</h3>
                  <ul className="mt-4 space-y-3">
                    {past.map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{b.serviceName}</p>
                          <p className="text-sm text-muted">
                            {formatDateTimeChile(new Date(b.startAt))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              b.status === 'cancelled' ? 'status-cancelled text-sm' : 'text-sm text-muted'
                            }
                          >
                            {b.status === 'cancelled' ? 'Cancelada' : 'Pasada'}
                          </span>
                          {b.status !== 'cancelled' && (
                            <a
                              href={`/reservar?serviceId=${b.serviceId}`}
                              className="text-sm text-accent hover:underline"
                            >
                              Reservar de nuevo
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
