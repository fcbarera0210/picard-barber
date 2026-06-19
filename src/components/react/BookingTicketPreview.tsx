import { formatPriceCents } from '../../lib/format';

type Service = {
  name: string;
  durationMin: number;
  priceCents: number;
};

type BookingTicketPreviewProps = {
  service: Service | undefined;
  date: string;
  time: string;
  name: string;
};

export function BookingTicketPreview({ service, date, time, name }: BookingTicketPreviewProps) {
  const dateLabel = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="ticket-card sticky top-24 hidden overflow-hidden rounded-xl lg:block">
      <div className="ticket-card-top" />
      <div className="p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Vista previa</p>
        <h3 className="font-display mt-2 text-2xl">Tu reserva</h3>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="font-mono text-xs uppercase text-muted">Servicio</dt>
            <dd className="mt-1 font-medium">{service?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase text-muted">Fecha</dt>
            <dd className="mt-1 capitalize">{dateLabel}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase text-muted">Hora</dt>
            <dd className="mt-1 font-mono text-accent">{time || '—'}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase text-muted">Cliente</dt>
            <dd className="mt-1">{name || '—'}</dd>
          </div>
          <div className="border-t border-white/10 pt-4">
            <dt className="font-mono text-xs uppercase text-muted">Total</dt>
            <dd className="mt-1 font-mono text-2xl text-accent">
              {service ? formatPriceCents(service.priceCents) : '—'}
            </dd>
            {service && (
              <p className="mt-1 text-xs text-muted">{service.durationMin} minutos</p>
            )}
          </div>
        </dl>

        <div className="mt-6 flex justify-center gap-0.5 opacity-30" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className={`h-8 w-0.5 ${i % 3 === 0 ? 'bg-white' : 'bg-transparent'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
