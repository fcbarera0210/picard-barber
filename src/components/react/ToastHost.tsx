import { useEffect, useState } from 'react';
import { getToasts, subscribeToasts, type ToastItem } from '../../lib/toast';

function ToastIcon({ type }: { type: ToastItem['type'] }) {
  if (type === 'success') return <span aria-hidden>✓</span>;
  if (type === 'error') return <span aria-hidden>!</span>;
  return <span aria-hidden>i</span>;
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>(getToasts);

  useEffect(() => subscribeToasts(() => setItems([...getToasts()])), []);

  if (items.length === 0) return null;

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div
          key={item.id}
          className={`toast toast-${item.type} ${item.exiting ? 'toast-exit' : 'toast-enter'}`}
          role="status"
        >
          <span className="toast-icon">
            <ToastIcon type={item.type} />
          </span>
          <p className="toast-message">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
