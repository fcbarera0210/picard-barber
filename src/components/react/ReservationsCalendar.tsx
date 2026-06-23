import { useEffect, useMemo, useState } from 'react';
import { formatDateTimeChile } from '../../lib/datetime';
import type { CalendarViewMode } from '../../lib/calendar-utils';
import {
  addDays,
  addMonths,
  addWeeks,
  formatDateKey,
  getFetchRange,
  getMonthGridDays,
  getPeriodLabel,
  getWeekDays,
  isToday,
} from '../../lib/calendar-utils';

export type CalendarBooking = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName: string;
};

type ReservationsCalendarProps = {
  compact?: boolean;
  defaultView?: CalendarViewMode;
  title?: string;
};

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function ReservationsCalendar({
  compact = false,
  defaultView = 'week',
  title = 'Calendario de reservas',
}: ReservationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(defaultView);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<CalendarBooking[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { from, to } = getFetchRange(currentDate, viewMode);
      try {
        const res = await fetch(
          `/api/bookings?from=${from.toISOString()}&to=${to.toISOString()}`,
        );
        const data = await res.json();
        if (!cancelled) {
          setBookings(
            (data.bookings ?? []).filter((b: CalendarBooking) => b.status === 'confirmed'),
          );
        }
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentDate, viewMode]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    bookings.forEach((booking) => {
      const key = formatDateKey(new Date(booking.startAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(booking);
    });
    map.forEach((list) =>
      list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    );
    return map;
  }, [bookings]);

  const getBookingsForDate = (date: Date) => bookingsByDate.get(formatDateKey(date)) ?? [];

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      if (viewMode === 'day') return addDays(prev, direction === 'prev' ? -1 : 1);
      if (viewMode === 'week') return addWeeks(prev, direction === 'prev' ? -1 : 1);
      return addMonths(prev, direction === 'prev' ? -1 : 1);
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedBookings(getBookingsForDate(date));
  };

  const renderBookingChip = (booking: CalendarBooking) => (
    <a
      key={booking.id}
      href="/admin/agenda"
      className="calendar-booking-chip block truncate"
      title={`${booking.clientName} — ${booking.serviceName}`}
      onClick={(e) => e.stopPropagation()}
    >
      {new Date(booking.startAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}{' '}
      {booking.clientName}
    </a>
  );

  const cellMinH = compact ? 'min-h-[72px]' : 'min-h-[96px]';
  const weekMinH = compact ? 'min-h-[110px]' : 'min-h-[140px]';

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getMonthGridDays(year, month);
    const maxVisible = compact ? 1 : 2;

    return (
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAY_NAMES_SHORT.map((day) => (
          <div key={day} className="calendar-weekday-label p-1.5 text-center text-xs font-mono uppercase tracking-wider">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          const dayBookings = getBookingsForDate(date);
          const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year;
          const isTodayDate = isToday(date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              className={`calendar-cell ${cellMinH} p-2 text-left transition ${isTodayDate ? 'calendar-cell-today' : ''} ${!isCurrentMonth ? 'calendar-cell-outside' : ''}`}
            >
              <span className={`mb-1 block text-sm font-medium ${isTodayDate ? 'text-accent' : ''}`}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayBookings.slice(0, maxVisible).map((b) => renderBookingChip(b))}
                {dayBookings.length > maxVisible && (
                  <span className="text-[10px] text-muted">+{dayBookings.length - maxVisible}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const maxVisible = compact ? 3 : 5;

    return (
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((date) => {
          const dayBookings = getBookingsForDate(date);
          const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
          const isTodayDate = isToday(date);

          return (
            <button
              key={formatDateKey(date)}
              type="button"
              onClick={() => handleDateClick(date)}
              className={`calendar-cell ${weekMinH} flex flex-col p-2 text-left transition ${isTodayDate ? 'calendar-cell-today' : ''}`}
            >
              <div className="mb-2 text-center">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  {DAY_NAMES_WEEK[dayIndex]}
                </div>
                <div className={`text-sm font-medium ${isTodayDate ? 'text-accent' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayBookings.slice(0, maxVisible).map((b) => renderBookingChip(b))}
                {dayBookings.length > maxVisible && (
                  <span className="text-[10px] text-muted">+{dayBookings.length - maxVisible}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);

    if (dayBookings.length === 0) {
      return <p className="py-8 text-center text-sm text-muted">No hay citas confirmadas este día.</p>;
    }

    return (
      <div className="space-y-2">
        {dayBookings.map((booking) => (
          <div key={booking.id} className="calendar-day-item flex items-center gap-4 p-3">
            <div className="min-w-[56px] rounded px-2 py-1.5 text-center font-mono text-xs font-bold text-bg bg-accent">
              {new Date(booking.startAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{booking.clientName}</p>
              <p className="truncate text-sm text-muted">{booking.serviceName}</p>
            </div>
            <span className="status-confirmed text-xs">Confirmada</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">{title}</h2>
          <p className="text-sm capitalize text-muted">{getPeriodLabel(currentDate, viewMode)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? 'admin-chip admin-chip-active' : 'admin-chip admin-chip-inactive'}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => navigate('prev')} className="admin-chip admin-chip-inactive px-2">
            ‹
          </button>
          <button type="button" onClick={() => setCurrentDate(new Date())} className="admin-chip admin-chip-active">
            Hoy
          </button>
          <button type="button" onClick={() => navigate('next')} className="admin-chip admin-chip-inactive px-2">
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Cargando reservas...</p>
      ) : (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      )}

      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedDate(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-heading font-bold">
                {selectedDate.toLocaleDateString('es-CL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-muted hover:text-ink"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {selectedBookings.length === 0 ? (
              <p className="text-sm text-muted">Sin citas confirmadas.</p>
            ) : (
              <ul className="space-y-2">
                {selectedBookings.map((booking) => (
                  <li key={booking.id} className="calendar-day-item rounded border border-border p-3">
                    <p className="font-medium">{booking.clientName}</p>
                    <p className="text-sm text-muted">{booking.serviceName}</p>
                    <p className="text-sm">{formatDateTimeChile(new Date(booking.startAt))}</p>
                  </li>
                ))}
              </ul>
            )}

            <a href="/admin/agenda" className="btn-primary block text-center">
              Ver agenda
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
