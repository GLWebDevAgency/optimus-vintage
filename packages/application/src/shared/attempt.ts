import { DomainError, err, ok, type Result } from "@chine/domain";

/** Les constructeurs du domaine lèvent des `InvariantViolation` : on les ramène dans un `Result`. */
export function attempt<T>(fn: () => T): Result<T, DomainError> {
  try {
    return ok(fn());
  } catch (e) {
    if (e instanceof DomainError) return err(e);
    throw e;
  }
}
