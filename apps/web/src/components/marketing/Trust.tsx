import { Reveal } from "@/components/ui/Reveal";

const ITEMS = [
  [
    "Tes données t'appartiennent",
    "Export CSV et JSON à tout moment, même en gratuit. Suppression du compte en un geste, abonnement résilié dans la foulée.",
  ],
  [
    "Hébergé en Europe",
    "Base de données et photos sur des serveurs européens. Aucune revente de données, aucune publicité.",
  ],
  [
    "Hors ligne par construction",
    "Application installable (PWA) : tout ce que tu saisis sans réseau attend sur ton téléphone et repart tout seul.",
  ],
  [
    "Des chiffres honnêtes",
    "Les captures de cette page sont celles de l'app avec des données d'exemple. Pas de témoignages inventés.",
  ],
] as const;

export function Trust() {
  return (
    <section aria-labelledby="trust-h">
      <Reveal>
        <p className="eyebrow">08 · Confiance</p>
        <h2 id="trust-h" className="mt-3.5">
          Cousu pour durer
        </h2>
      </Reveal>
      <div className="trust mt-7">
        {ITEMS.map(([h, p], i) => (
          <Reveal key={h} delay={i * 0.05} className="trust-item" as="article">
            <h3>{h}</h3>
            <p>{p}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
