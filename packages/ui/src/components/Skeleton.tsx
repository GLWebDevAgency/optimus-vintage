import { cn } from "../cn";

export type SkeletonShape =
  | "text"
  | "title"
  | "label"
  | "circle"
  | "thumb"
  | "card"
  | "row"
  | "tag"
  | "button"
  | "hero";

export interface SkeletonProps {
  readonly shape?: SkeletonShape;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly className?: string;
  /** Nombre de répétitions (lignes de texte, lignes de liste). */
  readonly count?: number;
}

const shapes: Record<SkeletonShape, string> = {
  text: "h-[13px] w-full rounded-[4px]",
  title: "h-[20px] w-2/3 rounded-[5px]",
  label: "h-[10px] w-24 rounded-[3px]",
  circle: "h-8 w-8 rounded-full",
  thumb: "h-[38px] w-[38px] rounded-[9px]",
  card: "h-[120px] w-full rounded-card",
  row: "h-[60px] w-full rounded-none",
  tag: "h-[92px] w-full rounded-[12px_12px_14px_14px]",
  button: "h-11 w-full rounded-field",
  hero: "h-[54px] w-48 rounded-[8px]",
};

/** Miroitement calico : un reflet passe sur des formes qui reprennent celles du contenu. */
export function Skeleton({ shape = "text", width, height, className, count = 1 }: SkeletonProps) {
  const style = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };
  const one = (key: number) => (
    <span
      key={key}
      aria-hidden="true"
      style={style}
      className={cn(
        "block animate-shimmer bg-[linear-gradient(90deg,var(--surface-2)_0%,var(--bg-2)_40%,var(--surface-2)_80%)] bg-[length:200%_100%]",
        shapes[shape],
        className,
      )}
    />
  );
  if (count === 1) return one(0);
  return (
    <span
      className={cn(
        "grid",
        shape === "row"
          ? "divide-y divide-line overflow-hidden rounded-card border border-line"
          : "gap-2",
      )}
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => one(i))}
    </span>
  );
}

/** Ligne de liste squelette (vignette + deux lignes + montant). */
export function SkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
      role="status"
      aria-busy="true"
      aria-label="Chargement"
    >
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lignes identiques et statiques
        <div key={i} className="grid grid-cols-[38px_1fr_auto] items-center gap-3 px-3.5 py-[11px]">
          <Skeleton shape="thumb" />
          <span className="grid gap-1.5">
            <Skeleton shape="text" width="60%" />
            <Skeleton shape="label" />
          </span>
          <Skeleton shape="text" width={48} />
        </div>
      ))}
    </div>
  );
}
