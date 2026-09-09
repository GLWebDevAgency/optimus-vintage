import { Reveal } from "@/components/ui/Reveal";

const ROWS = [
  ["Saisie en brocante, sans réseau", "Photo + prix en 10 s", "Papier, puis recopie le soir"],
  [
    "Frais de plateforme",
    "Grilles 2026 intégrées, réglables",
    "Formule à maintenir, souvent fausse",
  ],
  ["Coût d'une pièce issue d'un lot", "Réparti automatiquement", "Division approximative"],
  ["Source remboursée ?", "Fil rouge cousu vente après vente", "Colonne oubliée"],
  ["Expertise avant achat", "IA sur photo, conseil d'achat", "Recherche sur le parking"],
  ["Prix plancher", "Calculé par pièce", "Au feeling"],
  ["Compta de fin de mois", "Rapport et journal en un clic", "Un dimanche de perdu"],
] as const;

/** Face au tableur : le reçu comparatif, sans logos de concurrents et sans chiffres inventés. */
export function Compare() {
  return (
    <section aria-labelledby="compare-h">
      <Reveal>
        <p className="eyebrow">07 · Face au tableur</p>
        <h2 id="compare-h" className="mt-3.5">
          Ce que le tableur ne sait pas faire dans une cave
        </h2>
      </Reveal>
      <Reveal className="compare mt-7" as="div">
        <table>
          <thead>
            <tr>
              <th scope="col">Le geste</th>
              <th scope="col">Chiné</th>
              <th scope="col">Le tableur</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([g, c, t]) => (
              <tr key={g}>
                <th scope="row">{g}</th>
                <td className="yes">{c}</td>
                <td className="no">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </section>
  );
}
