import { useEffect, useState } from 'react';
import { ReservationsCalendar } from './ReservationsCalendar';

type Booking = {
  id: string;
  startAt: string;
  clientName: string;
  serviceName: string;
  status: string;
};

export function AdminDashboard() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const end = new Date(today);
    end.setHours(end.getHours() + 48);

    Promise.all([
      fetch(`/api/bookings?date=${dateStr}`),
      fetch(`/api/bookings?from=${today.toISOString()}&to=${end.toISOString()}`),
      fetch('/api/clients'),
    ]).then(async ([todayRes, upcomingRes, clientsRes]) => {
      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();
      const clientsData = await clientsRes.json();
      setTodayBookings(
        (todayData.bookings ?? []).filter((b: Booking) => b.status === 'confirmed'),
      );
      setUpcoming(
        (upcomingData.bookings ?? []).filter((b: Booking) => b.status === 'confirmed'),
      );
      setClientCount(clientsData.clients?.length ?? 0);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="font-heading text-4xl text-accent">{todayBookings.length}</p>
          <p className="text-sm text-muted">Citas hoy</p>
        </div>
        <div className="card text-center">
          <p className="font-heading text-4xl text-accent">{upcoming.length}</p>
          <p className="text-sm text-muted">Próximas 48h</p>
        </div>
        <div className="card text-center">
          <p className="font-heading text-4xl text-accent">{clientCount}</p>
          <p className="text-sm text-muted">Clientes</p>
        </div>
      </div>

      <ReservationsCalendar compact defaultView="week" title="Reservas" />

      <div className="flex flex-wrap gap-3">
        <a href="/admin/agenda" className="btn-primary">
          Ver agenda
        </a>
        <a href="/admin/disponibilidad" className="btn-secondary">
          Disponibilidad
        </a>
      </div>
    </div>
  );
}
