import { Reveal } from "@/components/ui/Reveal";
import { FAQ } from "./pricing";

export function Faq({ standalone = false }: { standalone?: boolean }) {
  return (
    <section id="faq" aria-labelledby="faq-h">
      <Reveal>
        <p className="eyebrow">{standalone ? "Questions" : "09 · Questions"}</p>
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
  );
}
