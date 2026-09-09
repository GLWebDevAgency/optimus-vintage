"use client";

import type { ListingCopyDto, Platform } from "@chine/contract";
import { AppIcon, Button, ChipGroup, useToast } from "@chine/ui";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/hooks/i18n";
import { label } from "./labels";

const PLATFORMS: readonly Platform[] = ["VINTED", "VESTIAIRE", "LEBONCOIN", "EBAY"];

/** Adaptation légère par plateforme : longueur du titre, hashtags ou non. */
export function adaptListingCopy(copy: ListingCopyDto, platform: Platform) {
  const maxTitle = platform === "VINTED" ? 70 : platform === "EBAY" ? 80 : 120;
  const title =
    copy.title.length > maxTitle ? `${copy.title.slice(0, maxTitle - 1).trimEnd()}…` : copy.title;
  const hashtags = platform === "LEBONCOIN" || platform === "VESTIAIRE" ? [] : copy.hashtags;
  const description = hashtags.length
    ? `${copy.description}\n\n${hashtags.join(" ")}`
    : copy.description;
  return { title, description, hashtags };
}

/**
 * Texte d'annonce généré par l'expert IA : titre, description et hashtags, adaptés à la
 * plateforme choisie, copiables en un geste. Sans texte (formule gratuite) : invitation sobre.
 */
export function ListingCopyCard({
  copy,
  locked,
  compact,
}: {
  copy: ListingCopyDto | null | undefined;
  /** Le plan n'inclut pas les textes d'annonce. */
  locked?: boolean;
  compact?: boolean;
}) {
  const t = useT();
  const { show } = useToast();
  const [platform, setPlatform] = useState<Platform>("VINTED");
  if (!copy) {
    if (!locked) return null;
    return (
      <div className="card flex items-center gap-3" data-testid="listing-copy-locked">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-soft text-brass">
          <AppIcon name="lock" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">{t("listingCopy.title")}</div>
          <div className="text-[12.5px] text-ink-2">{t("listingCopy.lockedBody")}</div>
        </div>
        <Link
          href="/app/reglages#plan"
          className="btn ghost !min-h-[36px] !px-3 !text-[12px] shrink-0"
        >
          {t("billing.plan.PREMIUM")}
        </Link>
      </div>
    );
  }
  const adapted = adaptListingCopy(copy, platform);
  const copyText = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      show(t("listingCopy.copied", { what }), { kind: "success", duration: 1800 });
    } catch {
      show(t("listingCopy.copyFailed"), { kind: "error" });
    }
  };
  return (
    <div className="card grid gap-3" data-testid="listing-copy">
      <div className="flex items-center justify-between gap-2">
        <span className="label">{t("listingCopy.title")}</span>
        <ChipGroup
          value={platform}
          onChange={(p) => p && setPlatform(p)}
          allowEmpty={false}
          size="sm"
          scroll
          aria-label={t("sales.platform")}
          options={PLATFORMS.map((p) => ({ value: p, label: label.platform(t, p) }))}
        />
      </div>
      <div className="grid gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold leading-snug">{adapted.title}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void copyText(adapted.title, t("listingCopy.titleWord"))}
          >
            {t("listingCopy.copy")}
          </Button>
        </div>
        <span className="label">{t("listingCopy.chars", { count: adapted.title.length })}</span>
      </div>
      <div className="grid gap-1">
        <p
          className={`whitespace-pre-line text-[13.5px] text-ink-2 ${compact ? "line-clamp-4" : ""}`}
        >
          {adapted.description}
        </p>
        <div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void copyText(adapted.description, t("listingCopy.descriptionWord"))}
            leading={<AppIcon name="copy" size={14} />}
          >
            {t("listingCopy.copyDescription")}
          </Button>
        </div>
      </div>
      {adapted.hashtags.length ? (
        <p className="text-[12.5px] text-ink-3">{adapted.hashtags.join(" ")}</p>
      ) : null}
    </div>
  );
}
