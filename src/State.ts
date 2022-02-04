import * as mobx from "mobx";
import { StateModuleShape, ObservableCollection } from "./types";
import { addValueSettersWhereNoExist } from "./addSetters";
import { logResultantState, noteObservable } from "./devToolLogger";
import { Materialization } from "./Materialization";

const observables: ObservableCollection = {};

const actionStack: string[] = [];
let actionId = 0;

let anonymousNameCount = 1;
function getAnonymousName() {
  return `<ANON#${anonymousNameCount++}>`;
}

type StateParams<T extends StateModuleShape> = [string, T] | [T];

export function State<T extends StateModuleShape>(...params: StateParams<T>) {
  const observableName = (
    params.length === 2 ? params[0] : getAnonymousName()
  ) as string;
  const observableBase = (params.length === 2 ? params[1] : params[0]) as T;

  if (observables[observableName]) {
    throw Error(`state module name "${observableName}" is already in use`);
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
      const asMaterialization = Materialization(value);
      const asAction = (...args: any[]) => {
        let result;
        mobx.runInAction(() => {
          const actionStackSnapshot = [...actionStack];
          const actionSignature = `${actionId++}: ${observableName}.${key}`;
          actionStack.push(actionSignature);
          result = asMaterialization(...args);
          actionStack.pop();
          logResultantState(
            {
              type: actionSignature,
              actionStack: actionStackSnapshot,
              arg0: args[0],
              args,
            },
            observables
          );
        });
        return result;
      };
      //@ts-expect-error
      hasHadSettersAdded[key] = (...args: any[]) => {
        if (mobx._isComputingDerivation()) {
          return asMaterialization(...args);
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
