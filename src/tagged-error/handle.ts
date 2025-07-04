/* oxlint-disable */
/* eslint-disable */

import { TaggedError } from './TaggedError';

// Placeholder types, just suggestions but may end up being completely changed
type ReturnTypes<TCase> = unknown;
type Cases<TInput, THandlers> = object;
type TagHandler<Tag extends string> = "null" | "throw" | ((e: TaggedError<Tag>) => any)
type ErrorHandler = "null" | "throw" | ((e: Error) => any)
type ValueHandler = "null" | "pipe" | ((v) => any)


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
export function handle<TInput>(lazyValue: () => Promise<TInput>): Promise<Handler<Awaited<TInput>>>;
export function handle<TInput>(lazyValue: () => TInput): Handler<TInput>;
export function handle<TInput>(value: Promise<TInput>): Promise<Handler<Awaited<TInput>>>;
export function handle<TInput>(value: TInput): Handler<TInput>;
export function handle(arg: unknown): Handler<unknown> | Promise<Handler<unknown>> {
  if (arg instanceof Promise) {
    return arg.then(
      // pipe the resolved value
      resolved => new Handler(resolved),
      // pipe error or create one if rejected
      (cause) => new Handler(cause instanceof Error ? cause : new Error("Unhandled promise rejection", {cause}))
    );
  }

  if (typeof arg === "function") {
    let value: unknown;
    try {
      value = arg();
    } catch (cause) {
      value = cause instanceof Error ? cause : new Error("Unhandled lazy value", {cause});
    }    
    return (value instanceof Promise) ? handle(value) : new Handler(value);
  }
  
  return new Handler(arg);
}

export class Handler<TInput> {
  constructor(private readonly input: TInput) {}

  when<THandlers extends object>(cases: Cases<TInput, THandlers>): ReturnTypes<THandlers>;

  when(cases: Record<string, unknown>) {
    const input = this.input;

    if (input instanceof Error) {
      const handlers: Array<{ name: string; handler: unknown }> = [
        { name: 'Error', handler: cases['error'] },
      ];

      if (input instanceof TaggedError) {
        handlers.unshift({ name: input.tag, handler: cases[input.tag] });
      }

      for (const { name, handler } of handlers) {
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

        throw new TypeError(`Invalid handler provided for ${name}`);
      }

      throw new TypeError(
        `Unhandled error: [${input.name}: ${input.message}]`,
        { cause: input }
      );
    }

    const valueHandler = cases['value'] ?? "pipe";

    if (valueHandler === 'pipe') {
      return input
    } else if (valueHandler === 'null') {
      return null
    } else if (typeof valueHandler === 'function') {
      return valueHandler(input);
    }
    
    throw new TypeError(`Invalid value handler provided`);
  }
}
