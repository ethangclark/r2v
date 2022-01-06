import { createStore, Store, Action } from "redux";
import * as mobx from "mobx";
import { mapStackTrace } from "sourcemapped-stacktrace";
import { ObservableShape, ObservableCollection, Json } from "./types";
import { loggingExtension } from "./loggingExtension";

const observables: ObservableCollection = {};
let observablesAsJson: Record<string, string> = {};

export function noteObservable(observableName: string, obs: ObservableShape) {
  if (!loggingExtension) {
    return;
  }
  observables[observableName] = obs;
  observablesAsJson[observableName] = JSON.stringify(obs);
}

let lastLoggedAsJson: Record<string, string> = {};
let toLog: Record<string, ObservableShape> = {};

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

function initialize(extension: (...args: any[]) => any) {
  prepForLogging();
  const store = createStore(() => toLog, toLog, extension());

  // time-traveling
  store.subscribe(() => {
    const state = store.getState();

    // toLog is the most recent state we've returned from the reducer
    // (unless we're just about to dispatch an action, which shouldn't be the case here)
    if (state !== toLog) {
      mobx.runInAction(() => {
        Object.entries(state).forEach(([observableName, observableBase]) => {
          const obs = observables[observableName];
          // `obs &&` is to guard against some hypothetical crazy future state where we allow
          // the merger of a user's redux store and better-mobx's logging redux store
          obs &&
            Object.entries(observableBase).forEach(
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
let reduxStore: Store<Record<string, ObservableShape>, Action<any>> | null =
  null;
function initializeIdempotent() {
  if (initialized) {
    return reduxStore;
  }
  initialized = true;
  if (!loggingExtension) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.warn(
        "install Redux DevTools (Google it) to see application state"
      );
    }
    return null;
  }
  reduxStore = initialize(loggingExtension);
  return reduxStore;
}

let queue: Array<Promise<any>> = [];

export async function logResultantState(
  event: { type: string; [key: string]: Json },
  observables: ObservableCollection,
  error: Error
) {
  const store = initializeIdempotent();
  if (store) {
    const promise = (async function () {
      const stack = await new Promise((resolve) =>
        mapStackTrace(error.stack, resolve)
      );
      Object.entries(observables).forEach(([observableName, obs]) => {
        noteObservable(observableName, obs);
      });
      prepForLogging();
      store.dispatch({
        ...event,
        stack,
      });
    })();
    queue.push(promise);
    await Promise.all(queue);
    queue = queue.filter((item) => item !== promise);
  }
}

// ensure initialization happens so that base state shows up in devTools
setTimeout(initializeIdempotent);
