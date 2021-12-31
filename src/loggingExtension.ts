export const loggingExtension: ((...args: any[]) => any) | null = (() => {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as any).__REDUX_DEVTOOLS_EXTENSION__ || null;
})();
