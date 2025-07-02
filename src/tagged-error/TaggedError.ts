/**
 * TaggedError - Sistema de erros com tags para pattern matching type-safe
 *
 * Este módulo implementa um sistema avançado de tratamento de erros que combina:
 * - Tagged unions para discriminação de tipos
 * - Pattern matching declarativo e exhaustivo
 * - Type safety completa com TypeScript
 * - Herança e extensibilidade
 *
 * Principais componentes:
 * - `TaggedErrorConstructor`: Classe base abstrata
 * - `taggedErrorFactory`: Função factory para criação de classes específicas
 * - `TaggedError`: Export híbrido que combina ambos
 * - Sistema de tipos auxiliares para pattern matching
 *
 * @example
 * ```typescript
 * import { TaggedError } from "./TaggedError.js";
 *
 * class NetworkError extends TaggedError("NetworkError") {
 *   constructor(public readonly status: number) {
 *     super(`HTTP ${status}`);
 *   }
 * }
 *
 * class TimeoutError extends TaggedError("TimeoutError") {
 *   constructor(public readonly duration: number) {
 *     super(`Timeout after ${duration}ms`);
 *   }
 * }
 *
 * function handleError(error: NetworkError | TimeoutError) {
 *   return TaggedError.match(error)
 *     .with("NetworkError", (e) => retryRequest())
 *     .with("TimeoutError", (e) => increaseTimeout(e.duration))
 *     .exhaustive();
 * }
 * ```
 */

/**
 * Classe base abstrata para criar erros com tags que suportam pattern matching type-safe.
 *
 * TaggedError combina o conceito de tagged unions com pattern matching para permitir
 * tratamento de erros discriminado e type-safe. Cada erro possui uma tag que o identifica
 * unicamente, permitindo que o TypeScript rastreie e diferencie os tipos automaticamente.
 *
 * @example
 * ```typescript
 * // Criação via herança direta
 * abstract class MyErrorBase<T extends string> extends TaggedError<T> {}
 *
 * // Criação via factory (mais comum)
 * class TimeoutError extends TaggedError("TimeoutError") {
 *   constructor(public readonly timelimit: number) {
 *     super("Request timed out");
 *   }
 * }
 *
 * class ValidationError extends TaggedError("ValidationError") {
 *   constructor(public readonly field: string) {
 *     super(`Invalid field: ${field}`);
 *   }
 * }
 *
 * // Uso com pattern matching
 * function handleError(error: TimeoutError | ValidationError) {
 *   return TaggedError.match(error)
 *     .with("TimeoutError", (e) => `Timeout after ${e.timelimit}ms`)
 *     .with("ValidationError", (e) => `Field error: ${e.field}`)
 *     .exhaustive();
 * }
 * ```
 */

class Match<TInput extends TaggedError<any>, TOutput> {
  readonly #error: TInput;
  readonly #cases: Map<TInput["tag"], (e: TInput) => TOutput> = new Map();

  constructor(error: TInput) {
    this.#error = error;
  }

  with<TSelectedTags extends TInput["tag"][]>(
    ...args: [
      ...tags: TSelectedTags,
      handler: (
        error: Extract<TInput, { tag: TSelectedTags[number] }>
      ) => TOutput,
    ]
  ): Match<Exclude<TInput, { tag: TSelectedTags[number] }>, TOutput> {
    const handler = args[args.length - 1] as (e: TInput) => TOutput;
    const tags = args.slice(0, args.length - 1) as TSelectedTags;

    for (const tag of tags) {
      this.#cases.set(tag, handler);
    }

    return this as any;
  }

