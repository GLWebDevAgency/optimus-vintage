import {
  type Currency,
  type DomainError,
  err,
  Money,
  ok,
  type Result,
  type Workspace,
} from "@chine/domain";
import { ValidationFailed } from "../errors.js";

/** Montant tel qu'il arrive d'un client (JSON) : une instance de `Money` convient aussi. */
export interface MoneyInput {
  readonly minor: number;
  readonly currency: Currency;
}

/** Convertit un montant reçu en `Money`, en imposant la devise de l'espace. */
export function moneyIn(
  ws: Workspace,
  input: MoneyInput,
  field: string,
): Result<Money, DomainError> {
  if (input.currency !== ws.currency) {
    return err(
      new ValidationFailed(`Devise attendue : ${ws.currency}`, { field, currency: input.currency }),
    );
  }
  if (!Number.isSafeInteger(input.minor))
    return err(new ValidationFailed("Montant invalide", { field }));
  return ok(Money.ofMinor(input.minor, input.currency));
}

type ReadMoney<T> = { [K in keyof T]: undefined extends T[K] ? Money | undefined : Money };

/** Lit plusieurs montants d'un coup ; le premier montant invalide fait échouer l'ensemble. */
export function readMoney<T extends Record<string, MoneyInput | undefined>>(
  ws: Workspace,
  fields: T,
): Result<ReadMoney<T>, DomainError> {
  const out: Record<string, Money | undefined> = {};
  for (const [field, input] of Object.entries(fields)) {
    if (input === undefined) continue;
    const r = moneyIn(ws, input, field);
    if (!r.ok) return r;
    out[field] = r.value;
  }
  return ok(out as ReadMoney<T>);
}
