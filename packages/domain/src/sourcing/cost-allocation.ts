import { Money } from "../money/money.js";
import type { AllocationPolicy } from "./purchase-source.js";
import { assertInvariant } from "../shared/result.js";

/**
 * Service de domaine : répartit l'investissement d'une source entre ses pièces.
 * La somme des coûts alloués vaut exactement l'investissement (pas de centime perdu).
 */
export function allocateCosts(
  totalInvestment: Money,
  policy: AllocationPolicy,
  pieces: number,
  weightsKg?: readonly number[],
): Money[] {
  assertInvariant(Number.isInteger(pieces) && pieces > 0, "allocateCosts: pieces > 0 requis", { pieces });
  switch (policy) {
    case "EVEN":
      return totalInvestment.allocate(pieces);
    case "BY_WEIGHT": {
      assertInvariant(weightsKg && weightsKg.length === pieces, "allocateCosts: un poids par pièce requis");
      return totalInvestment.allocateByWeights(weightsKg);
    }
    case "MANUAL":
      // En manuel, le coût est saisi pièce par pièce ; on retourne une répartition égale comme point de départ.
      return totalInvestment.allocate(pieces);
  }
}
