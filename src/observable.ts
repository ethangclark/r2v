import {
  makeObservable,
  runInAction,
  observable as mobxObservable,
} from "./libraryImports";
import { ObservableBase, ValueSetters } from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";
import { observables } from "./observables";

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
  const annotations: Record<string, any> = {};

  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value === undefined) {
      return;
    }
    annotations[key] = mobxObservable;
    if (value instanceof Function) {
      const boundActionImpl = value.bind(hasHadSettersAdded);
      (hasHadSettersAdded as Record<string, any>)[key] = (...args: any[]) => {
        let result;
        runInAction(() => {
          const actionStackSnapshot = [...actionStack];
          const actionSignature = `${actionId++}: ${observableName}.${key}`;
          actionStack.push(actionSignature);
          result = boundActionImpl(...args);
          actionStack.pop();
          logResultantState(
            {
              type: actionSignature,
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
        });
        return result;
      };
    }
  });

  const hasBeenMadeObservable = makeObservable(hasHadSettersAdded, annotations); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
