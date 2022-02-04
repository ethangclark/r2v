import * as mobx from "mobx";

export function Reaction(def: () => (() => void) | void) {
  let andThen = () => {};
  const dispose = mobx.reaction(
    () => {
      andThen = def() || (() => {});
    },
    () => andThen(),
    { fireImmediately: true }
  );

  return {
    end() {
      dispose();
    },
  };
}
