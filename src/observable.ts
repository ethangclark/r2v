import { makeAutoObservable } from "mobx";
import { computedFn } from "mobx-utils";
import {
  ObservableBase,
  ObservableCollection,
  ValueSetters,
  WithMethodsUnthunk,
} from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";

const observables: ObservableCollection = {};

const methodStack: string[] = [];

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): WithMethodsUnthunk<T> & ValueSetters<T> {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }

  const hasHadMethodsUnthunk: WithMethodsUnthunk<T> = (() => {
    Object.entries(observableBase).forEach(([key, value]) => {
      if (value instanceof Function) {
        (observableBase as Record<string, any>)[key] = value(); // TODO
      }
    });
    return observableBase as WithMethodsUnthunk<T>;
  })();

  const hasHadSettersAdded = addValueSettersWhereNoExist(hasHadMethodsUnthunk); // mutates in-place
  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value instanceof Function) {
      (hasHadSettersAdded as Record<string, (...args: any[]) => any>)[key] =
        computedFn((...args: Array<any>) => {
          const stackSnapshot = [...methodStack];
          const methodSignature = `${observableName}.${key}`;
          methodStack.push(methodSignature);
          const result = value(...args);
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
          return result;
        });
    }
  });
  const withUnthunkednessPresumedNotToConflictWithValueSetters =
    hasHadSettersAdded as WithMethodsUnthunk<T> & ValueSetters<T>;
  const hasBeenMadeObservable = makeAutoObservable(
    withUnthunkednessPresumedNotToConflictWithValueSetters
  ); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
