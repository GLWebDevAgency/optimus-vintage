import {
  IconCamera,
  IconHome,
  IconSales,
  IconShirt,
  IconSources,
  IconStock,
} from "@/components/ui/Icons";
import { StitchRow } from "@/components/ui/Stitch";
import { Tally } from "@/components/ui/Tally";

/** L'écran « Aujourd'hui » de la maquette, en démonstration statique (données d'exemple). */
export function HeroPhone() {
  return (
    <div className="phone skin-auto" aria-label="Aperçu de l'écran Aujourd'hui" role="img">
      <div className="status">
        <span>9:41</span>
        <span>●●● ▲ ▮</span>
      </div>
      <div className="scr">
        <div className="top enter d1">
          <div>
            <div className="label">Dim. 7 sept.</div>
            <h2>Aujourd'hui</h2>
          </div>
          <span className="avatar">L</span>
        </div>
        <div className="hero-kpi enter d2">
          <span className="k">Marge nette · septembre</span>
          <div className="v">
            <Tally to={1284.5} decimals={2} />
            <small>€</small>
          </div>
          <span className="delta">+18 % vs août · 23 ventes</span>
        </div>
        <div className="enter d3">
          <StitchRow left="Objectif 2 000 €" right="64 %" pct={64} label="Objectif du mois" />
        </div>
        <div className="tag-row">
          <div className="tag swing" style={{ animationDelay: ".35s" }}>
            <span className="k">Stock</span>
            <div className="v">142</div>
          </div>
          <div className="tag swing" style={{ animationDelay: ".5s" }}>
            <span className="k">En ligne</span>
            <div className="v">38</div>
          </div>
          <div className="tag swing" style={{ animationDelay: ".65s" }}>
            <span className="k text-thread">Dormant</span>
            <div className="v">12</div>
          </div>
        </div>
        <div className="sec-h enter d5">
          <h2 className="!text-[15px]">Dernières ventes</h2>
          <span className="text-xs font-semibold text-ink-2">Tout voir</span>
        </div>
        <div className="list enter d6">
          {[
            ["Ensemble Lacoste", "Vinted · hier", "+49,65", "pos"],
            ["Polaire Patagonia", "Vinted · hier", "+22,10", "pos"],
            ["Jean Levi's 501", "Leboncoin · 3 j", "−3,20", "neg"],
          ].map(([t, s, amt, tone]) => (
            <div className="it" key={t}>
              <div className="thumb">
                <IconShirt />
              </div>
              <div>
                <div className="t">{t}</div>
                <div className="s">{s}</div>
              </div>
              <div className={`amt ${tone}`}>{amt}</div>
            </div>
          ))}
        </div>
        <div className="tabbar enter d7" aria-hidden="true">
          <span className="tb on">
            <IconHome />
            Jour
          </span>
          <span className="tb">
            <IconStock />
            Stock
          </span>
          <div className="cta-slot">
            <span className="cta">
              <IconCamera />
            </span>
            <span className="cta-l">Chiner</span>
          </div>
          <span className="tb">
            <IconSales />
            Ventes
          </span>
          <span className="tb">
            <IconSources />
            Sources
          </span>
        </div>
      </div>
    </div>
  );
}
