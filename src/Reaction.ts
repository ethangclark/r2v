import { reaction as mobxReaction } from "mobx";

export function Reaction(def: () => (() => void) | void) {
  let andThen = () => {};
  const dispose = mobxReaction(
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
