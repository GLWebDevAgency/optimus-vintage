"use client";
/**
 * Panneau bas « plié » : se déplie depuis la charnière basse (rotateX), se referme par Échap,
 * clic sur le voile ou glissement de la poignée. Piège le focus et le restitue à la fermeture.
 */
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn.js";
import { EASE_FOLD, foldOrigin, foldPerspective, foldUp } from "../motion.js";

export interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  /** Pied fixe (boutons). */
  readonly footer?: ReactNode;
  readonly className?: string;
  /** Hauteur maximale (92dvh par défaut). */
  readonly maxHeight?: string;
  /** Empêche la fermeture par voile / Échap (confirmation obligatoire). */
  readonly dismissable?: boolean;
  /** Rendu dans un portail (`document.body`) ; sinon en place. */
  readonly portal?: boolean;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  maxHeight = "92dvh",
  dismissable = true,
  portal = true,
}: SheetProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    if (dismissable) onClose();
  }, [dismissable, onClose]);

  // Focus initial, restitution, verrou du défilement.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first =
        panel.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) =>
        !el.hasAttribute("hidden") &&
        el.getAttribute("aria-hidden") !== "true" &&
        !el.closest("[hidden]"),
    );
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === panelRef.current)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 600) close();
  };

  const node = (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={foldPerspective}>
          <motion.button
            type="button"
            aria-label="Fermer"
            tabIndex={-1}
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.24 }}
            className="absolute inset-0 cursor-default bg-[rgba(14,19,38,.45)] backdrop-blur-[2px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${id}-title` : undefined}
            aria-describedby={description ? `${id}-desc` : undefined}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            variants={reduced ? undefined : foldUp}
            initial={reduced ? { opacity: 0 } : "hidden"}
            animate={reduced ? { opacity: 1 } : "visible"}
            exit={reduced ? { opacity: 0 } : "exit"}
            transition={reduced ? { duration: 0.12 } : undefined}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragSnapToOrigin
            dragTransition={{ bounceStiffness: 400, bounceDamping: 32 }}
            onDragEnd={onDragEnd}
            style={{ ...foldOrigin, maxHeight }}
            className={cn(
              "relative flex w-full max-w-[560px] flex-col rounded-t-sheet border border-b-0 border-line bg-surface shadow-tag outline-none",
              "pb-safe",
              className,
            )}
          >
            <div
              className="flex cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
              aria-hidden="true"
            >
              <span className="h-1 w-9 rounded-full bg-line-2" />
            </div>
            {title || description ? (
              <header className="grid gap-1 px-5 pb-3 pt-1">
                {title ? (
                  <h2
                    id={`${id}-title`}
                    className="font-ui text-[18px] font-bold leading-tight tracking-[-.01em] text-ink"
                  >
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={`${id}-desc`} className="text-[13px] text-ink-2">
                    {description}
                  </p>
                ) : null}
              </header>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
            {footer ? (
              <footer className="border-t border-line bg-surface px-5 pb-4 pt-3">{footer}</footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  if (!portal || typeof document === "undefined") return node;
  return createPortal(node, document.body);
}

export { EASE_FOLD as sheetEase };
