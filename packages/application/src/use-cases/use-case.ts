import type { DomainError, Result } from "@chine/domain";

/** Un cas d'usage : une commande en entrée, un `Result` en sortie. Ne lève que pour les bugs. */
export interface UseCase<Command, Output> {
  execute(command: Command): Promise<Result<Output, DomainError>>;
}
