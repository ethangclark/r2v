import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import { computedFn, observable as mobxObservable } from "./libraryImports";
import { noteObservable } from "./devToolLogger";
import { observables } from "./observables";

export function derived<T extends { [key: string]: Function }>(
  observableName: string, // TODO: rethink naming
  derivedDef: T
): T {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }

  Object.entries(derivedDef).forEach(([fieldName, derivationFn]) => {
    const boundFn = derivationFn.bind(derivedDef); // TODO: test if this is necessary
    const asComputed = computedFn(boundFn);
    (derivedDef as Record<string, Function>)[fieldName] =
      computedFn(asComputed);
  });

  const derived = mobxObservable(derivedDef);
  observables[observableName] = derived;
  noteObservable(observableName, derived);

  return derived;
}
