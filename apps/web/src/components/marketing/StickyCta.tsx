"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Sur téléphone, l'appel principal reste à portée de pouce une fois le héros passé. */
export function StickyCta() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero-h");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShown(!(e?.isIntersecting ?? true)), {
      rootMargin: "-80px 0px 0px 0px",
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <div className="sticky-cta" data-shown={shown} aria-hidden={!shown}>
      <span>Gratuit · sans carte</span>
      <Link href="/auth/inscription" className="btn" tabIndex={shown ? 0 : -1} data-cta="sticky">
        Commencer
      </Link>
    </div>
  );
}
