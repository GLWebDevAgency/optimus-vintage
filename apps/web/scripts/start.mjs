/**
 * Point d'entrée de l'image de production : choisit l'adresse d'écoute, puis lance le serveur
 * autonome Next.js (`server.js`, sortie « standalone »).
 *
 * `::` (double pile IPv4 + IPv6) est requis par le réseau privé et les sondes Railway ; un hôte
 * sans IPv6 (Docker par défaut, certains bacs à sable) refuse `::` avec EAFNOSUPPORT, on retombe
 * alors sur `0.0.0.0`. `BIND_HOST` force une adresse. La variable `HOSTNAME` posée par Docker
 * (identifiant du conteneur) n'est jamais utilisée comme adresse d'écoute.
 */
import { createServer } from "node:net";

const canListen = (host) =>
  new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.listen({ host, port: 0 }, () => probe.close(() => resolve(true)));
  });

const forced = process.env.BIND_HOST?.trim();
process.env.HOSTNAME = forced || ((await canListen("::")) ? "::" : "0.0.0.0");
await import("../server.js");
