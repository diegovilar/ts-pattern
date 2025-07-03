/* oxlint-disable */
/* eslint-disable */

import type { TaggedError } from './TaggedError';

/**
 * Executa pattern matching type-safe baseado na tag do erro.
 *
 * Permite tratar diferentes tipos de erro de forma declarativa e exhaustiva.
 * O TypeScript garante que todos os casos sejam cobertos ou que exista um caso padrão.
 *
 * @param error - A instância do erro a ser correspondida.
 * @param cases - Objeto mapeando tags para funções de tratamento.
 * @returns O resultado da função de tratamento correspondente à tag.
 *
 * @throws When no case matches the tag and there is no default case.
 *
 * @example
 * ```typescript
 * // Pattern matching completo e exaustivo
 * const result = default(error, {
 *   TimeoutError: (e) => `Timeout: ${e.timelimit}ms`,
 *   ValidationError: (e) => `Invalid: ${e.field}`,
 *   NetworkError: (e) => `Network: ${e.statusCode}`,
 * });
 *
 * // Pattern matching com caso padrão
 * const result = default(error, {
 *   TimeoutError: (e) => handleTimeout(e),
 *   default: (e) => handleUnexpectedError(e),
 * });
 * ```
 */
export function handle<
  TInput extends TaggedError<any>,
  TCase extends AllCases<TInput['tag'], TInput>
>(error: TInput, cases: TCase): ExtractReturnTypes<TCase>;
export function handle<
  TInput extends TaggedError<any>,
  TCase extends SomeCases<TInput['tag'], TInput>
>(error: TInput, cases: TCase): ExtractReturnTypes<TCase>;
export function handle<
  TInput extends TaggedError<any>,
  TCase extends
    | AllCases<TInput['tag'], TInput>
    | SomeCases<TInput['tag'], TInput>
>(error: TInput, cases: TCase): ExtractReturnTypes<TCase> {
  const tag = error.tag;

  if (typeof (cases as any)[tag] === 'function') {
    return (cases as any)[tag](error);
  }

  if ('default' in cases && typeof (cases as any)['default'] === 'function') {
    return (cases as any)['default'](error);
  }

  throw new Error(`No case found for tag '${tag}'`);
}

// Extrai todos os tipos TaggedError de TInput
type TaggedErrorOf<T> = T extends { readonly tag: infer Tag extends string }
  ? T extends Error
    ? T
    : never
  : never;

// Extrai todas as tags possíveis de TInput
type TagsOf<T> = TaggedErrorOf<T> extends {
  readonly tag: infer Tag extends string;
}
  ? Tag
  : never;

// Extrai todos os tipos Error de TInput que NÃO são TaggedError
type NonTaggedErrorOf<T> = T extends Error
  ? T extends { readonly tag: string }
    ? never
    : T
  : never;

// Calcula os tipos não tratados por tags nem error
type Unhandled<TInput, TCases> = Exclude<
  TInput,
  | (TagsOf<TInput> extends keyof TCases
      ? Extract<TInput, { readonly tag: keyof TCases }>
      : never)
  | ('error' extends keyof TCases ? NonTaggedErrorOf<TInput> : never)
>;

/**
 * Helper type to extract the union of return types from a cases object.
 */
type ExtractReturnTypes<T> = T extends Record<
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
type DefaultCase = { default: (e: TaggedError<string>) => any };

/**
 * Tipo que representa cases completos onde todos os casos possíveis são cobertos.
 *
 * Garante que existe uma função de tratamento para cada tag possível.
 */
type AllCases<Tag extends string, Error extends TaggedError<Tag>> = {
  [K in Tag]: (e: Extract<Error, { tag: K }>) => any;
};

/**
 * Tipo que representa cases parciais com um caso padrão.
 *
 * Permite cobrir apenas alguns casos específicos e delegar o resto
 * para o caso padrão (wildcard default).
 */
type SomeCases<Tag extends string, Error extends TaggedError<Tag>> = Partial<
  AllCases<Tag, Error>
> &
  DefaultCase;
