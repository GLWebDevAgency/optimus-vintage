import Link from "next/link";
import { TagMark } from "@/components/brand/TagMark";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

/** 404 dans l'atelier : on reste dans la coquille, retour au stock ou à l'accueil. */
export default function AppNotFound() {
  return (
    <>
      <TopBar title="Introuvable" kicker="404" back="/app" avatar={false} />
      <Screen>
        <div className="grid flex-1 place-items-center py-10 text-center">
          <div className="grid justify-items-center gap-4">
            <TagMark size={64} swing />
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">
              Rien à cette <em className="serif">adresse</em>.
            </h2>
            <p className="lead text-[14px]">
              La pièce a peut-être été vendue, ou l'adresse est erronée.
            </p>
            <div className="flex gap-2.5">
              <Link href="/app/stock" className="btn ghost">
                Retour au stock
              </Link>
              <Link href="/app" className="btn">
                Aujourd'hui
              </Link>
            </div>
          </div>
        </div>
      </Screen>
    </>
  );
}
