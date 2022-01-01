import { configure } from "mobx";
import { disableWarning } from "./warningUtils";

const wellIntentionedConfigureErrorMessage =
  "WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled.";

disableWarning(
  (warning) => warning.includes(wellIntentionedConfigureErrorMessage) // LET IT FAIL :D
);

configure({
  enforceActions: "always", // so we can _easily_ track what happens in redux devtools

  // these restrictions _may_ help with learning, but they make everything else cumbersome
  computedRequiresReaction: false,
  observableRequiresReaction: false,

  // We're not going to yell at users for unnecessarily wrapping components with `observer`
  reactionRequiresObservable: false,

  // It is NOT worth sacrificing stack traces for "continuing to work after an error"
  disableErrorBoundaries: true,

  // If a user is using custom property descriptors, probably a good idea to yell at them.
  safeDescriptors: true,

  // We allow users to leverage our version of mobx via `import { mobx } from 'better-mobx' if they wish
  isolateGlobalState: true,
});
