import {
  ObservableBase,
  Observable,
  ObservableCollection,
  Json,
} from "./types";
import { runInAction, createStore, Store, Action } from "./libraryImports";
import { loggingExtension } from "./loggingExtension";

const observables: ObservableCollection = {};
let observablesAsJson: Record<string, string> = {};

export function noteObservable(observableName: string, obs: Observable) {
  if (!loggingExtension) {
    return;
  }
  observables[observableName] = obs;
  observablesAsJson[observableName] = JSON.stringify(obs);
}

let lastLoggedAsJson: Record<string, string> = {};
let toLog: Record<string, ObservableBase> = {};

// if any observable's JSON representation has changed, sets toLog = { ...toLog, ...changes }
// (Redux uses object equality comparison to determine if changes have taken place)
function prepForLogging() {
  let changed = false;
  Object.entries(observablesAsJson).forEach(
    ([observableName, observableJson]) => {
      if (lastLoggedAsJson[observableName] !== observableJson) {
        if (!changed) {
          changed = true;
          toLog = { ...toLog };
        }
        toLog[observableName] = JSON.parse(observableJson);
      }
    }
  );
  if (changed) {
    lastLoggedAsJson = { ...observablesAsJson };
  }
}

function initialize(extension: Function) {
  prepForLogging();
  const store = createStore(() => toLog, toLog, extension());
  store.subscribe(() => {
    const state = store?.getState();
    if (state && state !== toLog) {
      runInAction(() => {
        Object.entries(state).forEach(([observableName, observableBase]) => {
          const obs = observables[observableName];
          obs &&
            Object.entries(observableBase as Record<string, Json>).forEach(
              ([fieldName, fieldValue]) => {
                obs[fieldName] = fieldValue;
              }
            );
        });
      });
    }
  });
  return store;
}

let initialized = false;
let reduxStore: Store<Record<string, ObservableBase>, Action<any>> | null =
  null;
function initializeIdempotent() {
  if (initialized) {
    return reduxStore;
  }
  initialized = true;
  if (!loggingExtension) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.error(
        "install Redux DevTools (Google it) to see application state"
      );
    }
    return null;
  }
  reduxStore = initialize(loggingExtension);
  return reduxStore;
}

export function logResultantState(
  event: ObservableBase & { type: string },
  observables: ObservableCollection
) {
  const store = initializeIdempotent();
  if (store) {
    Object.entries(observables).forEach(([observableName, obs]) => {
      noteObservable(observableName, obs);
    });
    prepForLogging();
    store.dispatch(event);
  }
}

// ensure initialization happens so that base state shows up in devTools
setTimeout(initializeIdempotent);
