import { observer as mobxReactLiteObserver } from "mobx-react-lite";

export function View(...params: Parameters<typeof mobxReactLiteObserver>) {
  return mobxReactLiteObserver(...params);
}
