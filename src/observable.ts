import { makeAutoObservable } from "mobx";
import { computedFn } from "mobx-utils";
import {
  ObservableBase,
  ObservableCollection,
  ValueSetters,
  WithFunctionsAsReturns,
} from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";

const observables: ObservableCollection = {};

const methodStack: string[] = [];

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): WithFunctionsAsReturns<T> & ValueSetters<T> {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }

  const hasHadFunctionsSetToReturns: WithFunctionsAsReturns<T> = (() => {
    Object.entries(observableBase).forEach(([key, value]) => {
      if (value instanceof Function) {
        (observableBase as Record<string, any>)[key] = value();
      }
    });
    return observableBase as WithFunctionsAsReturns<T>;
  })();

  const hasHadSettersAdded = addValueSettersWhereNoExist(
    hasHadFunctionsSetToReturns
  ); // mutates in-place
  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value instanceof Function) {
      (hasHadSettersAdded as Record<string, Function>)[key] = computedFn(
        (...args: Array<any>) => {
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
        }
      );
    }
  });
  const hasHadSettersAddedAndFunctionsUnthunk =
    hasHadSettersAdded as WithFunctionsAsReturns<T> & ValueSetters<T>;
  const hasBeenMadeObservable = makeAutoObservable(
    hasHadSettersAddedAndFunctionsUnthunk
  ); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  noteObservable(observableName, hasBeenMadeObservable);
  return hasBeenMadeObservable;
}
