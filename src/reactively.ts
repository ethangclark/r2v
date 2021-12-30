import { reaction as mobxReaction } from "./libraryImports";

export function reactively<T>(
  reaction: () => T,
  andThen: (value: T) => void = () => {}
) {
  const dispose = mobxReaction(reaction, (value) => andThen(value), {
    fireImmediately: true,
  });
  return function stop() {
    dispose();
  };
}
