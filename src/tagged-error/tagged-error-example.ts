/**
 * Exemplos exploratorios para ver como o TypeScript lida com TaggedError
 */

import { TaggedError } from "./TaggedError.js";

class TimeoutError extends TaggedError("TimeoutError") {
  public readonly timelimit = 10;
}

class ExpirationError extends TaggedError("ExpirationError") {
  public readonly timelimit = 5;
}

class HttpError extends TaggedError("HttpError") {
  constructor(
    public readonly statusCode: number,
    public readonly text: string,
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
    return new HttpError(400, "Bad Request");
  }

  return "ok" as const;
}

const opResult = test(1); // TimeoutError | ExpirationError | HttpError | "ok"

if (opResult instanceof TaggedError) {
  // Aqui, o TypeScript sabe que opResult é uma TaggedError

  TaggedError.match(opResult)
    .with("TimeoutError", (e) => e.timelimit)
    .with("ExpirationError", (e) => e.timelimit)
    .with("HttpError", (e) => e.text)
    .exhaustive();

  TaggedError.match(opResult)
    .with("TimeoutError", (e) => e.timelimit)
    .otherwise((e) => {
      throw new Error("Unexpected error", { cause: e });
    });
} else {
  // Aqui, o TypeScript sabe que opResult não é uma TaggedError (no caso, é "ok")
}
