"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    key: "chiner",
    n: "01",
    title: "Chiner",
    body: "Photo, prix payé au mètre, lieu détecté. L'expert IA reconnaît la marque et donne une fourchette avant que tu sortes le billet. Sans réseau, ça attend.",
    shot: "chiner",
    alt: "Écran Chiner : photo d'un ensemble Lacoste, prix payé 20 €, expertise IA 60 à 85 €",
  },
  {
    key: "vendre",
    n: "02",
    title: "Vendre",
    body: "La vente s'enregistre en trois gestes : plateforme, prix, date. Le reçu se remplit seul avec les vrais frais et la marge nette apparaît.",
    shot: "sold",
    alt: "Écran Vendu : reçu de la vente Lacoste à 75 € avec marge nette +55,00 €",
  },
  {
    key: "savoir",
    n: "03",
    title: "Savoir",
    body: "Quelle source est remboursée, laquelle traîne, ce qui dort en stock, ce que rapporte chaque plateforme. Tu sais où retourner acheter.",
    shot: "sources",
    alt: "Écran Sources : palette Eureka en cours de remboursement, fil rouge cousu",
  },
] as const;

/** Trois écrans réels, pas à pas : une légende cliquable, jamais de carrousel automatique. */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = STEPS[active] ?? STEPS[0];
  return (
    <section id="demo" aria-labelledby="demo-h" className="steps">
      <Reveal>
        <p className="eyebrow">02 · Comment ça marche</p>
        <h2 id="demo-h" className="mt-3.5">
          Chiner, vendre, savoir
        </h2>
        <p className="lead mt-3">
          Trois gestes, cent fois par semaine. Chiné est construite autour d'eux et de rien d'autre.
        </p>
      </Reveal>
      <div className="steps-grid mt-7">
        <div className="step-tabs" role="tablist" aria-label="Étapes">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              id={`step-tab-${s.key}`}
              aria-selected={i === active}
              aria-controls={`step-panel-${s.key}`}
              className="step-tab"
              onClick={() => setActive(i)}
              data-testid={`step-${s.key}`}
            >
              <span className="n">{s.n}</span>
              <span className="t">{s.title}</span>
              <span className="b">{s.body}</span>
            </button>
          ))}
        </div>
        <div
          className="shot"
          role="tabpanel"
          id={`step-panel-${step.key}`}
          aria-labelledby={`step-tab-${step.key}`}
        >
          <picture>
            <source
              srcSet={`/screens/${step.shot}-indigo.webp`}
              media="(prefers-color-scheme: dark)"
            />
            <img
              src={`/screens/${step.shot}-calico.webp`}
              alt={step.alt}
              width={640}
              height={1089}
              loading="lazy"
              decoding="async"
              key={step.key}
            />
          </picture>
          <p className="shot-caption">Capture réelle de l'app · données d'exemple</p>
        </div>
      </div>
    </section>
  );
}
