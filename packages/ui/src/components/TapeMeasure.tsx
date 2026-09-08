"use client";
/**
 * Mètre-ruban : saisie d'un prix en faisant glisser le ruban sous l'aiguille rouge.
 * Traits tous les 1 (12 px), grands traits tous les 5, accroche sur l'unité, retour haptique.
 * Contrôlé en unités mineures. Clavier : ← → ±1, PageUp/Down ±5, Home/End.
 */
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { cn } from "../cn.js";
import { EASE_OUT } from "../motion.js";

const PX_PER_UNIT = 12;
const BIG_EVERY = 5;
const MINOR_UNITS: Record<string, number> = { JPY: 0 };
const SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF",
  CAD: "CA$",
  AUD: "A$",
};

export interface TapeMeasureProps {
  readonly valueMinor: number;
  readonly onChange: (minor: number) => void;
  readonly currency?: string;
  /** Bornes en unités majeures (0 … 999 par défaut). */
  readonly min?: number;
  readonly max?: number;
  /** Pas d'accroche en unités majeures (1 par défaut). */
  readonly step?: number;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly className?: string;
  /** Vibration à chaque unité franchie (4 ms) ; activée par défaut. */
  readonly haptics?: boolean;
  /** Masque la grande valeur (quand elle est affichée ailleurs). */
  readonly hideValue?: boolean;
  readonly locale?: string;
}

const vibrate = (ms: number) => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignoré */
    }
  }
};

