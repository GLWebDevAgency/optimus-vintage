import { PLAN_LIMITS, PLAN_NAMES } from "@chine/domain";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

const PERSONAS = [
  {
    who: "Je vide mon dressing et je chine un peu",
    plan: "FREE" as const,
    count: `Jusqu'à ${PLAN_LIMITS.FREE.maxItems} pièces en stock`,
    body: "Quelques ventes par mois, une brocante de temps en temps. Tu veux savoir si tu gagnes vraiment de l'argent, sans tableur.",
  },
  {
    who: "Je vends chaque semaine",
    plan: "PREMIUM" as const,
    count: `Jusqu'à ${PLAN_LIMITS.PREMIUM.maxItems} pièces`,
    body: "Lots Fleek, palettes Eureka, dimanches en brocante. Tu veux les textes d'annonce, l'analytique et savoir quelle source remboursée en premier.",
  },
  {
    who: "J'en vis",
    plan: "PRO" as const,
    count: "Pièces illimitées",
    body: "Micro-entreprise, Vinted Pro, plusieurs plateformes. Tu veux le journal comptable, les étiquettes QR et une IA sans compter.",
  },
] as const;

export function Personas() {
  return (
    <section aria-labelledby="who-h">
      <Reveal>
        <p className="eyebrow">05 · Pour qui</p>
        <h2 id="who-h" className="mt-3.5">
          Du dressing à l'atelier
        </h2>
        <p className="lead mt-3">
          La limite, c'est le nombre de pièces suivies en stock, pas le nombre de fonctions. Une
          vente libère une place.
        </p>
      </Reveal>
      <div className="personas mt-7">
        {PERSONAS.map((p, i) => (
          <Reveal key={p.plan} delay={i * 0.06} className="persona" as="article">
            <span className="label">{PLAN_NAMES[p.plan]}</span>
            <h3>{p.who}</h3>
            <p className="serif text-brass text-[20px] italic">{p.count}</p>
            <p>{p.body}</p>
            <Link href="/tarifs" className="font-semibold text-ink underline">
              Voir la formule {PLAN_NAMES[p.plan]}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
