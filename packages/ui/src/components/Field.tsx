"use client";
import {
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  createContext,
  useContext,
  useId,
  useState,
} from "react";
import { cn } from "../cn.js";
import { AppIcon } from "../icons.js";

interface FieldCtx {
  readonly id: string;
  readonly describedBy: string | undefined;
  readonly invalid: boolean;
  readonly disabled: boolean;
}
const FieldContext = createContext<FieldCtx | null>(null);
export const useField = () => useContext(FieldContext);

export interface FieldProps {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
  /** Contenu à droite du libellé (ex. « facultatif », lien). */
  readonly trailing?: ReactNode;
}

/** Libellé mono capitale + contrôle + aide / erreur. Les contrôles enfants héritent id et aria. */
export function Field({ label, hint, error, required, disabled = false, children, className, trailing }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), disabled }}>
      <div className={cn("grid gap-1.5", className)}>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[.14em] text-ink-3">
            {label}
            {required ? <span className="text-thread"> *</span> : null}
          </label>
          {trailing ? <span className="font-mono text-[10px] tracking-[.08em] text-ink-3">{trailing}</span> : null}
        </div>
        {children}
        {error ? (
          <p id={errorId} role="alert" className="text-[12.5px] font-medium text-thread">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-[12.5px] text-ink-2">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/** Enveloppe visuelle `.in` : bordure, fond, focus indigo, erreur fil. */
export const controlClass = (invalid: boolean, extra?: string) =>
  cn(
    "flex min-h-[46px] w-full items-center gap-2 rounded-field border-[1.5px] bg-bg px-3 font-ui text-[15px] font-medium text-ink",
    "transition-[border-color,box-shadow] duration-state",
    "has-[:focus-visible]:border-ink has-[:focus-visible]:shadow-[0_0_0_3px_var(--indigo-soft)]",
    "has-[:disabled]:opacity-50",
    invalid ? "border-thread" : "border-line-2",
    extra,
  );

const bare = "min-w-0 flex-1 bg-transparent py-2.5 outline-none placeholder:text-ink-3 disabled:cursor-not-allowed";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  readonly unit?: ReactNode;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
  readonly className?: string;
  readonly invalid?: boolean;
}

export function TextInput({ unit, leading, trailing, className, invalid, id, disabled, ...rest }: TextInputProps) {
  const field = useField();
  return (
    <div className={controlClass(invalid ?? field?.invalid ?? false, className)}>
      {leading ? <span className="text-ink-3">{leading}</span> : null}
      <input
        id={id ?? field?.id}
        aria-describedby={rest["aria-describedby"] ?? field?.describedBy}
        aria-invalid={invalid ?? field?.invalid ? true : undefined}
        disabled={disabled ?? field?.disabled}
        className={bare}
        {...rest}
      />
      {unit ? <span className="font-mono text-[12px] text-ink-3">{unit}</span> : null}
      {trailing}
    </div>
  );
}

/* ───────────── MoneyInput ───────────── */

const MINOR_UNITS: Record<string, number> = { JPY: 0 };
const digitsFor = (currency: string) => MINOR_UNITS[currency] ?? 2;
const SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", JPY: "¥" };

/** « 12,50 » | « 12.5 » | « 1 234,00 » → unités mineures ; `null` si vide, `undefined` si invalide. */
export function parseMoneyInput(raw: string, currency = "EUR"): number | null | undefined {
  const cleaned = raw.replace(/[\s  ]/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "-") return null;
  if (!/^-?\d*(\.\d*)?$/.test(cleaned) || cleaned === "." || cleaned === "-.") return undefined;
  const digits = digitsFor(currency);
  const [int = "0", frac = ""] = cleaned.replace(/^-/, "").split(".");
  if (frac.length > digits) return undefined;
  const minor = Number(int) * 10 ** digits + Number((frac + "0".repeat(digits)).slice(0, digits) || "0");
  return cleaned.startsWith("-") ? -minor : minor;
}

/** Unités mineures → texte de saisie localisé (virgule en fr). */
export function formatMoneyInput(minor: number | null, currency = "EUR", locale = "fr"): string {
  if (minor === null) return "";
  const digits = digitsFor(currency);
  const amount = minor / 10 ** digits;
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }).format(amount);
}

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "size" | "type"> {
  readonly valueMinor: number | null;
  readonly onChangeMinor: (minor: number | null) => void;
  readonly currency?: string;
  readonly locale?: string;
  readonly className?: string;
  readonly invalid?: boolean;
  /** Autoriser un montant négatif (non par défaut). */
  readonly allowNegative?: boolean;
}

