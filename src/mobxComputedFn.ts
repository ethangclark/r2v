import { disableWarning } from "./warningUtils";

disableWarning((str) =>
  str.includes(
    `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`
  )
);

export { computedFn as mobxComputedFn } from "mobx-utils";
