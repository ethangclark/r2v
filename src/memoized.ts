import { observable } from "./observable";
import { derived } from "./derived";
import { reactively } from "./reactively";
import { loggingExtension } from "./loggingExtension";

export function memoized<T extends Record<string, Function>>(
  name: string,
  def: T
) {
  const d = derived(def);

  if (!loggingExtension) {
    return d;
  }

  const obs = observable(name, {
    zeroParamResults: {} as Record<string, any>,
    lastUpdateStack: null as Array<string> | null,
    setResults(results: Record<string, any>, error: Error) {
      obs.zeroParamResults = results;
      obs.lastUpdateStack =
        error.stack
          ?.split("\n")
          .slice(1)
          .map((line) => line.trim()) || null;
    },
  });

  reactively(() => {
    const error = Error();
    const zeroParamResults: Record<string, any> = {};
    Object.entries(d).forEach(([fieldName, derivedImpl]) => {
      if (derivedImpl.length === 0) {
        zeroParamResults[fieldName] = derivedImpl();
      }
    });
    setTimeout(() => obs.setResults(zeroParamResults, error));
  });

  return d;
}

// makeObservable && makeMemoized ?
