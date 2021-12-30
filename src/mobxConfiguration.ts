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
  // Users can batch operations via `runInAction` but aren't required to,
  // as performance is rarely a concern.
  // Better to avoid constraints and allow users to optimized where they've measured it's necessary.
  enforceActions: "never",

  // These would be sweet to use, as they'd prevent the most common mobx stumbling block
  // (dereferencing outside of observers),
  // but they don't work with our `observable` construct,
  // because there's no way to differentiate between actions and computed values.
  computedRequiresReaction: false,
  observableRequiresReaction: false,

  // We're not going to yell at users for unnecessarily wrapping components with `observer`
  reactionRequiresObservable: false,

  // It is NOT worth sacrificing stack traces for "continuing to work after an error"
  disableErrorBoundaries: true,

  // If a user is using custom property descriptors, probably a good idea to yell at them.
  safeDescriptors: true,

  // Just to be safe. We allow users to disable this via `integrateGlobalState`.
  isolateGlobalState: true,
});

export function integrateGlobalState() {
  configure({ isolateGlobalState: false });
}
