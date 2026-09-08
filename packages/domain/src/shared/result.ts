/**
 * Result — erreurs métier attendues, sans exceptions.
 * `ok(value)` / `err(error)`; les bugs restent des exceptions.
 */
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = DomainError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error instanceof Error ? r.error : new Error(String(r.error));
}

export class DomainError extends Error {
  override readonly name: string = "DomainError";
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
  }
}

export class InvariantViolation extends DomainError {
  override readonly name = "InvariantViolation";
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super("INVARIANT_VIOLATION", message, details);
  }
}

export class InvalidTransition extends DomainError {
  override readonly name = "InvalidTransition";
  constructor(entity: string, from: string, to: string) {
    super("INVALID_TRANSITION", `${entity}: transition ${from} → ${to} interdite`, { from, to });
  }
}

export function assertInvariant(condition: unknown, message: string, details?: Record<string, unknown>): asserts condition {
  if (!condition) throw new InvariantViolation(message, details);
}
