import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import { makeAutoObservable, computedFn } from "./libraryImports";
import { ObservableBase, ObservableCollection, ValueSetters } from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";

const observables: ObservableCollection = {};

const actionStack: string[] = [];
let actionId = 0;

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): T & ValueSetters<T> {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }

  const hasHadSettersAdded = addValueSettersWhereNoExist(observableBase); // mutates in-place
  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value instanceof Function) {
      const asString = value.toString();
      const isComputed = asString.includes("return") || !asString.includes("{"); // TODO: refine

      const boundMethod = value.bind(observableBase);

      if (isComputed) {
        (hasHadSettersAdded as Record<string, Function>)[key] =
          computedFn(boundMethod);
      } else {
        (hasHadSettersAdded as Record<string, Function>)[key] = (
          ...args: Array<any>
        ) => {
          const actionStackSnapshot = [...actionStack];
          const actionSignature = `${actionId++}: ${observableName}.${key}`;
          actionStack.push(actionSignature);
          const result = boundMethod(...args);
          actionStack.pop();
          logResultantState(
            {
              type: actionSignature, // PROBLEM: this is always "doubleB" when testing with "browser.tsx"
              actionStack: actionStackSnapshot,
              stack:
                Error()
                  .stack?.split("\n")
                  .slice(1)
                  .map((line) => line.trim()) || null,
              arg0: args[0],
              args,
            },
            observables
          );
          return result;
        };
      }
    }
  });
  const hasBeenMadeObservable = makeAutoObservable(hasHadSettersAdded); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
