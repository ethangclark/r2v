import { ObservableBase, Setters } from "./types";

// mutates in-place
export function addSettersWhereNoExist<T extends ObservableBase>(
  observableBase: T
): T & Setters<T> {
  Object.keys(observableBase).forEach((key) => {
    const setterName = "set" + key.slice(0, 1).toUpperCase() + key.slice(1);
    if (setterName in observableBase) {
      return; // do not override custom setters.
      // If they define a field with a setter's name + a non-function value, TypeScript will punish them,
      // as their resultant type will include FunctionType & ValueType for the field
    }
    (observableBase as Record<string, any>)[setterName] = function (
      value: any
    ) {
      this[key] = value;
    };
  });
  return observableBase as T & Setters<T>;
}