/** Saisie d'un montant avec virgule décimale française ; renvoie des unités mineures entières. */
export function MoneyInput({ valueMinor, onChangeMinor, currency = "EUR", locale = "fr", className, invalid, allowNegative, id, disabled, onBlur, onFocus, ...rest }: MoneyInputProps) {
  const field = useField();
  const [text, setText] = useState(() => formatMoneyInput(valueMinor, currency, locale));
  const [focused, setFocused] = useState(false);
  const [bad, setBad] = useState(false);
  // Hors focus, on reflète la valeur contrôlée ; pendant la saisie, le texte tapé fait foi.
  const shown = focused ? text : formatMoneyInput(valueMinor, currency, locale);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setText(next);
    const parsed = parseMoneyInput(next, currency);
    if (parsed === undefined || (!allowNegative && parsed !== null && parsed < 0)) {
      setBad(next.trim() !== "");
      return;
    }
    setBad(false);
    onChangeMinor(parsed);
  };
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setText(formatMoneyInput(valueMinor, currency, locale));
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    setBad(false);
    onBlur?.(e);
  };
  const isInvalid = invalid ?? (bad || field?.invalid) ?? false;
  return (
    <div className={controlClass(isInvalid, className)}>
      <input
        id={id ?? field?.id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-describedby={rest["aria-describedby"] ?? field?.describedBy}
        aria-invalid={isInvalid || undefined}
        disabled={disabled ?? field?.disabled}
        value={shown}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={rest.placeholder ?? formatMoneyInput(0, currency, locale)}
        className={cn(bare, "tabular")}
        {...rest}
      />
      <span className="font-mono text-[12px] text-ink-3">{SYMBOL[currency] ?? currency}</span>
    </div>
  );
}

/* ───────────── Select ───────────── */

export interface SelectOption<V extends string = string> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
}
export interface SelectProps<V extends string = string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "value" | "onChange"> {
  readonly options: readonly SelectOption<V>[];
  readonly value: V | "";
  readonly onChange: (value: V) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly invalid?: boolean;
}

export function Select<V extends string = string>({ options, value, onChange, placeholder, className, invalid, id, disabled, ...rest }: SelectProps<V>) {
  const field = useField();
  return (
    <div className={controlClass(invalid ?? field?.invalid ?? false, cn("relative pr-9", className))}>
      <select
        id={id ?? field?.id}
        aria-describedby={rest["aria-describedby"] ?? field?.describedBy}
        aria-invalid={invalid ?? field?.invalid ? true : undefined}
        disabled={disabled ?? field?.disabled}
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        className={cn(bare, "appearance-none", value === "" && "text-ink-3")}
        {...rest}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <AppIcon name="chevronDown" size={18} className="pointer-events-none absolute right-3 text-ink-3" />
    </div>
  );
}

/* ───────────── Textarea ───────────── */

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  readonly className?: string;
  readonly invalid?: boolean;
}

export function Textarea({ className, invalid, id, disabled, rows = 3, ...rest }: TextareaProps) {
  const field = useField();
  return (
    <div className={controlClass(invalid ?? field?.invalid ?? false, cn("items-stretch py-0", className))}>
      <textarea
        id={id ?? field?.id}
        rows={rows}
        aria-describedby={rest["aria-describedby"] ?? field?.describedBy}
        aria-invalid={invalid ?? field?.invalid ? true : undefined}
        disabled={disabled ?? field?.disabled}
        className={cn(bare, "resize-y leading-[1.45]")}
        {...rest}
      />
    </div>
  );
}
