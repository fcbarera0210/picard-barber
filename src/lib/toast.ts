export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
};

export const TOAST_DURATION_MS = 3000;

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): ToastItem[] {
  return toasts;
}

function removeToast(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  toasts = toasts.filter((toast) => toast.id !== id);
  notify();
}

function dismissToast(id: string) {
  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast));
  notify();
  setTimeout(() => removeToast(id), 220);
}

export function showToast(
  message: string,
  type: ToastType = 'success',
  duration = TOAST_DURATION_MS,
) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, message }];
  notify();

  const timer = setTimeout(() => dismissToast(id), duration);
  timers.set(id, timer);
}

export const toast = {
  success: (message: string, duration = TOAST_DURATION_MS) => showToast(message, 'success', duration),
  error: (message: string, duration = TOAST_DURATION_MS) => showToast(message, 'error', duration),
  info: (message: string, duration = TOAST_DURATION_MS) => showToast(message, 'info', duration),
};
