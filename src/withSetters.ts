import { ObservableBase } from "./types";

type Setters<T> = {
  [Key in keyof T as `set${Capitalize<string & Key>}`]: (value: T[Key]) => void;
};

export function withSetters<T extends ObservableBase>(
  observableBase: T
): T & Setters<T> {
  const setters: any = {};
  Object.keys(observableBase).forEach((key) => {
    const setterName = "set" + key.slice(0, 1).toUpperCase() + key.slice(1);
    setters[setterName] = function (value: any) {
      this[key] = value;
    };
  });
  return Object.assign(setters, observableBase);
}
