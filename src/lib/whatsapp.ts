import { formatDateTimeChile } from './datetime';
import { formatPhoneForWhatsApp } from './phone';

type BookingWhatsAppInput = {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startAt: Date;
  businessName: string;
};

export function buildBookingWhatsAppMessage(input: BookingWhatsAppInput): string {
  const when = formatDateTimeChile(input.startAt);
  return (
    `Hola ${input.clientName}, te escribo de *${input.businessName}* ` +
    `respecto a tu cita de *${input.serviceName}* el ${when}.`
  );
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const formatted = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppUrl(phone: string, message: string): void {
  if (typeof window === 'undefined') return;
  window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer');
}
