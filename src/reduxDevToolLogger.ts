import { createStore, Store, Action } from "redux";
import { JsonObject } from "./types";

const extension: Function | null = (() => {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as any).__REDUX_DEVTOOLS_EXTENSION__ || null;
})();

let reduxStore: Store<JsonObject, Action<any>> | null = null;
let loggedOnDispatch: JsonObject = {};

let initialized = false;

export function initializeIdempotent(baseState: JsonObject) {
  if (initialized) {
    return;
  }
  initialized = true;
  if (!extension) {
    return console.error(
      "install Redux DevTools (Google it) to see application state"
    );
  }
  reduxStore = createStore(() => loggedOnDispatch, baseState, extension());
}

export function logResultantState(
  event: JsonObject & { type: string },
  state: JsonObject
) {
  initializeIdempotent({});
  if (reduxStore) {
    loggedOnDispatch = JSON.parse(JSON.stringify(state));
    reduxStore.dispatch(event);
  }
}
