import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import { computedFn as mobxComputedFn } from "mobx-utils";

export function Materialization<T extends (...args: any[]) => any>(def: T) {
  return mobxComputedFn(def);
}
