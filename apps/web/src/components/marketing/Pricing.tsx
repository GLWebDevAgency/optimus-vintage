"use client";

import { PLAN_LIMITS, yearlySavingMinor } from "@chine/domain";
import Link from "next/link";
import { useState } from "react";
import { IconCheck } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { formatAmount } from "@/lib/format";
import { PLANS, TRIAL_DAYS } from "./pricing-data";

/**
 * Tarifs : le nombre de pièces en première ligne de chaque carte, un prix mensuel lisible,
 * l'essai sans carte, et Atelier en liste d'attente tant que ses fonctions ne sont pas livrées.
 */
export function Pricing({ standalone = false }: { standalone?: boolean }) {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="tarifs" aria-labelledby="tarifs-h">
      <Reveal>
        <p className="eyebrow">{standalone ? "Tarifs" : "06 · Tarifs"}</p>
        <h2 id="tarifs-h" className="mt-3.5">
          Gratuit jusqu'à {PLAN_LIMITS.FREE.maxItems} pièces, puis à ta mesure
        </h2>
        <p className="lead mt-3">
          La limite porte sur les pièces en stock : une vente libère une place. Rien n'est jamais
          supprimé, quelle que soit la formule. En euros, taxes comprises, sans engagement.
        </p>
        <div className="toggle-row mt-6">
          <span id="lbl-mensuel" className={yearly ? "text-ink-3" : ""}>
            Mensuel
          </span>
          <button
            type="button"
            className="snap"
            role="switch"
            aria-checked={yearly}
            aria-labelledby="lbl-annuel"
            onClick={() => setYearly((v) => !v)}
            data-testid="pricing-toggle"
          >
            <i />
          </button>
          <span id="lbl-annuel" className={yearly ? "" : "text-ink-3"}>
            Annuel
          </span>
          <span className="save">jusqu'à −30 %</span>
        </div>
      </Reveal>
      <div className="plans mt-7">
        {PLANS.map((p, i) => {
          const price = (yearly ? p.yearlyPerMonthMinor : p.monthlyMinor) / 100;
          const saving = yearlySavingMinor(p.id) / 100;
          return (
            <Reveal
              key={p.id}
              delay={i * 0.06}
              as="article"
              className={`plan${p.hot ? " hot" : ""}${p.waitlist ? " waitlist" : ""}`}
              data-testid={`plan-${p.id}`}
            >
              <div className="name">
                <span>{p.name}</span>
                {p.hot ? <span className="badge-cut">Le plus chiné</span> : null}
                {p.waitlist ? <span className="badge-cut muted">Bientôt</span> : null}
              </div>
              <div className="price" aria-live="polite">
                <span className="tabular">{price === 0 ? "0" : formatAmount(price)}</span>
                <small>€ / mois</small>
              </div>
              <div className="per">
                {p.monthlyMinor === 0
                  ? "pour toujours"
                  : yearly
                    ? `${formatAmount(p.yearlyMinor / 100, 0)} € par an · ${formatAmount(saving, 0)} € économisés`
                    : `ou ${formatAmount(p.yearlyPerMonthMinor / 100)} € / mois en annuel`}
              </div>
              <p className="text-ink-2 text-[14px]">{p.tagline}</p>
              <p className="label">{p.audience}</p>
              <ul>
                {p.features.map((f) => (
                  <li key={f.label} className={f.on ? (f.lead ? "lead-line" : undefined) : "off"}>
                    <IconCheck />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              {p.payback ? <p className="payback">{p.payback}</p> : null}
              {p.waitlist ? (
                <a
                  href="mailto:bonjour@chine.app?subject=Liste%20d%27attente%20Atelier"
                  className="btn ghost"
                >
                  {p.cta}
                </a>
              ) : (
                <Link
                  href={p.id === "FREE" ? "/auth/inscription" : `/auth/inscription?plan=${p.id}`}
                  className={`btn${p.hot ? "" : " ghost"}`}
                  data-cta={`plan-${p.id}`}
                >
                  {p.cta}
                </Link>
              )}
              {p.id !== "FREE" && !p.waitlist ? (
                <p className="label text-center">
                  {TRIAL_DAYS} jours gratuits · sans carte · annulable à tout moment
                </p>
              ) : null}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
