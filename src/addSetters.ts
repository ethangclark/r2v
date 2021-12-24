import { ObservableBase, Setters } from "./types";

function setterNameToFieldName(setterName: string) {
  return setterName[3].toLowerCase() + setterName.slice(4);
}
function isSetterWithField(key: string, observableBase: ObservableBase) {
  return /^set[A-Z]/.test(key) && setterNameToFieldName(key) in observableBase;
}

// mutates in-place
export function addSettersWhereNoExist<T extends ObservableBase>(
  observableBase: T
): T & Setters<T> {
  Object.keys(observableBase).forEach((key) => {
    if (isSetterWithField(key, observableBase)) {
      return;
    }
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
