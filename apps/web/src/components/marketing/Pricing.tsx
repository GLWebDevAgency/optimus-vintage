"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCheck } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { formatAmount } from "@/lib/format";
import { PLANS } from "./pricing";

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="tarifs" aria-labelledby="tarifs-h">
      <Reveal>
        <p className="eyebrow">04 · Tarifs</p>
        <h2 id="tarifs-h" className="mt-3.5">
          Une étiquette, quatre prix
        </h2>
        <p className="lead mt-3">
          Gratuit pour commencer. Quand la chine devient un métier, la formule suit. Sans
          engagement, en euros, taxes comprises.
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
          >
            <i />
          </button>
          <span id="lbl-annuel" className={yearly ? "" : "text-ink-3"}>
            Annuel
          </span>
          <span className="save">−2 mois</span>
        </div>
      </Reveal>
      <div className="plans mt-7">
        {PLANS.map((p, i) => {
          const price = yearly ? p.yearly / 12 : p.monthly;
          return (
            <Reveal
              key={p.id}
              delay={i * 0.06}
              as="article"
              className={`plan${p.hot ? " hot" : ""}`}
            >
              <div className="name">
                <span>{p.name}</span>
                {p.hot ? <span className="badge-cut">Le plus chiné</span> : null}
              </div>
              <div className="price" aria-live="polite">
                <span className="tabular">{price === 0 ? "0" : formatAmount(price)}</span>
                <small>€ / mois</small>
              </div>
              <div className="per">
                {p.monthly === 0
                  ? "pour toujours"
                  : yearly
                    ? `${formatAmount(p.yearly, 0)} € facturés par an`
                    : "sans engagement"}
              </div>
              <p className="text-ink-2 text-[14px]">{p.tagline}</p>
              <ul>
                {p.features.map((f) => (
                  <li key={f.label} className={f.on ? undefined : "off"}>
                    <IconCheck />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/inscription" className={`btn${p.hot ? "" : " ghost"}`}>
                {p.cta}
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
