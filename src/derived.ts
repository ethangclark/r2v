import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

import * as mobxUtils from "mobx-utils";
import * as mobx from "mobx";

// TODO: make this a singular function

export function derived<T extends { [key: string]: (...args: any[]) => any }>(
  derivedDef: T
): T {
  Object.entries(derivedDef).forEach(([fieldName, derivationFn]) => {
    (derivedDef as Record<string, (...args: any[]) => any>)[fieldName] =
      mobxUtils.computedFn(derivationFn);
  });
  return mobx.observable(derivedDef);
}
