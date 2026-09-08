import type { Metadata } from "next";
import Link from "next/link";
import { TagMark } from "@/components/brand/TagMark";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false } };

/** Page servie par le service worker quand une navigation échoue sans réseau. */
export default function OfflinePage() {
  return (
    <main className="auth-shell">
      <div />
      <div className="grid place-items-center gap-5 text-center">
        <TagMark size={72} swing />
        <p className="eyebrow justify-center">Hors ligne</p>
        <h1 className="text-[30px] font-bold tracking-[-0.02em]">
          Pas de réseau, <em className="serif">pas de panique</em>.
        </h1>
        <p className="lead text-[15px]">
          Cette page n'est pas encore dans ta poche. Ce que tu as chiné est bien enregistré : ça
          partira dès que le réseau revient.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/app" className="btn">
            Retour à Aujourd'hui
          </Link>
          <Link href="/app/chiner" className="btn ghost">
            Chiner quand même
          </Link>
        </div>
      </div>
      <p className="label text-center">Chiné · mode hors ligne</p>
    </main>
  );
}
