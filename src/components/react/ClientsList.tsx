import { useEffect, useState } from 'react';
import { formatPhoneDisplay } from '../../lib/phone';

type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastBookingAt: string | null;
  confirmedCount: number;
};

export function ClientsList() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-muted">Cargando clientes...</p>;

  if (clients.length === 0) {
    return <p className="text-muted">Aún no hay clientes registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="pb-3 pr-4">Nombre</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Teléfono</th>
            <th className="pb-3 pr-4">Citas</th>
            <th className="pb-3">Última visita</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-border/50">
              <td className="py-3 pr-4 font-medium">{c.name}</td>
              <td className="py-3 pr-4 text-muted">{c.email}</td>
              <td className="py-3 pr-4">{formatPhoneDisplay(c.phone)}</td>
              <td className="py-3 pr-4">{c.totalBookings}</td>
              <td className="py-3 text-muted">
                {c.lastBookingAt
                  ? new Date(c.lastBookingAt).toLocaleDateString('es-CL')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
