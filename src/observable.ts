import { makeAutoObservable } from "mobx";
import { ObservableBase, ObservableCollection, Setters } from "./types";
import { initializeIdempotent, logResultantState } from "./devToolLogger";

const observables: ObservableCollection = {};
let observablesAsJson: ObservableCollection = {};
function updateObservablesJson(
  observableName: string,
  observableBase: ObservableBase
) {
  observablesAsJson = {
    ...observablesAsJson,
    [observableName]: JSON.parse(JSON.stringify(observableBase)),
  };
}

// mutates in-place
function addSettersWhereNoExist<T extends ObservableBase>(
  observableBase: T
): T & Setters<T> {
  Object.keys(observableBase).forEach((key) => {
    const setterName = "set" + key.slice(0, 1).toUpperCase() + key.slice(1);
    if (setterName in observableBase) {
      return; // do not override custom setters.
      // If they define a field with a setter's name + a non-function value, TypeScript will punish them,
      // as their resultant type will include FunctionType & ValueType for the field
    }
    (observableBase as Record<string, any>)[setterName] = function (
      value: any
    ) {
      this[key] = value;
    };
  });
  return observableBase as T & Setters<T>;
}

const stack: string[] = [];

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): T & Setters<T> {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }
  updateObservablesJson(observableName, observableBase);
  setTimeout(() => initializeIdempotent(observablesAsJson));
  const hasHadSettersAdded = addSettersWhereNoExist(observableBase); // mutates in-place
  Object.keys(hasHadSettersAdded).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(hasHadSettersAdded, key) || {};
    if (value instanceof Function) {
      const boundMethod = value.bind(hasHadSettersAdded); // necessary b/c own-variable reference doesn't work with TS
      (hasHadSettersAdded as Record<string, Function>)[key] = (
        ...args: Array<any>
      ) => {
        initializeIdempotent(observablesAsJson);
        const stackSnapshot = [...stack];
        const methodSignature = `${observableName}.${key}`;
        stack.push(methodSignature);
        boundMethod(...args);
        stack.pop();
        updateObservablesJson(observableName, hasHadSettersAdded);
        logResultantState(
          { type: methodSignature, methodCallStack: stackSnapshot },
          observablesAsJson
        );
      };
    }
  });
  const hasBeenMadeObservable = makeAutoObservable(hasHadSettersAdded); // mutates in-place
  observables[observableName] = hasBeenMadeObservable;
  return hasBeenMadeObservable;
}
