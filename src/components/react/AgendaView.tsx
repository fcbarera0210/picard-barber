import { useEffect, useState } from 'react';
import { formatDateTimeChile } from '../../lib/datetime';
import { buildBookingWhatsAppMessage, openWhatsAppUrl } from '../../lib/whatsapp';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { toast } from '../../lib/toast';
import { ReservationsCalendar } from './ReservationsCalendar';

type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
};

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type ViewMode = 'list' | 'calendar';

export function AgendaView() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [view, setView] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState(toDateInput(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('Picard Barber');
  const [whatsappBookingTemplate, setWhatsappBookingTemplate] = useState<string | null>(null);
  const { run, isLoading } = useAsyncAction();

  async function load() {
    setLoading(true);
    if (view === 'day') {
      const res = await fetch(`/api/bookings?date=${date}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } else {
      const start = new Date(date + 'T00:00:00');
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const res = await fetch(
        `/api/bookings?from=${start.toISOString()}&to=${end.toISOString()}`,
      );
      const data = await res.json();
      setBookings(data.bookings ?? []);
    }
    const bizRes = await fetch('/api/business');
    const bizData = await bizRes.json();
    if (bizData.business?.name) setBusinessName(bizData.business.name);
    setWhatsappBookingTemplate(bizData.business?.whatsappMessageTemplate ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (viewMode === 'list') {
      load();
    }
  }, [date, view, viewMode]);

  async function cancelBooking(id: string) {
    if (!confirm('¿Cancelar esta cita?')) return;
    await run(`cancel:${id}`, async () => {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      if (!res.ok) {
        toast.error('Error al cancelar la cita');
        return;
      }
      await load();
      toast.success('Cita cancelada correctamente');
    });
  }

  function handleWhatsApp(b: Booking) {
    const message = buildBookingWhatsAppMessage({
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      serviceName: b.serviceName,
      startAt: new Date(b.startAt),
      businessName,
      template: whatsappBookingTemplate,
    });
    openWhatsAppUrl(b.clientPhone, message);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'admin-chip admin-chip-active' : 'admin-chip admin-chip-inactive'}
          >
            Calendario
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'admin-chip admin-chip-active' : 'admin-chip admin-chip-inactive'}
          >
            Lista
          </button>
        </div>

        {viewMode === 'list' && (
          <>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setView('day')}
                className={view === 'day' ? 'admin-chip admin-chip-active' : 'admin-chip admin-chip-inactive'}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={view === 'week' ? 'admin-chip admin-chip-active' : 'admin-chip admin-chip-inactive'}
              >
                Semana
              </button>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field w-auto"
            />
          </>
        )}
      </div>

      {viewMode === 'calendar' ? (
        <ReservationsCalendar defaultView="month" title="Agenda" />
      ) : loading ? (
        <p className="text-muted">Cargando agenda...</p>
      ) : bookings.length === 0 ? (
        <p className="text-muted">No hay citas en este período.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{b.clientName}</p>
                <p className="text-sm text-muted">{b.serviceName}</p>
                <p className="text-sm">{formatDateTimeChile(new Date(b.startAt))}</p>
                <p className="text-xs text-muted">
                  {b.clientEmail} · {b.clientPhone}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    b.status === 'confirmed' ? 'status-confirmed text-sm' : 'status-cancelled text-sm'
                  }
                >
                  {b.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                </span>
                {b.status === 'confirmed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(b)}
                      className="rounded-lg bg-whatsapp px-3 py-1.5 text-sm font-medium text-white"
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelBooking(b.id)}
                      disabled={isLoading(`cancel:${b.id}`)}
                      className="btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
