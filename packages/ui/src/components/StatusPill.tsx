import type { ReactNode } from "react";
import { cn } from "../cn";

export type PillStatus =
  | "stock"
  | "online"
  | "reserved"
  | "sold"
  | "dormant"
  | "returned"
  | "lost"
  | "donated"
  | "pending"
  | "amortized";

const styles: Record<PillStatus, string> = {
  stock: "bg-chalk text-indigo",
  online: "bg-indigo-soft text-indigo",
  reserved: "bg-surface-2 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]",
  sold: "bg-brass-soft text-brass",
  amortized: "bg-brass-soft text-brass",
  dormant: "bg-thread-soft text-thread",
  returned: "bg-surface-2 text-ink-2 shadow-[inset_0_0_0_1px_var(--line-2)]",
  lost: "bg-transparent text-ink-3 shadow-[inset_0_0_0_1.5px_var(--line-2)]",
  donated: "bg-transparent text-ink-3 shadow-[inset_0_0_0_1.5px_var(--line-2)]",
  pending: "bg-transparent text-thread shadow-[inset_0_0_0_1.5px_var(--thread)]",
};

const FR: Record<PillStatus, string> = {
  stock: "En stock",
  online: "En ligne",
  reserved: "Réservée",
  sold: "Vendue",
  amortized: "Amortie",
  dormant: "Dormant",
  returned: "Retournée",
  lost: "Perdue",
  donated: "Donnée",
  pending: "En attente",
};

/** Statut d'une pièce → pastille. */
export const pillStatusOf = (status: string, dormant = false): PillStatus => {
  if (dormant && (status === "IN_STOCK" || status === "LISTED")) return "dormant";
  switch (status) {
    case "IN_STOCK":
      return "stock";
    case "LISTED":
      return "online";
    case "RESERVED":
      return "reserved";
    case "SOLD":
      return "sold";
    case "RETURNED":
      return "returned";
    case "LOST":
      return "lost";
    case "DONATED":
      return "donated";
    default:
      return "stock";
  }
};

export interface StatusPillProps {
  readonly status: PillStatus;
  /** Libellé traduit ; français par défaut. */
  readonly label?: ReactNode;
  readonly className?: string;
  /** Sans le point. */
  readonly dotless?: boolean;
}

export function StatusPill({ status, label, className, dotless }: StatusPillProps) {
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 font-ui text-[11px] font-semibold tracking-[.04em] whitespace-nowrap",
        !dotless &&
          "before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']",
        styles[status],
        className,
      )}
    >
      {label ?? FR[status]}
    </span>
  );
}
