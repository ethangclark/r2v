// normally we would import this from `libraryImports`,
// but it needs to be imported *first* to ensure config happens before observables are created
import { configure } from "mobx";
import { disableWarning } from "./warningUtils";

const wellIntentionedConfigureErrorMessage =
  "WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled.";

disableWarning(
  (warning) => warning.includes(wellIntentionedConfigureErrorMessage) // LET IT FAIL :D
);

configure({
  enforceActions: "always",

  // // these are broken with the current setup, but would be sweet to use
  // computedRequiresReaction: true,
  // observableRequiresReaction: true,
  // reactionRequiresObservable: true,

  disableErrorBoundaries:
    typeof process !== "undefined" && process.env.NODE_ENV !== "production",

  safeDescriptors: true,

  isolateGlobalState: true,
});

export function disableWarnings() {
  configure({
    computedRequiresReaction: false,
    observableRequiresReaction: false,
    reactionRequiresObservable: false,
  });
}

export function integrateGlobalState() {
  configure({ isolateGlobalState: false });
}
