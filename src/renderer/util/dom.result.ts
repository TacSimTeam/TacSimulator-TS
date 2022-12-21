import { Failure, Result, Success } from './result';

export function querySelector<Element extends HTMLElement = HTMLElement>(
  selectors: string
): Result<Element, undefined> {
  const element = document.querySelector<Element>(selectors);
  if (element === null) {
    return new Failure(undefined);
  }
  return new Success(element);
}
