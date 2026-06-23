import { useEffect, useState } from 'react';
import {
  getPendingConfirm,
  resolveConfirm,
  subscribeConfirm,
  type ConfirmOptions,
} from '../../lib/confirm';

export function ConfirmHost() {
  const [, tick] = useState(0);
  const pending = getPendingConfirm();

  useEffect(() => subscribeConfirm(() => tick((n) => n + 1)), []);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pending?.id]);

  if (!pending) return null;

  return (
    <div
      className="confirm-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
      onClick={() => resolveConfirm(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="card w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {pending.title && (
          <h2 id="confirm-dialog-title" className="font-heading text-lg font-bold">
            {pending.title}
          </h2>
        )}
        <p className="text-sm text-muted">{pending.message}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => resolveConfirm(false)}
            className="btn-secondary min-h-11 px-4"
          >
            {pending.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => resolveConfirm(true)}
            className={
              pending.variant === 'danger'
                ? 'min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500'
                : 'btn-primary min-h-11 px-4'
            }
          >
            {pending.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ConfirmOptions };

export { requestConfirm as useConfirmAction } from '../../lib/confirm';
