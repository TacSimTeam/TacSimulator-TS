import { Failure, Result, Success } from './result';

/**
 * Resultで要素を返すdocument.querySelector()のラッパー関数
 *
 * @param selectors セレクター(id, class, nameなど)
 * @returns Result<取得したHTML要素, undefined>
 */
export function querySelector<Element extends HTMLElement = HTMLElement>(
  selectors: string
): Result<Element, undefined> {
  const element = document.querySelector<Element>(selectors);
  if (element === null) {
    return new Failure(undefined);
  }
  return new Success(element);
}
