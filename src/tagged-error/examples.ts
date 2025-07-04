/* oxlint-disable */
/* eslint-disable */

/**
 * Exemplos exploratorios para ver como o TypeScript lida com TaggedError
 */

import { handle } from './handle.js';
import { TaggedError } from './TaggedError.js';

class TimeoutError extends TaggedError('TimeoutError') {
  public readonly timelimit = 10;
}

class ExpirationError extends TaggedError('ExpirationError') {
  public readonly timelimit = 5;
}

class HttpError extends TaggedError('HttpError') {
  constructor(
    public readonly statusCode: number,
    public readonly text: string
  ) {
    super();
  }
}

function doSomething(value: number) {
  if (value === 1) {
    return new TimeoutError();
  }
  if (value === 2) {
    return new ExpirationError();
  }
  if (value === 3) {
    return new HttpError(400, 'Bad Request');
  }

  return 'ok' as const;
}

const something = doSomething(1); // TimeoutError | ExpirationError | HttpError | "ok"

// Expectation: number | string | boolean;
export const exampleResult1 = handle(something).when({
  // Matches tagged error TimeoutError
  TimeoutError: (e /* TimeoutError */) => e.timelimit, // number

  // Matches tagged error HttpError
  HttpError: (e /* HttpError */) => e.statusCode, // number

  // `error` is always optional, matches any error. If provided, the parameter
  // will ALWAYS be of type `Error`, and any unhandled error types of
  // maybeResult will be considered handled
  error: (e /* Error */) => e.message, // string

  // Optional IF all known types of maybeResult were handled (exhaustive), in
  // which case value is of type `unknown`. Required IF not all known types of
  // maybeResult were handled (non-exhaustive), in which case value's type is
  // the union of all known types of maybeResult types excluding the ones
  // already handled.
  value: (value /* "ok" */) => false, // boolean
}); // number | string | boolean

// Expectation: number | "ok";
export const exampleResult2 = handle(something).when({
  TimeoutError: (e /* TimeoutError */) => e.timelimit, // number
  HttpError: (e /* HttpError */) => e.statusCode, // number
  ExpirationError: (e /* ExpirationError */) => e.timelimit, // number

  // Se value não fosse fornecido aqui, o TypeScript reclamaria porque há
  // tipos conhecidos não tratados
  value: (value /* "ok" */) => value, // "ok"
});

// Expectation: number | "ok";
export const exampleResult3 = handle(something).when({
  TimeoutError: (e /* TimeoutError */) => e.timelimit, // number
  HttpError: (e /* HttpError */) => e.statusCode, // number

  // Se value não fosse fornecido aqui, o TypeScript reclamaria porque há
  // tipos conhecidos não tratados
  value: (value /* ExpirationError | "ok" */) => {
    if (typeof value === 'string') {
      return value;
    }

    throw new Error('Unexpected error', { cause: value });
  },
});

// Este é um exemplo de tratamento parcial com um handler específico para
// TimeoutError, `error` tratando qualque error e `value` tratando não-erros.
// Expectation: number | string | boolean
export const exampleResult4 = handle(something).when({
  TimeoutError: (e /* TimeoutError */) => e.timelimit, // number
  error: (e /* Error */) => e.message, // string
  value: (value /* "ok" */) => value === 'ok', // boolean
});

// Este é um exemplo de tratamento parcial com `error` tratando todos os erros e
// `value` tratando não-erros, basicamente funcionando como try-catch.
// Expectation: true
export const exampleResult5 = handle(something).when({
  error: (e /* Error */) => {
    throw new Error('Unexpected error', { cause: e });
  }, // never
  value: (value /* "ok" */) => true as const, // true
});