export function TapeMeasure({
  valueMinor,
  onChange,
  currency = "EUR",
  min = 0,
  max = 999,
  step = 1,
  label = "Prix payé",
  disabled,
  className,
  haptics = true,
  hideValue,
  locale = "fr",
}: TapeMeasureProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const digits = MINOR_UNITS[currency] ?? 2;
  const factor = 10 ** digits;
  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const snap = useCallback((v: number) => clamp(Math.round(v / step) * step), [clamp, step]);

  const value = useMotionValue(clamp(valueMinor / factor));
  const stripRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [shown, setShown] = useState(() => snap(valueMinor / factor));
  const lastEmitted = useRef(snap(valueMinor / factor));
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startValue: number;
    lastX: number;
    lastT: number;
    vx: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Pendant un réglage programmé (clavier, molette), le ruban rattrape la valeur sans émettre les intermédiaires.
  const suppress = useRef(false);

  // Largeur de la piste (ResizeObserver si dispo).
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    setWidth(el.clientWidth || 320);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 320));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Valeur contrôlée → ruban (hors interaction).
  useEffect(() => {
    const target = clamp(valueMinor / factor);
    if (drag.current) return;
    if (Math.abs(value.get() - target) < 1e-6) return;
    lastEmitted.current = snap(target);
    setShown(snap(target));
    if (reduced) value.set(target);
    else animate(value, target, { duration: 0.42, ease: EASE_OUT });
  }, [valueMinor, factor, clamp, snap, value, reduced]);

  // Ruban → valeur affichée, haptique et émission quand l'unité change.
  useMotionValueEvent(value, "change", (v) => {
    if (suppress.current) return;
    const s = snap(v);
    if (s !== lastEmitted.current) {
      lastEmitted.current = s;
      setShown(s);
      if (haptics) vibrate(4);
      onChange(Math.round(s * factor));
    }
  });

  const center = width / 2;
  // Position de la couche : l'origine (valeur 0) est à center − value·px.
  const layerX = useTransform(value, (v) => center - v * PX_PER_UNIT);
  // Traits : motif répété, décalé modulo la période des grands traits.
  const period = BIG_EVERY * PX_PER_UNIT;
  const ticksX = useTransform(layerX, (x) => (((x % period) + period) % period) - period);
  // Étiquettes : fenêtre de nombres autour de la valeur (re-rendue seulement quand le bucket change).
  const bucketCount = Math.ceil(width / period) + 2;
  const bucket = Math.floor(shown / BIG_EVERY);
  const labels: number[] = [];
  for (let n = bucket - bucketCount; n <= bucket + bucketCount; n++) {
    const unit = n * BIG_EVERY;
    if (unit >= min && unit <= max) labels.push(unit);
  }

  /** Relâchement du ruban : on le lance selon la vitesse puis il s'accroche sur l'unité (émissions intermédiaires + haptique). */
  const settle = (target: number, velocity = 0) => {
    const t = snap(target);
    suppress.current = false;
    if (reduced) {
      value.set(t);
      return;
    }
    animate(value, t, {
      type: "spring",
      stiffness: 260,
      damping: 30,
      velocity: -velocity / PX_PER_UNIT,
      restDelta: 0.001,
    });
  };

  /** Réglage direct (clavier, molette) : la valeur est émise tout de suite, le ruban rattrape visuellement. */
  const commit = (target: number) => {
    const t = snap(target);
    if (t !== lastEmitted.current) {
      lastEmitted.current = t;
      setShown(t);
      if (haptics) vibrate(4);
      onChange(Math.round(t * factor));
    }
    if (reduced) {
      value.set(t);
      return;
    }
    suppress.current = true;
    value.stop();
    const controls = animate(value, t, { duration: 0.28, ease: EASE_OUT });
    controls.then(() => {
      suppress.current = false;
    });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    value.stop();
    suppress.current = false;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startValue: value.get(),
      lastX: e.clientX,
      lastT: performance.now(),
      vx: 0,
    };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.vx = 0.7 * d.vx + 0.3 * ((e.clientX - d.lastX) / dt) * 1000; // px/s lissé
    d.lastX = e.clientX;
    d.lastT = now;
    const dx = e.clientX - d.startX;
    value.set(clamp(d.startValue - dx / PX_PER_UNIT));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    // Projection : on lance le ruban selon la vitesse, puis on l'accroche sur l'unité.
    const projected = value.get() - (d.vx * 0.18) / PX_PER_UNIT;
    settle(clamp(projected), d.vx);
  };
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (disabled) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!delta) return;
    commit(clamp(lastEmitted.current + Math.sign(delta) * step));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const cur = lastEmitted.current;
    const map: Record<string, number | undefined> = {
      ArrowRight: cur + step,
      ArrowUp: cur + step,
      ArrowLeft: cur - step,
      ArrowDown: cur - step,
      PageUp: cur + step * BIG_EVERY,
      PageDown: cur - step * BIG_EVERY,
      Home: min,
      End: max,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    commit(clamp(next));
  };

  const fmt = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  const symbol = SYMBOL[currency] ?? currency;

  return (
    <div className={cn("grid w-full gap-2 select-none", disabled && "opacity-50", className)}>
      {!hideValue ? (
        <div
          className="text-center font-display italic text-[44px] leading-none text-ink tabular"
          aria-hidden="true"
        >
          {fmt.format(shown)}
          <span className="ml-1 font-ui not-italic text-[16px] font-semibold text-ink-2">
            {symbol}
          </span>
        </div>
      ) : null}
      <div
        ref={stripRef}
        id={id}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={shown}
        aria-valuetext={`${fmt.format(shown)} ${symbol}`}
        aria-disabled={disabled || undefined}
        aria-orientation="horizontal"
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        className={cn(
          "relative h-[54px] overflow-hidden rounded-[10px] border border-line bg-surface touch-pan-y focus-thread",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{ touchAction: "pan-y" }}
      >
        {/* Traits */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 left-0"
          style={{
            x: ticksX,
            width: width + period * 2,
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--ink) 0 1.5px, transparent 1.5px 12px), repeating-linear-gradient(90deg, var(--ink) 0 1.5px, transparent 1.5px 60px)",
            backgroundSize: "100% 12px, 100% 24px",
            backgroundPosition: "0 100%, 0 100%",
            backgroundRepeat: "no-repeat, no-repeat",
            opacity: 0.85,
          }}
        />
        {/* Nombres */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0"
          style={{ x: layerX }}
        >
          {labels.map((u) => (
            <span
              key={u}
              className="absolute top-1.5 -translate-x-1/2 font-mono text-[10px] text-ink-3 tabular"
              style={{ left: u * PX_PER_UNIT }}
            >
              {u}
            </span>
          ))}
        </motion.div>
        {/* Aiguille */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-thread"
        >
          <span className="absolute -top-px left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[7px] border-t-thread" />
        </div>
        {/* Fondu des bords */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent"
        />
      </div>
    </div>
  );
}
