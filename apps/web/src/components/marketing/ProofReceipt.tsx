import { Reveal } from "@/components/ui/Reveal";

/**
 * La preuve, au centime : le reçu exact de la vente d'exemple, tel que l'app le calcule
 * (Vinted ne prend aucun frais vendeur ; l'acheteur paie la protection et le port).
 */
export function ProofReceipt() {
  return (
    <section aria-labelledby="proof-h" className="proof">
      <Reveal>
        <p className="eyebrow">01 · La preuve</p>
        <h2 id="proof-h" className="mt-3.5">
          Un reçu, pas des logos
        </h2>
        <p className="lead mt-3">
          Chaque vente porte son reçu : prix, frais de la plateforme, port, emballage, coût d'achat.
          Ce qu'il reste, en laiton. Ce que tu perds, barré au fil rouge.
        </p>
      </Reveal>
      <div className="proof-grid mt-7">
        <Reveal className="card receipt-card" as="article">
          <div className="flex items-baseline justify-between">
            <span className="label">Ensemble Lacoste · vendu sur Vinted</span>
            <span className="mini-stamp">Vendu</span>
          </div>
          <div className="receipt mt-2">
            <div>
              <span>Prix de vente</span>
              <span>75,00</span>
            </div>
            <div>
              <span>Frais Vinted (vendeur)</span>
              <span>0,00</span>
            </div>
            <div>
              <span>Port</span>
              <span>payé par l'acheteur</span>
            </div>
            <div>
              <span>Achat en brocante</span>
              <span className="neg">−20,00</span>
            </div>
            <div className="tot">
              <span>Marge nette</span>
              <span className="pos">+55,00</span>
            </div>
            <div>
              <span>Retour sur achat</span>
              <span className="pos">+275 %</span>
            </div>
          </div>
          <p className="label mt-3">Données d'exemple · même calcul que dans l'app</p>
        </Reveal>
        <div className="grid gap-4">
          {[
            [
              "Le prix plancher",
              "Coût réel de la pièce, part de la source, frais et marge visée : en dessous, tu perds. Chiné te retient avant la baisse de prix.",
            ],
            [
              "La source au fil rouge",
              "Palette, ballot, lot ou chine à l'unité : chaque source se rembourse vente après vente et se tamponne « amortie » quand c'est fait.",
            ],
            [
              "Le vrai net, pas le brut",
              "Les grilles de frais de septembre 2026 sont dans l'app et se règlent par plateforme, Vinted Pro compris.",
            ],
          ].map(([h, p], i) => (
            <Reveal key={h} delay={0.06 * (i + 1)} className="principle" as="article">
              <span className="n">{["i.", "ii.", "iii."][i]}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
