import * as mobxReactLite from "mobx-react-lite";

export function observer(
  fnComponent: Parameters<typeof mobxReactLite.observer>[0]
) {
  return mobxReactLite.observer(fnComponent);
}
