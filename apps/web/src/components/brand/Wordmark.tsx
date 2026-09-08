import Link from "next/link";
import { TagMark } from "./TagMark";

interface WordmarkProps {
  size?: "sm" | "md";
  href?: "/" | "/app";
  className?: string;
}

/** Logotype : étiquette + « Chiné » en grotesque serrée, « l'app des chineurs » en sérif italique. */
export function Wordmark({ size = "sm", href = "/", className }: WordmarkProps) {
  const inner = (
    <>
      <TagMark size={size === "sm" ? 32 : 44} title={null} />
      <span className={`wm-txt ${size}`}>
        Chiné
        <em>l'app des chineurs</em>
      </span>
    </>
  );
  const cls = ["wm", className].filter(Boolean).join(" ");
  return (
    <Link href={href} className={cls} aria-label="Chiné — accueil">
      {inner}
    </Link>
  );
}