  otherwise(handler: (e: TInput) => TOutput): TOutput {
    const caseHandler = this.#cases.get(this.#error.tag);
    if (caseHandler) {
      return caseHandler(this.#error);
    }
    return handler(this.#error);
  }

  exhaustive(this: Match<never, TOutput>): TOutput {
    const self = this as any as Match<TaggedError<string>, TOutput>;
    const caseHandler = self.#cases.get(self.#error.tag);

    if (caseHandler) {
      return caseHandler(self.#error);
    }

    throw new Error(`Exhaustive match failed for tag "${self.#error.tag}"`);
  }
}

abstract class TaggedErrorConstructor<Tag extends string> extends Error {
  #tag: Tag;

  static {
    fixName(TaggedErrorConstructor, "TaggedError");
  }

  /**
   * Constrói uma nova instância de TaggedError.
   *
   * @param tag - String literal que identifica o tipo do erro
   * @param message - Mensagem de erro opcional
   * @param options - Opções adicionais do Error padrão do JavaScript
   */
  public constructor(tag: Tag, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.#tag = tag;
    fixPrototype(this, new.target.prototype);
  }

  /**
   * Obtém a tag que identifica unicamente este tipo de erro.
   *
   * A tag é uma string literal que permite ao TypeScript diferenciar entre
   * diferentes tipos de TaggedError em union types e pattern matching.
   *
   * @returns A tag string que identifica o tipo do erro
   */
  public get tag() {
    return this.#tag;
  }

  /**
   * Inicia o processo de pattern matching type-safe baseado na tag do erro.
   *
   * Retorna um builder que permite encadear casos com `.with()` e finalizar
   * com `.exhaustive()` ou `.otherwise()`.
   *
   * @returns Um builder de `Match` para construção do pattern matching.
   *
   * @example
   * ```typescript
   * // Pattern matching completo e exaustivo
   * const result = TaggedError.match(error)
   *   .with("TimeoutError", (e) => `Timeout: ${e.timelimit}ms`)
   *   .with("ValidationError", (e) => `Invalid: ${e.field}`)
   *   .with("NetworkError", (e) => `Network: ${e.statusCode}`)
   *   .exhaustive();
   *
   * // Pattern matching com caso padrão
   * const result = TaggedError.match(error)
   *   .with("TimeoutError", (e) => handleTimeout(e))
   *   .otherwise((e) => handleUnexpectedError(e));
   * ```
   */
  public static match<TInput extends TaggedError<any>, TOutput>(error: TInput): Match<TInput, TOutput> {
    return new Match(error);
  }
}

/**
 * Função factory que cria uma classe TaggedError com uma tag específica.
 *
 * Esta é a forma mais comum de criar novos tipos de TaggedError. A função
 * retorna uma classe que pode ser estendida para adicionar propriedades
 * e comportamentos específicos ao tipo de erro.
 *
 * @param tag - String literal que identifica unicamente o tipo do erro
 * @returns Classe que estende TaggedError com a tag fornecida
 *
 * @example
 * ```typescript
 * // Criação de classes de erro específicas
 * class NetworkError extends TaggedError("NetworkError") {
 *   constructor(
 *     public readonly statusCode: number,
 *     public readonly url: string
 *   ) {
 *     super(`Network error ${statusCode} for ${url}`);
 *   }
 * }
 *
 * class TimeoutError extends TaggedError("TimeoutError") {
 *   constructor(public readonly duration: number) {
 *     super(`Operation timed out after ${duration}ms`);
 *   }
 * }
 *
 * // Uso
 * const error = new NetworkError(404, "https://api.example.com");
 * console.log(error.tag); // "NetworkError"
 * console.log(error.statusCode); // 404
 * ```
 */
function taggedErrorFactory<Tag extends string>(tag: Tag) {
  return class extends TaggedError<Tag> {
    static {
      fixName(TaggedError, `TaggedError<${tag}>`);
    }

    constructor(message?: string, options?: ErrorOptions) {
      super(tag, message, options);
    }
  };
}

/**
 * Export principal que combina a classe TaggedError com a função factory.
 *
 * Este export híbrido permite tanto herança direta da classe quanto
 * uso da função factory para criar classes específicas com tags.
 *
 * @example
 * ```typescript
 * // Uso como factory (mais comum)
 * class MyError extends TaggedError("MyError") {}
 *
 * // Uso como classe base (para casos avançados)
 * abstract class BaseError<T extends string> extends TaggedError<T> {}
 * ```
 *
 * @see {@link taggedErrorFactory}
 */
export const TaggedError =
  TaggedErrorConstructor as typeof TaggedErrorConstructor &
    typeof taggedErrorFactory;

/**
 * Tipo que representa uma instância de TaggedError com uma tag específica.
 *
 * Use este tipo para anotar variáveis que devem conter erros com tags específicas.
 *
 * @example
 * ```typescript
 * type MyErrorType = TaggedError<"MyError">;
 *
 * function handleError(error: TaggedError<"TimeoutError" | "NetworkError">) {
 *   // TypeScript sabe que error tem uma duas tags
 * }
 * ```
 */
export type TaggedError<Tag extends string> = TaggedErrorConstructor<Tag>;

/**
 * Corrige o nome de uma função/classe para melhor debugging e inspeção.
 *
 * Define a propriedade `name` e `Symbol.toStringTag` para garantir que
 * as classes TaggedError apareçam com nomes corretos nos debuggers
 * e no console.
 *
 * @param target - Função ou classe a ter o nome corrigido
 * @param name - Nome que deve ser atribuído à função/classe
 */
/* eslint-disable-next-line @typescript-eslint/no-unsafe-function-type */
function fixName(target: Function, name: string): void {
  Object.defineProperty(target, "name", { configurable: true, value: name });

  if (
    target.prototype &&
    Object.getOwnPropertyDescriptor(target.prototype, Symbol.toStringTag) ==
      null
  ) {
    Object.defineProperty(target.prototype, Symbol.toStringTag, {
      configurable: true,
      value: name,
    });
  }
}

/**
 * Corrige a cadeia de protótipos para garantir funcionamento correto do `instanceof`.
 *
 * Necessário devido às peculiaridades do TypeScript/JavaScript com herança
 * de classes built-in como Error. Garante que `instanceof` funcione corretamente.
 *
 * @param instance - Instância a ter o protótipo corrigido
 * @param prototype - Protótipo que deve ser atribuído à instância
 *
 * @see {@link https://github.com/Microsoft/TypeScript/issues/13965#comment-278570200}
 */
// https://github.com/Microsoft/TypeScript/issues/13965#comment-278570200
function fixPrototype(instance: object, prototype: object) {
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(instance, prototype);
  } else {
    (instance as { __proto__: unknown }).__proto__ = prototype;
  }
}