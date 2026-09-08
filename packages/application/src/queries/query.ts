import type { UseCase } from "../use-cases/use-case.js";

/** Une requête de lecture : même contrat qu'un cas d'usage, mais sans effet de bord. */
export type Query<Input, Output> = UseCase<Input, Output>;
