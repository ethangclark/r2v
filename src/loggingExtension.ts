export const loggingExtension: Function | null = (() => {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as any).__REDUX_DEVTOOLS_EXTENSION__ || null;
})();
