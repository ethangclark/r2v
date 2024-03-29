const substringsThatTriggerNoopLog = [
  `invoking a computedFn from outside an reactive context won't be memoized, unless keepAlive is set`,
  "WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled",
];

const actionMessageToOverride =
  "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed";
const actionMessageOverride =
  "Mutating state outside of a method is not allowed";

const { warn: originalWarn } = console;

console.warn = (...args) => {
  for (const arg of args) {
    if (typeof arg === "string") {
      for (const substr of substringsThatTriggerNoopLog) {
        if (arg.includes(substr)) {
          return;
        }
        if (arg.includes(actionMessageToOverride)) {
          throw Error(actionMessageOverride);
        }
      }
    }
  }
  originalWarn(...args);
};
