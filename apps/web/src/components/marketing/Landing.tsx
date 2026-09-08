import Link from "next/link";
import { TagMark } from "@/components/brand/TagMark";
import { IconOffline, IconPin, IconSources, IconSpark } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { Stitch, StitchRow } from "@/components/ui/Stitch";
import { HeroPhone } from "./HeroPhone";
import { Pricing } from "./Pricing";
import { FAQ } from "./pricing";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const HERO_UNDERLINE = "M2 10 C 120 2, 300 16, 518 8";

export function Landing() {
  return (
    <>
      <SiteHeader />
      <main className="wrap landing">
        {/* ── Héros ── */}
        <section className="hero !mt-0" aria-labelledby="hero-h">
          <div>
            <p className="eyebrow">L'app des chineurs · seconde main</p>
            <h1 id="hero-h" className="wordmark mt-4">
              Chiné
              <span className="v">la chine avant le tableur.</span>
            </h1>
            <svg className="stitch-under" viewBox="0 0 520 18" aria-hidden="true">
              <defs>
                <mask id="m-hero">
                  <path
                    d={HERO_UNDERLINE}
                    stroke="#fff"
                    strokeWidth="10"
                    fill="none"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset="1"
                    style={{ animation: "draw 1.6s var(--ease-out) .4s forwards" }}
                  />
                </mask>
              </defs>
              <path
                d={HERO_UNDERLINE}
                stroke="var(--thread)"
                strokeWidth="2.6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="9 6"
                mask="url(#m-hero)"
              />
            </svg>
            <p className="lead mt-6">
              Tu achètes des vêtements pour les revendre. Chiné tient le stock, les sources et la
              marge — dans ta poche, hors ligne, avec un expert IA qui estime avant que tu paies.
              Pas un tableau de bord : une étiquette, un fil rouge, un tampon.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/inscription" className="btn lg">
                Créer un compte gratuit
              </Link>
              <Link href="/auth/connexion" className="btn ghost lg">
                Se connecter
              </Link>
            </div>
            <div className="hero-meta mt-9">
              <div className="flex items-center gap-4">
                <TagMark size={56} swing />
                <div>
                  <b className="font-bold">La marque tissée</b>
                  <br />
                  <span className="text-ink-2 text-[14px]">
                    étiquette, fil rouge, lettre à l'encre
                  </span>
                </div>
              </div>
              <div className="kv">
                <b>Hors ligne</b>
                <span>Photo, prix, lieu : enregistrés sur place, synchronisés plus tard.</span>
              </div>
              <div className="kv">
                <b>Fil rouge</b>
                <span>
                  Chaque source se rembourse vente après vente, et se tamponne une fois amortie.
                </span>
              </div>
              <div className="kv">
                <b>Laiton</b>
                <span>
                  Le gain est en laiton, la perte est barrée. Jamais de vert ni de rouge sémaphore.
                </span>
              </div>
            </div>
          </div>
          <Reveal delay={0.1}>
            <HeroPhone />
          </Reveal>
        </section>

        {/* ── Trois décisions ── */}
        <section aria-labelledby="decisions-h">
          <Reveal>
            <p className="eyebrow">01 · Parti pris</p>
            <h2 id="decisions-h" className="mt-3.5">
              Trois décisions, une main
            </h2>
            <p className="lead mt-3">
              Un revendeur ne fait que trois choix, cent fois par semaine. Chiné est construite
              autour d'eux, et de rien d'autre.
            </p>
          </Reveal>
          <div className="grid gap-6 mt-7 md:grid-cols-3">
            {[
              [
                "i.",
                "Acheter ou passer",
                "Une photo dans la cave d'un vide-grenier. L'expert IA reconnaît la marque, l'époque, et donne une fourchette. Tu sais ce que ça vaut avant de sortir le billet.",
              ],
              [
                "ii.",
                "Afficher le bon prix",
                "Coût réel, frais de plateforme, port, marge visée : le prix plancher est calculé pour chaque pièce. Au-dessus, tu gagnes. En dessous, Chiné te retient.",
              ],
              [
                "iii.",
                "Quelle source rembourser",
                "Palette, ballot, lot ou chine à l'unité : chaque source a son fil rouge qui se coud vente après vente. Tu vois laquelle est amortie, laquelle traîne.",
              ],
            ].map(([n, t, p], i) => (
              <Reveal key={n} delay={i * 0.08} className="principle">
                <span className="n">{n}</span>
                <h3>{t}</h3>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Fonctionnalités ── */}
        <section id="fonctions" aria-labelledby="fonctions-h">
          <Reveal>
            <p className="eyebrow">02 · Ce qu'elle fait</p>
            <h2 id="fonctions-h" className="mt-3.5">
              La mercerie du revendeur
            </h2>
          </Reveal>
          <div className="grid gap-4 mt-7 md:grid-cols-2">
            <Reveal className="feature">
              <div className="ico">
                <IconOffline />
              </div>
              <h3>Chiner hors ligne</h3>
              <p>
                Une main, sans réseau. Photo, prix au mètre, lieu détecté : la pièce entre dans le
                stock sur le champ et se synchronise dès que le réseau revient.
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
            <Reveal delay={0.06} className="feature">
              <div className="ico">
                <IconSources />
              </div>
              <h3>Sources</h3>
              <p>
                Palettes, ballots, lots, chine à l'unité. Le coût se répartit sur les pièces, la
                source se rembourse au fil rouge et se tamponne « amortie ».
              </p>
              <div className="demo">
                <div className="flex justify-between items-baseline">
                  <div>
                    <div className="font-bold text-[14px]">Palette Eureka</div>
                    <div className="mono text-[11px] text-ink-3">Rouen · 12 kg · 48 pièces</div>
                  </div>
                  <span className="mini-stamp">Amortie</span>
                </div>
                <Stitch pct={100} label="Palette Eureka remboursée" />
                <div className="flex justify-between mono text-[10.5px] text-ink-3 tracking-[.06em]">
                  <span>
                    Récupéré <b className="text-ink font-medium">268,40 €</b>
                  </span>
                  <span>31 vendues · 17 en stock</span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.12} className="feature">
              <div className="ico">
                <span className="serif text-[22px] leading-none">€</span>
              </div>
              <h3>Marge &amp; prix plancher</h3>
              <p>
                Chaque pièce porte son reçu : achat, part de la source, port, emballage, frais. La
                marge nette est en laiton, le plancher en fil rouge.
              </p>
              <div className="receipt">
                <div>
                  <span>Prix cible</span>
                  <span>75,00</span>
                </div>
                <div>
                  <span>Frais Vinted</span>
                  <span>0,00</span>
                </div>
                <div>
                  <span>Port estimé</span>
                  <span className="neg">−4,95</span>
                </div>
                <div>
                  <span>Achat</span>
                  <span className="neg">−20,00</span>
                </div>
                <div className="tot">
                  <span>Marge nette</span>
                  <span className="pos">+49,65</span>
                </div>
                <div>
                  <span>Plancher</span>
                  <span className="neg">31,20</span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.18} className="feature">
              <div className="ico">
                <IconSpark />
              </div>
              <h3>Expert IA</h3>
              <p>
                Marque, coupe, matière, époque, fourchette de prix et texte d'annonce : l'IA
                propose, tu confirmes. Elle apprend de tes ventes, pas l'inverse.
              </p>
              <div className="demo">
                <span className="label text-thread">Reconnu · 92 %</span>
                <span className="text-[13.5px] font-semibold">
                  Lacoste · ensemble · 1990s · <em className="serif text-brass">60 à 85 €</em>
                </span>
                <StitchRow
                  left="Confiance"
                  right="92 %"
                  pct={92}
                  label="Confiance de l'estimation"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Tarifs ── */}
        <Pricing />

        {/* ── FAQ ── */}
        <section id="faq" aria-labelledby="faq-h">
          <Reveal>
            <p className="eyebrow">05 · Questions</p>
            <h2 id="faq-h" className="mt-3.5">
              Ce qu'on nous demande au stand
            </h2>
          </Reveal>
          <Reveal className="faq mt-6">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <div className="a">{f.a}</div>
              </details>
            ))}
          </Reveal>
        </section>

        {/* ── Appel final ── */}
        <section aria-labelledby="cta-h">
          <Reveal className="card shadow grid gap-4 !rounded-[22px] !p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="eyebrow">Prêt·e ?</p>
              <h2 id="cta-h" className="mt-3">
                Ta prochaine pièce mérite une <em className="serif">étiquette</em>.
              </h2>
              <p className="lead mt-2 text-[15px]">
                Gratuit jusqu'à 60 pièces. Installe Chiné sur ton téléphone.
              </p>
            </div>
            <Link href="/auth/inscription" className="btn lg">
              Créer un compte
            </Link>
          </Reveal>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
