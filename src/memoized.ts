import { observable } from "./observable";
import { derived } from "./derived";
import { reactively } from "./reactively";
import { loggingExtension } from "./loggingExtension";
import { ObservableCollection } from "./types";

export const allMemoized: ObservableCollection = {};

type State = {
  name: string;
  zeroParamResults: Record<string, any>;
  stack: Array<string>;
};

const derivations = observable("__derivations", {
  record(intermediateStates: Array<State>) {
    intermediateStates.forEach(({ name, zeroParamResults }) => {
      const observable = allMemoized[name];
      Object.entries(zeroParamResults).forEach(([fieldName, value]) => {
        (observable as Record<string, any>)[fieldName] = value;
      });
    });
  },
});

let states: Array<State> = [];
let timeout: ReturnType<typeof setTimeout> | null = null;

export function memoized<T extends Record<string, (...args: any[]) => any>>(
  name: string,
  def: T
) {
  if (!loggingExtension) {
    return derived(def);
  }

  // TODO: we can actually track results of functions and return the results,
  // allowing us to track all results...
  // PROBLEM: no way to untrack, so this will create a memory leak,
  // and no-longer listened to derived state won't continue to update.
  // SOLUTION?: clear all state on memoized observers after every batch?
  // OTHER SOUTION: opt-in logging?
  const d = derived(def);

  const obsBase: Record<string, null> = {};
  Object.entries(def).forEach(([fieldName, fn]) => {
    if (fn.length === 0) {
      obsBase[fieldName] = null;
    }
  });
  const obs = observable(name, obsBase);
  allMemoized[name] = obs;

  reactively(() => {
    const zeroParamResults: Record<string, any> = {};
    Object.entries(d).forEach(([fieldName, derivedImpl]) => {
      if (derivedImpl.length === 0) {
        zeroParamResults[fieldName] = derivedImpl();
      }
    });
    states.push({
      name,
      zeroParamResults,
      stack:
        Error()
          .stack?.split("\n")
          .slice(1)
          .map((l) => l.trim()) || [],
    });
    clearTimeout(timeout as any);
    timeout = setTimeout(() => {
      derivations.record(states);
      states = [];
    });
  });

  return d;
}

// makeObservable && makeMemoized ?
