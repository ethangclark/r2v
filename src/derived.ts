import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import { computedFn, observable as mobxObservable } from "./libraryImports";

export function derived<T extends { [key: string]: Function }>(
  derivedDef: T
): T {
  Object.entries(derivedDef).forEach(([fieldName, derivationFn]) => {
    const boundFn = derivationFn.bind(derivedDef); // TODO: test if this is necessary
    const asComputed = computedFn(boundFn);
    (derivedDef as Record<string, Function>)[fieldName] =
      computedFn(asComputed);
  });
  return mobxObservable(derivedDef);
}
