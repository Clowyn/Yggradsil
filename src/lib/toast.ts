import { useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ArcaneToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration: number;
}

type ToastListener = (toasts: ArcaneToastItem[]) => void;

let toastsState: ArcaneToastItem[] = [];
const listeners = new Set<ToastListener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function notifyListeners() {
  const snapshot = [...toastsState];
  listeners.forEach((listener) => listener(snapshot));
}

export function dismissToast(id: string): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toastsState = toastsState.filter((t) => t.id !== id);
  notifyListeners();
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  options?: { title?: string; duration?: number }
): string {
  const id = `arcane-toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const duration = options?.duration ?? 4500;

  const item: ArcaneToastItem = {
    id,
    message,
    type,
    title: options?.title,
    duration,
  };

  if (toastsState.length >= 5) {
    const evicted = toastsState.slice(0, toastsState.length - 4);
    for (const old of evicted) {
      const oldTimer = timers.get(old.id);
      if (oldTimer) {
        clearTimeout(oldTimer);
        timers.delete(old.id);
      }
    }
  }

  toastsState = [...toastsState.slice(-4), item];
  notifyListeners();

  if (duration > 0) {
    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    timers.set(id, timer);
  }

  return id;
}

export const arcaneToast = {
  show: showToast,
  success: (message: string, title?: string) => showToast(message, 'success', { title }),
  error: (message: string, title?: string) => showToast(message, 'error', { title }),
  warning: (message: string, title?: string) => showToast(message, 'warning', { title }),
  info: (message: string, title?: string) => showToast(message, 'info', { title }),
  arcane: (message: string, title?: string) => showToast(message, 'info', { title }),
  dismiss: dismissToast,
};

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toastsState]);
  return () => {
    listeners.delete(listener);
  };
}

export function useToast() {
  const toast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) =>
      showToast(message, type, { title }),
    []
  );

  return {
    toast,
    success: arcaneToast.success,
    error: arcaneToast.error,
    warning: arcaneToast.warning,
    info: arcaneToast.info,
    dismiss: dismissToast,
  };
}
