export { autorun, reaction } from "mobx";
export { observer } from "mobx-react";

import { makeAutoObservable } from "mobx";
import { ObservableBase } from "./types";
import { initializeIdempotent, logResultantState } from "./devToolLogger";

type ObservableCollection = { [key: string]: ObservableBase };

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

const stack: string[] = [];

export function observable<T extends ObservableBase>(
  observableName: string,
  observableBase: T
): T {
  if (observables[observableName]) {
    throw Error(`observableName "${observableName}" is already in use`);
  }
  updateObservablesJson(observableName, observableBase);
  Object.keys(observableBase).forEach((key) => {
    const { value } =
      Object.getOwnPropertyDescriptor(observableBase, key) || {};
    if (value instanceof Function) {
      const boundMethod = value.bind(observableBase); // necessary. own-variable reference doesn't work with TS
      (observableBase as unknown as Record<string, Function>)[key] = (
        ...args: Array<any>
      ) => {
        initializeIdempotent(observablesAsJson);
        const stackSnapshot = [...stack];
        const methodSignature = `${observableName}.${key}`;
        stack.push(methodSignature);
        boundMethod(...args);
        stack.pop();
        updateObservablesJson(observableName, observableBase);
        logResultantState(
          { type: methodSignature, methodCallStack: stackSnapshot },
          observablesAsJson
        );
      };
    }
  });
  makeAutoObservable(observableBase); // note: makeAutoObservable transforms the original object
  observables[observableName] = observableBase;
  setTimeout(() => initializeIdempotent(observablesAsJson));
  return observableBase;
}
