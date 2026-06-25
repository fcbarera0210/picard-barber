import { useEffect, useState } from 'react';
import { addDaysToDateStr, endOfDay, startOfDay } from '../../lib/datetime';
import { toast } from '../../lib/toast';
import { useBookingBusiness } from '../../hooks/useBookingBusiness';
import { BookingDayCard } from './BookingDayCard';
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
  const { businessName, whatsappBookingTemplate } = useBookingBusiness();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [view, setView] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState(toDateInput(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  async function load() {
    setLoading(true);
    try {
      if (view === 'day') {
        const res = await fetch(`/api/bookings?date=${date}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setBookings(data.bookings ?? []);
      } else {
        const endKey = addDaysToDateStr(date, 6);
        const res = await fetch(
          `/api/bookings?from=${startOfDay(date).toISOString()}&to=${endOfDay(endKey).toISOString()}`,
        );
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setBookings(data.bookings ?? []);
      }
    } catch {
      setBookings([]);
      toast.error('No se pudo cargar la agenda');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (viewMode === 'list') {
      load();
    }
  }, [date, view, viewMode, reloadKey]);

  function handleBookingCancelled() {
    setReloadKey((k) => k + 1);
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
        <ReservationsCalendar
          defaultView="month"
          title="Agenda"
          enableActions
          showAgendaLink={false}
        />
      ) : loading ? (
        <p className="text-muted">Cargando agenda...</p>
      ) : bookings.length === 0 ? (
        <p className="text-muted">No hay citas en este período.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingDayCard
              key={b.id}
              booking={b}
              businessName={businessName}
              whatsappTemplate={whatsappBookingTemplate}
              onCancelled={handleBookingCancelled}
              showContact
            />
          ))}
        </div>
      )}
    </div>
  );
}
