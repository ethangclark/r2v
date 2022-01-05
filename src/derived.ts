import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import * as mobxUtils from "mobx-utils";

export function derived<T extends (...args: any[]) => any>(def: T) {
  return mobxUtils.computedFn(def);
}
