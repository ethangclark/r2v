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
  observables[observableName] = obs;
  observablesAsJson[observableName] = JSON.stringify(obs);
}

let lastLoggedAsJson: Record<string, string> = {};
let toLog: Record<string, ObservableBase> = {};

// if any observable's JSON representation has changed, sets toLog = { ...toLog, ...changes }
// (Redux uses object equality comparison to determine if changes have taken place)
function prepForLogging() {
  toLog = { ...toLog };
  Object.entries(observablesAsJson).forEach(
    ([observableName, observableJson]) => {
      if (lastLoggedAsJson[observableName] !== observableJson) {
        toLog[observableName] = JSON.parse(observableJson);
      }
    }
  );
  lastLoggedAsJson = { ...observablesAsJson };
}

let reduxStore: Store<ObservableBase, Action<any>> | null = null;

let initialized = false;
function initializeIdempotent() {
  if (initialized) {
    return;
  }
  initialized = true;
  if (!loggingExtension) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.error(
        "install Redux DevTools (Google it) to see application state"
      );
    }
    return;
  }
  prepForLogging();
  reduxStore = createStore(() => toLog, toLog, loggingExtension());
  reduxStore.subscribe(() => {
    const state = reduxStore?.getState();
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
}

export function logResultantState(
  event: ObservableBase & { type: string },
  observables: ObservableCollection
) {
  initializeIdempotent();
  if (reduxStore) {
    Object.entries(observables).forEach(([observableName, obs]) => {
      noteObservable(observableName, obs);
    });
    prepForLogging();
    reduxStore.dispatch(event);
  }
}

// ensure initialization happens so that base state shows up in devTools
setTimeout(initializeIdempotent);
