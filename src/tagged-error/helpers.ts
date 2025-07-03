/* oxlint-disable */
/* eslint-disable */

import type { TaggedError } from './TaggedError';

// Extrai todos os tipos TaggedError de TInput
export type TaggedErrorOf<T> = T extends {
  readonly tag: infer Tag extends string;
}
  ? T extends Error
    ? T
    : never
  : never;

// Extrai todas as tags possíveis de TInput
export type TagsOf<T> = TaggedErrorOf<T> extends {
  readonly tag: infer Tag extends string;
}
  ? Tag
  : never;

// Extrai todos os tipos Error de TInput que NÃO são TaggedError
export type NonTaggedErrorOf<T> = T extends Error
  ? T extends { readonly tag: string }
    ? never
    : T
  : never;

// Calcula os tipos não tratados por tags nem error
export type Unhandled<TInput, TCases> = Exclude<
  TInput,
  | (TagsOf<TInput> extends keyof TCases
      ? Extract<TInput, { readonly tag: keyof TCases }>
      : never)
  | ('error' extends keyof TCases ? NonTaggedErrorOf<TInput> : never)
>;

/**
 * Helper type to extract the union of return types from a cases object.
 */
export type ExtractReturnTypes<T> = T extends Record<
  string,
  (...args: any[]) => infer R
>
  ? R
  : never;

/**
 * Tipo que representa um caso padrão (wildcard) no pattern matching.
 *
 * Usado quando nem todos os casos específicos são cobertos e é necessário
 * um tratamento genérico para casos não previstos.
 */
export type DefaultCase = { default: (e: TaggedError<string>) => any };

/**
 * Tipo que representa cases completos onde todos os casos possíveis são cobertos.
 *
 * Garante que existe uma função de tratamento para cada tag possível.
 */
export type AllCases<Tag extends string, Error extends TaggedError<Tag>> = {
  [K in Tag]: (e: Extract<Error, { tag: K }>) => any;
};

/**
 * Tipo que representa cases parciais com um caso padrão.
 *
 * Permite cobrir apenas alguns casos específicos e delegar o resto
 * para o caso padrão (wildcard default).
 */
export type SomeCases<
  Tag extends string,
  Error extends TaggedError<Tag>
> = Partial<AllCases<Tag, Error>> & DefaultCase;
