import { reaction as mobxReaction } from "./libraryImports";

export function reactively<T>(
  reaction: () => T,
  postReaction: (value: T, previousValue: T | undefined) => void = () => {},
  runPostRxnImmediately: boolean = true
) {
  const dispose = mobxReaction(
    reaction,
    (value, previousValue) => postReaction(value, previousValue),
    {
      fireImmediately: runPostRxnImmediately,
    }
  );
  return function stop() {
    dispose();
  };
}
