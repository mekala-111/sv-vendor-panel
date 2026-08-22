"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./toast.module.css";

export type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  leaving?: boolean;
};

type ToastApi = {
  push: (message: string, kind?: ToastKind, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

let externalApi: ToastApi | null = null;

export function toast(message: string, kind: ToastKind = "info", durationMs = 3200) {
  externalApi?.push(message, kind, durationMs);
}

toast.success = (message: string, durationMs = 3200) => toast(message, "success", durationMs);
toast.error = (message: string, durationMs = 4200) => toast(message, "error", durationMs);
toast.info = (message: string, durationMs = 2800) => toast(message, "info", durationMs);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
      const handle = timers.current.get(id);
      if (handle) {
        window.clearTimeout(handle);
        timers.current.delete(id);
      }
    }, 160);
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "info", durationMs = 3200) => {
      const text = String(message || "").trim();
      if (!text) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev.slice(-4), { id, kind, message: text }]);
      const handle = window.setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, handle);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (message, durationMs) => push(message, "success", durationMs ?? 3200),
      error: (message, durationMs) => push(message, "error", durationMs ?? 4200),
      info: (message, durationMs) => push(message, "info", durationMs ?? 2800),
    }),
    [push]
  );

  useEffect(() => {
    externalApi = api;
    return () => {
      if (externalApi === api) externalApi = null;
    };
  }, [api]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const handle of map.values()) window.clearTimeout(handle);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.toast} ${styles[item.kind]}`}
            data-leaving={item.leaving ? "true" : undefined}
            role="status"
          >
            <span className={styles.dot} aria-hidden />
            <span className={styles.message}>{item.message}</span>
            <button
              type="button"
              className={styles.close}
              aria-label="Dismiss"
              data-toast-skip
              onClick={() => dismiss(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: toast,
      success: toast.success,
      error: toast.error,
      info: toast.info,
    } satisfies ToastApi;
  }
  return ctx;
}
