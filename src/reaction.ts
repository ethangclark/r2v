import * as mobx from "mobx";

export function reaction(def: () => (() => void) | void) {
  let andThen = () => {};
  const dispose = mobx.reaction(
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
