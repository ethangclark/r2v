import { createStore, Store, Action } from "redux";
import { ObservableBase, ObservableCollection } from "./types";

let observablesAsJson: Record<string, string> = {};

export function noteObservable(observableName: string, obs: ObservableBase) {
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

const extension: Function | null = (() => {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as any).__REDUX_DEVTOOLS_EXTENSION__ || null;
})();

let reduxStore: Store<ObservableBase, Action<any>> | null = null;

let initialized = false;
export function initializeIdempotent() {
  if (initialized) {
    return;
  }
  initialized = true;
  if (!extension) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.error(
        "install Redux DevTools (Google it) to see application state"
      );
    }
    return;
  }
  prepForLogging();
  reduxStore = createStore(() => toLog, toLog, extension());
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
