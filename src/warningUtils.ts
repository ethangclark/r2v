// TODO: test

export function disableWarning(
  isWarningDisabled: (warning: string) => boolean
) {
  const { warn } = console;
  console.warn = (...args) => {
    for (const arg of args) {
      if (typeof arg === "string" && isWarningDisabled(arg)) {
        return;
      }
    }
    warn(...args);
  };
}
