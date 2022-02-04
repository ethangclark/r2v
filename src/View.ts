import * as mobxReactLite from "mobx-react-lite";

export function View(...params: Parameters<typeof mobxReactLite.observer>) {
  return mobxReactLite.observer(...params);
}
