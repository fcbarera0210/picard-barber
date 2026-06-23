import { formatDateTimeChile } from './datetime';
import { formatPhoneForWhatsApp } from './phone';

export const DEFAULT_WHATSAPP_BOOKING_TEMPLATE =
  'Hola {nombre}, te escribo de *{negocio}* respecto a tu cita de *{servicio}* el {fecha}.';

export const DEFAULT_WHATSAPP_CLIENT_TEMPLATE =
  'Hola {nombre}, te escribo de *{negocio}*. ¿En qué puedo ayudarte?';

type TemplateVars = {
  nombre: string;
  negocio: string;
  servicio?: string;
  fecha?: string;
};

export function renderWhatsAppTemplate(
  template: string | null | undefined,
  vars: TemplateVars,
  fallback: string,
): string {
  const source = template?.trim() || fallback;
  return source
    .replaceAll('{nombre}', vars.nombre)
    .replaceAll('{negocio}', vars.negocio)
    .replaceAll('{servicio}', vars.servicio ?? '')
    .replaceAll('{fecha}', vars.fecha ?? '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

type BookingWhatsAppInput = {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startAt: Date;
  businessName: string;
  template?: string | null;
};

type ClientWhatsAppInput = {
  clientName: string;
  businessName: string;
  template?: string | null;
};

export function buildBookingWhatsAppMessage(input: BookingWhatsAppInput): string {
  return renderWhatsAppTemplate(
    input.template,
    {
      nombre: input.clientName,
      negocio: input.businessName,
      servicio: input.serviceName,
      fecha: formatDateTimeChile(input.startAt),
    },
    DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
  );
}

export function buildClientWhatsAppMessage(input: ClientWhatsAppInput): string {
  return renderWhatsAppTemplate(
    input.template,
    {
      nombre: input.clientName,
      negocio: input.businessName,
    },
    DEFAULT_WHATSAPP_CLIENT_TEMPLATE,
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
