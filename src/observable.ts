import * as mobx from "mobx";
import { ObservableShape, ValueSetters, ObservableCollection } from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";
import { asRecord } from "./asRecord";
import { derived } from "./derived";

export const observables: ObservableCollection = {};

const actionStack: string[] = [];
let actionId = 0;

export function observable<T extends ObservableShape>(
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
    annotations[key] = mobx.observable;
    if (value instanceof Function) {
      const asDerived = derived(value);
      const asAction = (...args: any[]) => {
        let result;
        mobx.runInAction(() => {
          const actionStackSnapshot = [...actionStack];
          const actionSignature = `${actionId++}: ${observableName}.${key}`;
          actionStack.push(actionSignature);
          result = asDerived(...args);
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
      asRecord(hasHadSettersAdded)[key] = (...args: any[]) => {
        if (mobx._isComputingDerivation()) {
          return asDerived(...args);
        } else {
          return asAction(...args);
        }
      };
    }
  });

  const hasBeenMadeObservable = mobx.makeObservable(
    hasHadSettersAdded,
    annotations
  ); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
