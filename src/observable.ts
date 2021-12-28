import { makeAutoObservable } from "mobx";
import { computedFn } from "mobx-utils";
import { ObservableBase, ObservableCollection, Setters } from "./types";
import { addSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";

const observables: ObservableCollection = {};

const methodStack: string[] = [];

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): T & Setters<T> {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }
  const hasHadSettersAdded = addSettersWhereNoExist(observableBase); // mutates in-place
  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value instanceof Function) {
      const boundMethod = value.bind(hasHadSettersAdded); // necessary b/c own-variable reference doesn't work with TS
      (hasHadSettersAdded as Record<string, Function>)[key] = computedFn(
        (...args: Array<any>) => {
          const stackSnapshot = [...methodStack];
          const methodSignature = `${observableName}.${key}`;
          methodStack.push(methodSignature);
          boundMethod(...args);
          methodStack.pop();
          logResultantState(
            {
              type: methodSignature,
              methodStack: stackSnapshot,
              arg0: args[0],
              args,
            },
            observables
          );
        }
      );
    }
  });
  const hasBeenMadeObservable = makeAutoObservable(hasHadSettersAdded); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
