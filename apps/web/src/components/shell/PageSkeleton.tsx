import { IconShirt } from "@/components/ui/Icons";

export type SkeletonVariant =
  | "today"
  | "chiner"
  | "item"
  | "sale"
  | "sources"
  | "list"
  | "settings"
  | "showcase";

interface PageSkeletonProps {
  variant: SkeletonVariant;
  /** Nombre de lignes pour les listes. */
  rows?: number;
}

const Sk = ({ w, h, className, r }: { w?: string; h?: string; className?: string; r?: string }) => (
  <span
    className={["sk block", className].filter(Boolean).join(" ")}
    style={{ width: w ?? "100%", height: h ?? "14px", borderRadius: r }}
    aria-hidden="true"
  />
);

function ListRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="list">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: squelette statique
        <div className="it" key={i}>
          <div className="thumb">
            <IconShirt />
          </div>
          <div className="grid gap-1.5">
            <Sk w={`${58 + ((i * 17) % 30)}%`} h="13px" />
            <Sk w="38%" h="10px" />
          </div>
          <Sk w="52px" h="14px" />
        </div>
      ))}
    </div>
  );
}

function TagRow() {
  return (
    <div className="tag-row">
      {["Stock", "En ligne", "Dormant"].map((k, i) => (
        <div className="tag swing" style={{ animationDelay: `${0.35 + i * 0.15}s` }} key={k}>
          <span className={`k${i === 2 ? " text-thread" : ""}`}>{k}</span>
          <div className="v">
            <Sk w="42px" h="24px" r="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StitchLine() {
  return (
    <div className="stitch-wrap">
      <div className="lbl">
        <Sk w="110px" h="10px" />
        <Sk w="34px" h="10px" />
      </div>
      <Sk h="6px" r="3px" />
    </div>
  );
}

function ReceiptSk({ lines = 4 }: { lines?: number }) {
  return (
    <div className="receipt">
      {Array.from({ length: lines }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: squelette statique
        <div key={i}>
          <Sk w="40%" h="11px" />
          <Sk w="48px" h="11px" />
        </div>
      ))}
      <div className="tot">
        <Sk w="46%" h="12px" />
        <Sk w="56px" h="12px" />
      </div>
    </div>
  );
}

/**
 * Squelettes fidèles aux maquettes (docs/design) : mêmes structures, mêmes rythmes d'entrée.
 * Le lead remplace chaque bloc par le composant alimenté, sans toucher à la mise en page.
 */
export function PageSkeleton({ variant, rows }: PageSkeletonProps) {
  switch (variant) {
    case "today":
      return (
        <>
          <div className="hero-kpi enter d2">
            <span className="k">Marge nette · ce mois</span>
            <div className="v">
              <Sk w="180px" h="48px" r="10px" />
              <small>€</small>
            </div>
            <Sk w="160px" h="12px" className="mt-1" />
          </div>
          <div className="enter d3">
            <StitchLine />
          </div>
          <TagRow />
          <div className="sec-h enter d5">
            <h2>Dernières ventes</h2>
            <span className="text-ink-2 text-xs font-semibold">Tout voir</span>
          </div>
          <div className="enter d6">
            <ListRows rows={rows ?? 3} />
          </div>
        </>
      );
    case "chiner":
      return (
        <>
          <div className="photo enter d2">
            <IconShirt size={72} className="text-ink-3 opacity-60" />
            <div className="scanline" />
            <div className="ai">
              <span className="l">Reconnu · —</span>
              <Sk w="70%" h="13px" />
            </div>
          </div>
          <div className="tape enter d3">
            <div className="val">
              <Sk w="64px" h="40px" r="8px" className="mx-auto" />
            </div>
            <div className="strip">
              <div className="ticks" />
              <div className="needle" />
            </div>
          </div>
          <div className="loc enter d4">
            <Sk w="14px" h="14px" r="50%" />
            <Sk w="60%" h="12px" />
          </div>
          <div className="mt-auto pt-4 enter d5">
            <button type="button" className="big-btn" disabled>
              Ajouter à la chine
            </button>
          </div>
        </>
      );
    case "item":
      return (
        <>
          <div className="hd enter d1">
            <Sk w="52%" h="10px" />
            <Sk w="82%" h="26px" className="mt-2" r="8px" />
          </div>
          <div className="face-sk enter d2">
            <div>
              <span className="k">Payé</span>
              <Sk w="70px" h="36px" r="8px" className="mt-1" />
            </div>
            <div className="grid gap-1.5 justify-items-end">
              <Sk w="96px" h="12px" />
              <Sk w="64px" h="11px" />
              <Sk w="88px" h="22px" r="7px" />
            </div>
          </div>
          <div className="meta enter d3">
            {["Taille", "État", "Matière", "Bac"].map((k) => (
              <div key={k}>
                <span className="k">{k}</span>
                <Sk w="60%" h="13px" className="mt-0.5" />
              </div>
            ))}
          </div>
          <div className="enter d4">
            <ReceiptSk lines={4} />
          </div>
          <div className="two-btn enter d5">
            <button type="button" className="b s" disabled>
              Mettre en ligne
            </button>
            <button type="button" className="b p" disabled>
              Vendre
            </button>
          </div>
        </>
      );
    case "sale":
      return (
        <>
          <div className="sale-hero enter d2">
            <div className="ring">
              <IconShirt size={56} className="text-indigo" />
            </div>
            <div className="stamp">Vendu</div>
            <Sk w="70%" h="12px" />
          </div>
          <div className="margin-card enter d3">
            <div className="top">
              <div>
                <span className="k">Marge nette</span>
                <div className="v">
                  <Sk w="90px" h="32px" r="8px" />
                </div>
              </div>
              <span className="pill sold">ROI —</span>
            </div>
            <Sk h="6px" r="3px" />
            <ReceiptSk lines={4} />
          </div>
          <div className="enter d5">
            <StitchLine />
          </div>
          <div className="two-btn enter d6">
            <button type="button" className="b s" disabled>
              Étiquette colis
            </button>
            <button type="button" className="b p" disabled>
              Nouvelle vente
            </button>
          </div>
        </>
      );
    case "sources":
      return (
        <>
          <div className="seg enter d2" role="tablist" aria-label="Filtrer les sources">
            {["Toutes", "Lots", "Palettes", "Chine"].map((s, i) => (
              <button type="button" key={s} role="tab" aria-selected={i === 0} aria-pressed={i === 0} disabled>
                {s}
              </button>
            ))}
          </div>
          {Array.from({ length: rows ?? 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: squelette statique
            <div className={`src enter d${Math.min(7, 3 + i)}`} key={i}>
              <div className="r1">
                <div className="grid gap-1.5">
                  <Sk w={`${120 + ((i * 23) % 60)}px`} h="14px" />
                  <Sk w="140px" h="10px" />
                </div>
                <Sk w="54px" h="22px" r="6px" />
              </div>
              <Sk h="6px" r="3px" />
              <div className="foot">
                <Sk w="110px" h="10px" />
                <Sk w="120px" h="10px" />
              </div>
            </div>
          ))}
        </>
      );
    case "settings":
      return (
        <>
          <div className="card enter d2 flex items-center gap-3">
            <span className="avatar" aria-hidden="true">
              ·
            </span>
            <div className="grid gap-1.5 flex-1">
              <Sk w="45%" h="14px" />
              <Sk w="65%" h="11px" />
            </div>
          </div>
          <div className="enter d3">
            <ListRows rows={rows ?? 4} />
          </div>
        </>
      );
    case "showcase":
      return (
        <div className="card enter d2 grid place-items-center min-h-40 text-ink-3 text-sm">showcase</div>
      );
    default:
      return (
        <>
          <div className="seg enter d2" aria-hidden="true">
            {["Tous", "En stock", "En ligne", "Dormant"].map((s, i) => (
              <button type="button" key={s} aria-pressed={i === 0} disabled>
                {s}
              </button>
            ))}
          </div>
          <div className="enter d3">
            <ListRows rows={rows ?? 6} />
          </div>
        </>
      );
  }
}
