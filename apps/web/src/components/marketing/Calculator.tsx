"use client";

import {
  DEFAULT_FEE_SCHEDULES,
  Money,
  PLATFORM_LABEL,
  type Platform,
  priceForTargetMargin,
  ScheduleFeePolicy,
  simulatePrice,
} from "@chine/domain";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

const PLATFORMS: readonly Platform[] = [
  "VINTED",
  "VESTIAIRE",
  "LEBONCOIN",
  "EBAY",
  "DEPOP",
  "ETSY",
];
const policy = new ScheduleFeePolicy();
const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const pct = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

/**
 * Le calcul de l'app, sous les yeux du visiteur : mêmes grilles de frais, même arithmétique
 * en centimes (`@chine/domain`). Aucun chiffre marketing : ce que tu entres, c'est ce qui sort.
 */
export function Calculator() {
  const [buy, setBuy] = useState(20);
  const [sell, setSell] = useState(75);
  const [platform, setPlatform] = useState<Platform>("VINTED");
  const [shipping, setShipping] = useState(0);
  const sim = useMemo(() => {
    const cost = Money.of(Math.max(0, buy), "EUR");
    const price = Money.of(Math.max(0, sell), "EUR");
    const s = simulatePrice(platform, price, cost, policy, Money.of(Math.max(0, shipping), "EUR"));
    const floor = priceForTargetMargin(
      platform,
      cost,
      cost.percent(30),
      policy,
      Money.of(Math.max(0, shipping), "EUR"),
    );
    return { ...s, floor };
  }, [buy, sell, platform, shipping]);
  const schedule = DEFAULT_FEE_SCHEDULES[platform];

  return (
    <section id="calcul" aria-labelledby="calc-h" className="calc">
      <Reveal>
        <p className="eyebrow">04 · Calcule ta marge</p>
        <h2 id="calc-h" className="mt-3.5">
          Il te reste combien, vraiment ?
        </h2>
        <p className="lead mt-3">
          Le même calcul que dans l'app, avec les grilles de frais de septembre 2026. Change la
          plateforme : le net bouge, pas le brut.
        </p>
      </Reveal>
      <Reveal className="calc-grid mt-7" as="div">
        <form className="calc-form card" onSubmit={(e) => e.preventDefault()}>
          <label>
            <span className="label">Acheté</span>
            <div className="in">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={buy}
                onChange={(e) => setBuy(Number(e.target.value))}
                aria-label="Prix d'achat en euros"
              />
              <span className="unit">€</span>
            </div>
          </label>
          <label>
            <span className="label">Vendu</span>
            <div className="in">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={sell}
                onChange={(e) => setSell(Number(e.target.value))}
                aria-label="Prix de vente en euros"
              />
              <span className="unit">€</span>
            </div>
          </label>
          <label>
            <span className="label">Port à ta charge</span>
            <div className="in">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                aria-label="Frais de port à ta charge en euros"
              />
              <span className="unit">€</span>
            </div>
          </label>
          <fieldset className="calc-platforms">
            <legend className="label">Plateforme</legend>
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                className="chip"
                aria-pressed={platform === p}
                onClick={() => setPlatform(p)}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </fieldset>
          <p className="calc-note">{schedule.note ?? "Aucun frais vendeur."}</p>
        </form>
        <div className="receipt calc-receipt" aria-live="polite" data-testid="calc-receipt">
          <div>
            <span>Prix de vente</span>
            <span>{fmt.format(sim.price.minor / 100)}</span>
          </div>
          <div>
            <span>Frais {PLATFORM_LABEL[platform]}</span>
            <span className={sim.fees.minor > 0 ? "neg" : undefined}>
              {sim.fees.minor > 0 ? "−" : ""}
              {fmt.format(sim.fees.minor / 100)}
            </span>
          </div>
          <div>
            <span>Port</span>
            <span className={shipping > 0 ? "neg" : undefined}>
              {shipping > 0 ? "−" : ""}
              {fmt.format(Math.max(0, shipping))}
            </span>
          </div>
          <div>
            <span>Achat</span>
            <span className="neg">−{fmt.format(Math.max(0, buy))}</span>
          </div>
          <div className="tot">
            <span>Marge nette</span>
            <span className={sim.margin.minor >= 0 ? "pos" : "neg"}>
              {sim.margin.minor >= 0 ? "+" : ""}
              {fmt.format(sim.margin.minor / 100)}
            </span>
          </div>
          <div>
            <span>Retour sur achat</span>
            <span className={sim.margin.minor >= 0 ? "pos" : "neg"}>
              {sim.roi === undefined ? "—" : pct.format(sim.roi)}
            </span>
          </div>
          <div>
            <span>Plancher pour 30 % de marge</span>
            <span>{fmt.format(sim.floor.minor / 100)}</span>
          </div>
          <p className="calc-cta">
            <Link href="/auth/inscription" className="btn" data-cta="calc">
              Suivre mes vraies ventes
            </Link>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
