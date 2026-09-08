/** Concatène des classes en ignorant les valeurs fausses. */
export type ClassValue = string | false | null | undefined | 0;
export const cn = (...classes: ClassValue[]): string => classes.filter(Boolean).join(" ");
