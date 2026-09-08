"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastTone = "ink" | "thread" | "brass";
export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Durée en ms (défaut 3 200). */
  duration?: number;
}
interface ToastItem extends Required<Pick<ToastOptions, "title" | "tone">> {
  id: number;
  description?: string;
}
interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {}, dismiss: () => {} });

/**
 * Toasts « stub » : pile en bas d'écran (au-dessus de la barre d'onglets), un seul style, sortie
 * automatique. TODO(lead): remplacer par le composant Toast de `@chine/ui` quand il existera.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const reduce = useReducedMotion();

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = ++seq.current;
      const item: ToastItem = {
        id,
        title: opts.title,
        tone: opts.tone ?? "ink",
        ...(opts.description ? { description: opts.description } : {}),
      };
      setItems((xs) => [...xs.slice(-2), item]);
      window.setTimeout(() => dismiss(id), opts.duration ?? 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className={`toast tone-${t.tone}`}
              role="status"
            >
              <b>{t.title}</b>
              {t.description ? <span>{t.description}</span> : null}
              <button
                type="button"
                className="toast-x"
                onClick={() => dismiss(t.id)}
                aria-label="Fermer"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = (): ToastContextValue => useContext(ToastContext);
