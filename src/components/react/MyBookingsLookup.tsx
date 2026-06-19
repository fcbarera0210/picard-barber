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

function TicketCard({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`ticket-card overflow-hidden rounded-xl ${accent ? 'neon-shadow-cyan' : ''}`}
    >
      <div className="ticket-card-top" />
      <div className="p-5">{children}</div>
    </div>
  );
}

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
    <div className="mx-auto max-w-2xl space-y-6">
      <form onSubmit={handleSearch} className="card laser-scanner space-y-4">
        <h2 className="font-display text-2xl">
          <span className="text-gradient-cyber">Mis reservas</span>
        </h2>
        <p className="text-sm text-muted">Ingresa tu email para ver tu historial de citas.</p>
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase text-muted" htmlFor="lookup-email">
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
        <div className="space-y-6">
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
                <section>
                  <h3 className="font-display mb-4 text-lg text-accent">Próximas citas</h3>
                  <ul className="space-y-4">
                    {upcoming.map((b) => (
                      <li key={b.id}>
                        <TicketCard accent>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-display text-lg">{b.serviceName}</p>
                              <p className="mt-1 font-mono text-sm text-muted">
                                {formatDateTimeChile(new Date(b.startAt))}
                              </p>
                            </div>
                            <span className="status-confirmed font-mono text-xs uppercase">
                              Confirmada
                            </span>
                          </div>
                        </TicketCard>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h3 className="font-display mb-4 text-lg">Historial</h3>
                  <ul className="space-y-4">
                    {past.map((b) => (
                      <li key={b.id}>
                        <TicketCard>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{b.serviceName}</p>
                              <p className="mt-1 font-mono text-sm text-muted">
                                {formatDateTimeChile(new Date(b.startAt))}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={
                                  b.status === 'cancelled'
                                    ? 'status-cancelled font-mono text-xs uppercase'
                                    : 'font-mono text-xs uppercase text-muted'
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
                          </div>
                        </TicketCard>
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
