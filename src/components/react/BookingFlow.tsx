import { useEffect, useState } from 'react';
import { formatPriceCents } from '../../lib/format';
import { BookingTicketPreview } from './BookingTicketPreview';

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
};

type BookingFlowProps = {
  initialServiceId?: string;
};

export function BookingFlow({ initialServiceId }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(initialServiceId ?? '');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedService = services.find((s) => s.id === serviceId);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        setServices(d.services ?? []);
        if (initialServiceId) setServiceId(initialServiceId);
      });
  }, [initialServiceId]);

  useEffect(() => {
    if (!serviceId) {
      setAvailableDates([]);
      return;
    }
    setDatesLoading(true);
    setAvailableDates([]);
    setDate('');
    fetch(`/api/slots?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((d) => setAvailableDates(d.dates ?? []))
      .catch(() => setAvailableDates([]))
      .finally(() => setDatesLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoading(true);
    setSlots([]);
    setTime('');
    fetch(`/api/slots?date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false));
  }, [serviceId, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, date, time, name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al reservar');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="ticket-card mx-auto max-w-lg overflow-hidden rounded-xl text-center">
        <div className="ticket-card-top" />
        <div className="p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/10 text-3xl text-success">
            ✓
          </div>
          <h2 className="font-display text-3xl text-gradient-cyber">¡Reserva confirmada!</h2>
          <p className="mt-3 text-muted">
            Te esperamos el {date} a las {time}. Revisa tus citas en cualquier momento con tu email.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/mis-reservas" className="btn-primary">
              Ver mis reservas
            </a>
            <a href="/" className="btn-secondary">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles = ['Elige servicio', 'Elige fecha', 'Elige hora', 'Confirma reserva'];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="card laser-scanner">
        <div className="mb-6 flex items-center gap-3">
          <span className="step-badge">{step}</span>
          <h2 className="font-display text-2xl">{stepTitles[step - 1]}</h2>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= s ? 'bg-accent neon-shadow-cyan' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setServiceId(s.id);
                  setStep(2);
                }}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  serviceId === s.id
                    ? 'border-accent bg-accent/10 neon-shadow-cyan'
                    : 'border-white/10 bg-surface hover:border-accent/40'
                }`}
              >
                <div className="flex justify-between gap-4">
                  <span className="font-semibold">{s.name}</span>
                  <span className="font-mono text-accent">{formatPriceCents(s.priceCents)}</span>
                </div>
                {s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}
                <p className="mt-1 font-mono text-xs text-muted">{s.durationMin} min</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{selectedService?.name}</p>
            {datesLoading ? (
              <p className="text-muted">Buscando fechas disponibles...</p>
            ) : availableDates.length === 0 ? (
              <p className="text-muted">
                No hay fechas con horarios disponibles para este servicio. Prueba otro servicio o
                vuelve más tarde.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableDates.map((d) => {
                  const label = new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDate(d);
                        setStep(3);
                      }}
                      className="slot-btn"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            <button type="button" onClick={() => setStep(1)} className="btn-secondary text-sm">
              Atrás
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {date} · {selectedService?.name}
            </p>
            {loading ? (
              <p className="text-muted">Cargando horarios...</p>
            ) : slots.length === 0 ? (
              <p className="text-muted">No hay horarios disponibles este día.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setTime(slot);
                      setStep(4);
                    }}
                    className={`slot-btn ${time === slot ? 'slot-btn-selected' : ''}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setStep(2)} className="btn-secondary text-sm">
              Atrás
            </button>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted">
              {selectedService?.name} · {date} · {time}
            </p>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase text-muted" htmlFor="name">
                Nombre completo
              </label>
              <input
                id="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase text-muted" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase text-muted" htmlFor="phone">
                Teléfono (9 dígitos)
              </label>
              <input
                id="phone"
                type="tel"
                required
                pattern="[0-9]{9}"
                placeholder="912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                Atrás
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Reservando...' : 'Confirmar reserva'}
              </button>
            </div>
          </form>
        )}
      </div>

      <BookingTicketPreview
        service={selectedService}
        date={date}
        time={time}
        name={name}
      />
    </div>
  );
}
