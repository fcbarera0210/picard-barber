import { formatDateKeyInChile, endOfDay, startOfDay } from './datetime';

export type CalendarViewMode = 'day' | 'week' | 'month';

export function formatDateKey(date: Date): string {
  return formatDateKeyInChile(date);
}

export function isSameDay(a: Date, b: Date): boolean {
  return formatDateKey(a) === formatDateKey(b);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getMonthGridDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const days: Date[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day));
  }
  return days;
}

export function getPeriodLabel(date: Date, viewMode: CalendarViewMode): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  if (viewMode === 'day') {
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Santiago',
    });
  }

  if (viewMode === 'week') {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.getDate()} – ${end.getDate()} de ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
  }

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function getFetchRange(currentDate: Date, viewMode: CalendarViewMode): { from: Date; to: Date } {
  if (viewMode === 'day') {
    const dateKey = formatDateKey(currentDate);
    return { from: startOfDay(dateKey), to: endOfDay(dateKey) };
  }

  if (viewMode === 'week') {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return {
      from: startOfDay(formatDateKey(start)),
      to: endOfDay(formatDateKey(end)),
    };
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthGridDays(year, month);
  return {
    from: startOfDay(formatDateKey(days[0])),
    to: endOfDay(formatDateKey(days[days.length - 1])),
  };
}
