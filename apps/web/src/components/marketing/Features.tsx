import { IconOffline, IconPin, IconSources, IconSpark } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { Stitch, StitchRow } from "@/components/ui/Stitch";

/** Bento des fonctions : chaque carte montre un vrai composant de l'app, pas une icône seule. */
export function Features() {
  return (
    <section id="fonctions" aria-labelledby="fonctions-h">
      <Reveal>
        <p className="eyebrow">03 · Ce qu'elle fait</p>
        <h2 id="fonctions-h" className="mt-3.5">
          La mercerie du revendeur
        </h2>
        <p className="lead mt-3">
          Tout ce qu'un tableur ne sait pas faire dans une cave sans réseau, à une main.
        </p>
      </Reveal>
      <div className="bento mt-7">
        <Reveal className="feature span-2" as="article">
          <div className="ico">
            <IconOffline />
          </div>
          <h3>Chiner hors ligne</h3>
          <p>
            Photo, prix au mètre ruban, lieu détecté : la pièce entre dans le stock sur le champ et
            se synchronise dès que le réseau revient. Jamais de double saisie.
          </p>
          <div className="demo">
            <div className="flex items-center justify-between">
              <span className="label">Mode chine · hors ligne</span>
              <span className="pill dormant outline">Sync plus tard · 3</span>
            </div>
            <div className="loc">
              <IconPin />
              <span>
                <b>Vide-grenier</b> · Bois-Guillaume · détecté
              </span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.05} className="feature" as="article">
          <div className="ico">
            <IconSpark />
          </div>
          <h3>Expert IA</h3>
          <p>
            Marque, coupe, matière, époque, état, fourchette de prix par plateforme et conseil
            d'achat. Il propose, tu confirmes.
          </p>
          <div className="demo">
            <span className="label text-thread">Reconnu · 92 %</span>
            <span className="text-[13.5px] font-semibold">
              Lacoste · ensemble · 1990s · <em className="serif text-brass">60 à 85 €</em>
            </span>
            <StitchRow left="Confiance" right="92 %" pct={92} label="Confiance de l'estimation" />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="feature" as="article">
          <div className="ico">
            <IconSources />
          </div>
          <h3>Sources au fil rouge</h3>
          <p>
            Palettes, ballots, lots, chine à l'unité. Le coût se répartit sur les pièces ; la source
            se rembourse vente après vente.
          </p>
          <div className="demo">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-bold text-[14px]">Palette Eureka</div>
                <div className="mono text-[11px] text-ink-3">Rouen · 12 kg · 48 pièces</div>
              </div>
              <span className="label">85 %</span>
            </div>
            <Stitch pct={85} label="Palette Eureka remboursée à 85 %" />
            <div className="flex justify-between mono text-[10.5px] text-ink-3 tracking-[.06em]">
              <span>
                Récupéré <b className="text-ink font-medium">227,47 €</b> sur 268,40 €
              </span>
              <span>31 vendues · 17 en stock</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="feature" as="article">
          <div className="ico">
            <span className="serif text-[22px] leading-none">€</span>
          </div>
          <h3>Marge et prix plancher</h3>
          <p>
            Achat, part de la source, port, emballage, frais : la marge nette est en laiton, le
            plancher en fil rouge. Simulée sur six plateformes avant de mettre en ligne.
          </p>
          <div className="receipt">
            <div>
              <span>Prix cible</span>
              <span>75,00</span>
            </div>
            <div>
              <span>Frais Vestiaire</span>
              <span className="neg">−15,00</span>
            </div>
            <div>
              <span>Achat</span>
              <span className="neg">−20,00</span>
            </div>
            <div className="tot">
              <span>Marge nette</span>
              <span className="pos">+40,00</span>
            </div>
            <div>
              <span>Plancher (marge 30 %)</span>
              <span className="neg">41,00</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.2} className="feature" as="article">
          <div className="ico">
            <span className="mono text-[13px] font-medium">%</span>
          </div>
          <h3>Analytique et rapport</h3>
          <p>
            Taux d'écoulement, délai de vente, meilleures plateformes, sources et marques. Rapport
            mensuel imprimable pour la compta.
          </p>
          <div className="demo grid-cols-3 !grid">
            {[
              ["Écoulement", "62 %"],
              ["Délai médian", "9 j"],
              ["Meilleure source", "Fleek"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="label">{k}</div>
                <div className="serif text-[22px] italic leading-tight">{v}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.25} className="feature span-2" as="article">
          <div className="ico">
            <span className="mono text-[12px] font-medium">CSV</span>
          </div>
          <h3>Tes données, ton tableur, tes étiquettes</h3>
          <p>
            Export CSV des pièces, ventes et sources dès la formule gratuite. Journal comptable avec
            totaux mensuels, étiquettes QR imprimables et texte d'annonce prêt à coller pour les
            formules supérieures.
          </p>
          <div className="demo">
            <div className="flex flex-wrap gap-2">
              {[
                "pieces.csv",
                "ventes.csv",
                "sources.csv",
                "comptabilite.csv",
                "étiquettes.pdf",
              ].map((f) => (
                <span key={f} className="pill stock outline mono">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
