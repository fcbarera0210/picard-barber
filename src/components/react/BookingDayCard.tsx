import { formatDateTimeChile, formatTimeChile } from '../../lib/datetime';
import { buildBookingWhatsAppMessage, openWhatsAppUrl } from '../../lib/whatsapp';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { toast } from '../../lib/toast';
import { confirm } from '../../lib/confirm';

export type BookingCardData = {
  id: string;
  startAt: string;
  endAt?: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName: string;
};

type BookingDayCardProps = {
  booking: BookingCardData;
  businessName: string;
  whatsappTemplate: string | null;
  onCancelled?: () => void | Promise<void>;
  showContact?: boolean;
  compact?: boolean;
};

export function BookingDayCard({
  booking,
  businessName,
  whatsappTemplate,
  onCancelled,
  showContact = false,
  compact = false,
}: BookingDayCardProps) {
  const { run, isLoading } = useAsyncAction();
  const isConfirmed = booking.status === 'confirmed';
  const timeLabel = formatTimeChile(new Date(booking.startAt));
  const cancelling = isLoading(`cancel:${booking.id}`);

  async function cancelBooking() {
    const ok = await confirm({
      title: 'Cancelar cita',
      message: '¿Cancelar esta cita?',
      confirmLabel: 'Sí, cancelar',
      cancelLabel: 'No',
      variant: 'danger',
    });
    if (!ok) return;

    await run(`cancel:${booking.id}`, async () => {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, status: 'cancelled' }),
      });
      if (!res.ok) {
        toast.error('Error al cancelar la cita');
        return;
      }
      await onCancelled?.();
      toast.success('Cita cancelada correctamente');
    });
  }

  function handleWhatsApp() {
    if (!booking.clientPhone) return;
    const message = buildBookingWhatsAppMessage({
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      serviceName: booking.serviceName,
      startAt: new Date(booking.startAt),
      businessName,
      template: whatsappTemplate,
    });
    openWhatsAppUrl(booking.clientPhone, message);
  }

  if (compact) {
    return (
      <div className={`calendar-day-item flex flex-col gap-3 p-3`}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-h-11 min-w-[56px] shrink-0 rounded px-2 py-2 text-center font-mono text-xs font-bold text-bg bg-accent">
            {timeLabel}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{booking.clientName}</p>
            <p className="text-sm text-muted">{booking.serviceName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={isConfirmed ? 'status-confirmed text-sm' : 'status-cancelled text-sm'}>
            {isConfirmed ? 'Confirmada' : 'Cancelada'}
          </span>
          {isConfirmed && (
            <>
              {booking.clientPhone && (
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="min-h-11 rounded-lg bg-whatsapp px-4 py-2 text-sm font-medium text-white"
                >
                  WhatsApp
                </button>
              )}
              <button
                type="button"
                onClick={cancelBooking}
                disabled={cancelling}
                className="btn-secondary min-h-11 text-sm"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-day-item flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div className="min-h-11 min-w-[56px] shrink-0 rounded px-2 py-2 text-center font-mono text-xs font-bold text-bg bg-accent sm:py-1.5">
          {timeLabel}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{booking.clientName}</p>
          <p className="text-sm text-muted">{booking.serviceName}</p>
          <p className="text-sm text-muted">{formatDateTimeChile(new Date(booking.startAt))}</p>
          {showContact && (booking.clientEmail || booking.clientPhone) && (
            <p className="text-xs text-muted">
              {[booking.clientEmail, booking.clientPhone].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <span className={isConfirmed ? 'status-confirmed text-sm' : 'status-cancelled text-sm'}>
          {isConfirmed ? 'Confirmada' : 'Cancelada'}
        </span>
        {isConfirmed && (
          <>
            {booking.clientPhone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="min-h-11 rounded-lg bg-whatsapp px-4 py-2 text-sm font-medium text-white"
              >
                WhatsApp
              </button>
            )}
            <button
              type="button"
              onClick={cancelBooking}
              disabled={cancelling}
              className="btn-secondary min-h-11 text-sm"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
