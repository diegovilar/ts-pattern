/* oxlint-disable */
/* eslint-disable */

import { TaggedError } from './TaggedError';

type ReturnTypes<TCase> = unknown; // Placeholder type, needs to be implemented

type Cases<TInput, THandlers> = object; // Placeholder type, needs to be implemented

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
export function handle<TInput>(value: TInput): Handler<TInput> {
  return new Handler(value);
}

export class Handler<TInput> {
  constructor(private readonly input: TInput) {}

  when<THandlers extends object>(
    cases: Cases<TInput, THandlers>
  ): ReturnTypes<THandlers>;

  when(cases: Record<string, unknown>) {
    const input = this.input;

    if (input instanceof Error) {
      const handlers: Array<{ tag: string; handler: unknown }> = [
        { tag: 'Error', handler: cases['error'] },
      ];

      if (input instanceof TaggedError) {
        handlers.unshift({ tag: input.tag, handler: cases[input.tag] });
      }

      for (const { tag, handler } of handlers) {
        if (typeof handler === 'undefined') {
          continue;
        }

        if (handler === 'throw') {
          throw input;
        } else if (handler === 'null') {
          return null;
        } else if (typeof handler === 'function') {
          return handler(input);
        }

        throw new TypeError(`Invalid handler provided for ${tag}`);
      }

      throw new TypeError(
        `Unhandled error: [${input.name}: ${input.message}]`,
        { cause: input }
      );
    }

    const defaultHandler = cases['default'];

    if (typeof defaultHandler === 'undefined') {
      throw new TypeError(`No default handler provided for value`);
    } else if (typeof defaultHandler !== 'function') {
      throw new TypeError(`Invalid default handler provided`);
    }

    return defaultHandler(input);
  }
}
