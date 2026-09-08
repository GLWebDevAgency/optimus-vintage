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
import { cn } from "../cn";
import { AppIcon } from "../icons";
import { EASE_FOLD, EASE_OUT } from "../motion";

export type ToastKind = "info" | "success" | "error" | "offline";

export interface ToastOptions {
  readonly kind?: ToastKind;
  /** Durée en ms ; 0 = persistant. 3 600 ms par défaut. */
  readonly duration?: number;
  readonly action?: { readonly label: string; readonly onClick: () => void };
  readonly id?: string;
}
export interface ToastItem extends Required<Pick<ToastOptions, "id" | "kind" | "duration">> {
  readonly message: ReactNode;
  readonly action?: ToastOptions["action"];
}

interface ToastApi {
  readonly show: (message: ReactNode, opts?: ToastOptions) => string;
  readonly dismiss: (id: string) => void;
  readonly toasts: readonly ToastItem[];
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé sous <ToastProvider>");
  return ctx;
}

const icons: Record<ToastKind, ReactNode> = {
  info: <AppIcon name="info" size={18} />,
  success: <AppIcon name="check" size={18} />,
  error: <AppIcon name="alert" size={18} />,
  offline: <AppIcon name="cloudOff" size={18} />,
};

export interface ToastProviderProps {
  readonly children: ReactNode;
  /** Décalage bas (au-dessus de la barre d'onglets). */
  readonly bottomOffset?: string;
}

export function ToastProvider({
  children,
  bottomOffset = "calc(var(--tabbar-h) + var(--safe-bottom) + 8px)",
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: ReactNode, opts: ToastOptions = {}) => {
      const id = opts.id ?? `toast-${++counter.current}`;
      const item: ToastItem = {
        id,
        message,
        kind: opts.kind ?? "info",
        duration: opts.duration ?? 3600,
        ...(opts.action ? { action: opts.action } : {}),
      };
      setToasts((list) => [...list.filter((x) => x.id !== id), item].slice(-3));
      const prev = timers.current.get(id);
      if (prev) clearTimeout(prev);
      if (item.duration > 0)
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), item.duration),
        );
      return id;
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show, dismiss, toasts }), [show, dismiss, toasts]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} bottomOffset={bottomOffset} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
  bottomOffset,
}: {
  toasts: readonly ToastItem[];
  onDismiss: (id: string) => void;
  bottomOffset: string;
}) {
  const reduced = useReducedMotion();
  return (
    <section
      className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ bottom: bottomOffset }}
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduced}
            role={t.kind === "error" ? "alert" : "status"}
            aria-live={t.kind === "error" ? "assertive" : "polite"}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: EASE_OUT } }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.2, ease: EASE_FOLD } }
            }
            className={cn(
              "pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-[14px] border bg-surface px-3.5 py-3 shadow-tag",
              t.kind === "error"
                ? "border-thread/40"
                : t.kind === "success"
                  ? "border-brass/40"
                  : "border-line",
            )}
          >
            <span
              className={cn(
                "shrink-0",
                t.kind === "error" || t.kind === "offline"
                  ? "text-thread"
                  : t.kind === "success"
                    ? "text-brass"
                    : "text-indigo",
              )}
            >
              {icons[t.kind]}
            </span>
            <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-snug text-ink">
              {t.message}
            </span>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  onDismiss(t.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 font-ui text-[12.5px] font-bold text-thread focus-thread"
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Fermer"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 hover:text-ink focus-thread"
            >
              <AppIcon name="x" size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  );
}
