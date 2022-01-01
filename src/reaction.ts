import { mobxReaction } from "./mobxImports";

export function reaction(def: () => (() => void) | void) {
  let andThen = () => {};
  const dispose = mobxReaction(
    () => {
      andThen = def() || (() => {});
    },
    () => andThen(),
    { fireImmediately: true }
  );

  return function stop() {
    dispose();
  };
}
