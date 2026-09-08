"use client";
import type { ReactNode } from "react";
import { cn } from "../cn.js";
import { AppIcon } from "../icons.js";

export interface PhotoTileProps {
  readonly src?: string;
  readonly alt?: string;
  /** Marque la photo principale. */
  readonly primary?: boolean;
  readonly onRemove?: () => void;
  readonly onClick?: () => void;
  /** Couleur de fond pendant le chargement (blurhash rendu ailleurs, ou couleur unie). */
  readonly placeholder?: string;
  readonly loading?: boolean;
  readonly className?: string;
  readonly aspect?: "square" | "portrait";
  readonly children?: ReactNode;
}

/** Vignette photo carrée, coins 14 px, bouton de suppression 32 px (zone 44). */
export function PhotoTile({ src, alt = "", primary, onRemove, onClick, placeholder, loading, className, aspect = "square", children }: PhotoTileProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <div className={cn("relative overflow-hidden rounded-[14px] border border-line bg-surface-2", aspect === "square" ? "aspect-square" : "aspect-[3/4]", className)}>
      <Comp
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn("block h-full w-full", onClick && "focus-thread")}
        style={placeholder ? { backgroundColor: placeholder } : undefined}
        aria-label={onClick ? alt || "Voir la photo" : undefined}
      >
        {src ? <img src={src} alt={alt} className={cn("h-full w-full object-cover", loading && "opacity-60")} loading="lazy" /> : <span className="grid h-full w-full place-items-center text-ink-3"><AppIcon name="shirt" /></span>}
      </Comp>
      {loading ? <span className="absolute inset-x-0 h-[2px] bg-thread opacity-80 animate-scan" aria-hidden="true" /> : null}
      {primary ? <span className="absolute left-2 top-2 rounded-[6px] bg-ink px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-bg">Principale</span> : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retirer la photo"
          className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,.6))] focus-thread rounded-full"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ink/80">
            <AppIcon name="x" size={14} strokeWidth={2.2} />
          </span>
        </button>
      ) : null}
      {children}
    </div>
  );
}

export interface PhotoGridProps {
  readonly photos: ReadonlyArray<{ readonly id: string; readonly src: string; readonly alt?: string; readonly loading?: boolean }>;
  readonly onRemove?: (id: string) => void;
  readonly onOpen?: (id: string) => void;
  /** Bouton d'ajout (caméra / galerie). */
  readonly onAdd?: () => void;
  readonly addLabel?: string;
  readonly max?: number;
  readonly columns?: 3 | 4;
  readonly className?: string;
}

export function PhotoGrid({ photos, onRemove, onOpen, onAdd, addLabel = "Ajouter", max = 8, columns = 3, className }: PhotoGridProps) {
  const canAdd = onAdd && photos.length < max;
  return (
    <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-4", className)}>
      {photos.map((p, i) => (
        <PhotoTile key={p.id} src={p.src} alt={p.alt ?? ""} primary={i === 0} loading={p.loading ?? false} onRemove={onRemove ? () => onRemove(p.id) : undefined} onClick={onOpen ? () => onOpen(p.id) : undefined} />
      ))}
      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="grid aspect-square place-items-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-line-2 text-ink-2 transition-colors duration-state hover:border-ink hover:text-ink focus-thread"
        >
          <AppIcon name="camera" />
          <span className="font-ui text-[11px] font-semibold">{addLabel}</span>
          <span className="font-mono text-[9.5px] text-ink-3">
            {photos.length}/{max}
          </span>
        </button>
      ) : null}
    </div>
  );
}
