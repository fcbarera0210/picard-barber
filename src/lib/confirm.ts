export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
};

type ConfirmRequest = ConfirmOptions & {
  id: string;
  resolve: (value: boolean) => void;
};

let pending: ConfirmRequest | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeConfirm(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingConfirm(): ConfirmRequest | null {
  return pending;
}

export function requestConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    pending = { ...options, id: crypto.randomUUID(), resolve };
    notify();
  });
}

export function resolveConfirm(result: boolean) {
  if (!pending) return;
  const { resolve } = pending;
  pending = null;
  notify();
  resolve(result);
}

export const confirm = requestConfirm;
