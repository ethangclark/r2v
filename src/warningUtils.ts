const { warn } = console;

// todo: test

export async function withWarningsDisabled(
  isWarningDisabled: (warning: string) => boolean,
  cb: Function
) {
  console.warn = (...args) => {
    for (const arg of args) {
      if (typeof arg === "string" && isWarningDisabled(arg)) {
        return;
      }
    }
  };
  await cb();
  console.warn = warn;
}
