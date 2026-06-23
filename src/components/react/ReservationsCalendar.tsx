import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateTimeChile, formatTimeChile, TIMEZONE } from '../../lib/datetime';
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
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useBookingBusiness } from '../../hooks/useBookingBusiness';
import { toast } from '../../lib/toast';
import { BookingDayCard } from './BookingDayCard';
import { DayDetailSheet } from './DayDetailSheet';

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
  enableActions?: boolean;
  showAgendaLink?: boolean;
};

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_MOBILE = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAY_NAMES_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function ReservationsCalendar({
  compact = false,
  defaultView = 'week',
  title = 'Calendario de reservas',
  enableActions = true,
  showAgendaLink,
}: ReservationsCalendarProps) {
  const isMobile = useIsMobile();
  const { businessName, whatsappBookingTemplate } = useBookingBusiness();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(defaultView);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<CalendarBooking[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileInitialized, setMobileInitialized] = useState(false);

  const resolvedShowAgendaLink = showAgendaLink ?? true;

  const loadBookings = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const { from, to } = getFetchRange(currentDate, viewMode);
    try {
      const res = await fetch(`/api/bookings?from=${from.toISOString()}&to=${to.toISOString()}`, {
        signal,
      });
      const data = await res.json();
      setBookings(
        (data.bookings ?? []).filter((b: CalendarBooking) => b.status === 'confirmed'),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setBookings([]);
      toast.error('No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, [loadBookings, reloadKey]);

  useEffect(() => {
    if (!isMobile) return;
    if (viewMode === 'week') {
      setViewMode('day');
    }
  }, [isMobile, viewMode]);

  useEffect(() => {
    if (!isMobile || mobileInitialized) return;
    if (defaultView === 'month' || defaultView === 'week') {
      setViewMode('day');
    }
    setMobileInitialized(true);
  }, [isMobile, defaultView, mobileInitialized]);

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedBookings(getBookingsForDate(selectedDate));
  }, [bookings, selectedDate]);

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

  const handleBookingCancelled = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

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

  const closeDetail = () => {
    setSelectedDate(null);
    setSelectedBookings([]);
  };

  const renderBookingChip = (booking: CalendarBooking) => (
    <span
      key={booking.id}
      className="calendar-booking-chip block truncate"
      title={`${booking.clientName} — ${booking.serviceName}`}
    >
      {formatTimeChile(new Date(booking.startAt))}{' '}
      {booking.clientName}
    </span>
  );

  const cellMinH = compact ? 'min-h-[72px]' : 'min-h-[96px]';
  const weekMinH = compact ? 'min-h-[110px]' : 'min-h-[140px]';

  const renderMonthViewDesktop = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getMonthGridDays(year, month);
    const maxVisible = compact ? 1 : 2;

    return (
      <div className="hidden grid-cols-7 gap-1.5 sm:gap-2 md:grid">
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="calendar-weekday-label p-1.5 text-center text-xs font-mono uppercase tracking-wider"
          >
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

  const renderMonthViewMobile = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getMonthGridDays(year, month);

    return (
      <div className="grid grid-cols-7 gap-1 md:hidden">
        {DAY_NAMES_MOBILE.map((day, i) => (
          <div
            key={`${day}-${i}`}
            className="calendar-weekday-label calendar-weekday-label-mobile text-center font-mono uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          const dayBookings = getBookingsForDate(date);
          const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year;
          const isTodayDate = isToday(date);
          const count = dayBookings.length;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              className={`calendar-cell calendar-cell-mobile transition ${isTodayDate ? 'calendar-cell-today' : ''} ${!isCurrentMonth ? 'calendar-cell-outside' : ''}`}
            >
              <span className={`text-sm font-medium ${isTodayDate ? 'text-accent' : ''}`}>
                {date.getDate()}
              </span>
              {count > 0 && (
                count > 1 ? (
                  <span className="calendar-day-count">{count}</span>
                ) : (
                  <span className="calendar-day-dot" aria-label="1 cita" />
                )
              )}
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
      <div className="hidden grid-cols-7 gap-1.5 sm:gap-2 md:grid">
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

    if (enableActions) {
      return (
        <div className="space-y-2">
          {dayBookings.map((booking) => (
            <BookingDayCard
              key={booking.id}
              booking={booking}
              businessName={businessName}
              whatsappTemplate={whatsappBookingTemplate}
              onCancelled={handleBookingCancelled}
              compact
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {dayBookings.map((booking) => (
          <div key={booking.id} className="calendar-day-item flex items-center gap-4 p-3">
            <div className="min-w-[56px] rounded px-2 py-1.5 text-center font-mono text-xs font-bold text-bg bg-accent">
              {formatTimeChile(new Date(booking.startAt))}
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

  const viewModes: CalendarViewMode[] = isMobile ? ['day', 'month'] : ['day', 'week', 'month'];

  const renderToolbar = () => (
    <>
      <div className="md:hidden">
        <div className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-bold">{title}</h2>
            <p className="text-sm capitalize text-muted">{getPeriodLabel(currentDate, viewMode)}</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('prev')}
              className="admin-chip admin-chip-inactive min-h-11 min-w-11 px-3 text-lg"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="admin-chip admin-chip-active min-h-11 flex-1"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => navigate('next')}
              className="admin-chip admin-chip-inactive min-h-11 min-w-11 px-3 text-lg"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>

          <div className="calendar-view-toggle-mobile">
            {viewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? 'admin-chip admin-chip-active' : 'admin-chip admin-chip-inactive'}
              >
                {mode === 'day' ? 'Día' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <div>
          <h2 className="font-heading text-lg font-bold">{title}</h2>
          <p className="text-sm capitalize text-muted">{getPeriodLabel(currentDate, viewMode)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {viewModes.map((mode) => (
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
    </>
  );

  const renderDesktopModal = () => {
    if (!selectedDate || isMobile) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        onClick={closeDetail}
        role="dialog"
        aria-modal="true"
      >
        <div className="card w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading font-bold capitalize">
              {selectedDate.toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: TIMEZONE,
              })}
            </h3>
            <button
              type="button"
              onClick={closeDetail}
              className="text-muted hover:text-ink"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {selectedBookings.length === 0 ? (
            <p className="text-sm text-muted">Sin citas confirmadas.</p>
          ) : enableActions ? (
            <div className="space-y-2">
              {selectedBookings.map((booking) => (
                <BookingDayCard
                  key={booking.id}
                  booking={booking}
                  businessName={businessName}
                  whatsappTemplate={whatsappBookingTemplate}
                  onCancelled={handleBookingCancelled}
                  compact
                />
              ))}
            </div>
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

          {resolvedShowAgendaLink && (
            <a href="/admin/agenda" className="btn-primary block text-center">
              Ver agenda
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="card space-y-4">
      {renderToolbar()}

      {loading ? (
        <p className="text-sm text-muted">Cargando reservas...</p>
      ) : (
        <>
          {viewMode === 'month' && (
            <>
              {renderMonthViewMobile()}
              {renderMonthViewDesktop()}
            </>
          )}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      )}

      {selectedDate && isMobile && (
        <DayDetailSheet
          date={selectedDate}
          bookings={selectedBookings}
          businessName={businessName}
          whatsappTemplate={whatsappBookingTemplate}
          onClose={closeDetail}
          onCancelled={handleBookingCancelled}
          showAgendaLink={resolvedShowAgendaLink}
        />
      )}

      {renderDesktopModal()}
    </section>
  );
}
