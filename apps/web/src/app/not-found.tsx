import Link from "next/link";
import { TagMark } from "@/components/brand/TagMark";

export default function NotFound() {
  return (
    <main className="auth-shell">
      <div />
      <div className="grid place-items-center gap-5 text-center">
        <TagMark size={72} swing />
        <p className="eyebrow justify-center">404 · Introuvable</p>
        <h1 className="text-[30px] font-bold tracking-[-0.02em]">
          Cette page a été <em className="serif">vendue</em>.
        </h1>
        <p className="lead text-[15px]">Rien à cette adresse. Retour au portant.</p>
        <Link href="/" className="btn">
          Retour à l'accueil
        </Link>
      </div>
      <div />
    </main>
  );
}
