import { PLAN_LIMITS } from "@chine/domain";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-h">
      <Reveal className="card shadow grid gap-4 !rounded-[22px] !p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="eyebrow">Prêt·e ?</p>
          <h2 id="cta-h" className="mt-3">
            Ta prochaine pièce mérite une <em className="serif">étiquette</em>.
          </h2>
          <p className="lead mt-2 text-[15px]">
            Gratuit jusqu'à {PLAN_LIMITS.FREE.maxItems} pièces en stock. Sans carte, sans app store
            : installe Chiné depuis ton navigateur.
          </p>
        </div>
        <Link href="/auth/inscription" className="btn lg" data-cta="final">
          Créer un compte
        </Link>
      </Reveal>
    </section>
  );
}
