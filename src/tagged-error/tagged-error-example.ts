/**
 * Exemplos exploratorios para ver como o TypeScript lida com TaggedError
 */

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

function test(value: number) {
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

const opResult = test(1); // TimeoutError | ExpirationError | HttpError | "ok"

if (opResult instanceof TaggedError) {
  // Aqui, o TypeScript sabe que opResult é uma TaggedError

  // All cases required
  const result = TaggedError.match(opResult, {
    TimeoutError: (e) => e.timelimit, // e is infered as TimeoutError
    ExpirationError: (e) => e.timelimit, // e is ExpirationError
    HttpError: (e) => e.text, // e is infered as HttpError
  }); // result: sould be number | string but is unknown

  // If default is provided, not all case hanlders are needed (or none at all)
  const result2 = TaggedError.match(opResult, {
    TimeoutError: (e) => 1,
    '*': (e) => 'Unknown error',
  }); // result2: sould be number | string, the call does not compile.
} else {
  // Aqui, o TypeScript sabe que opResult não é uma TaggedError (no caso, é "ok")
}
