import { ObservableBase, Setters } from "./types";

function fieldNameToSetterName(fieldName: string) {
  return "set" + fieldName.slice(0, 1).toUpperCase() + fieldName.slice(1);
}
function hasSetterDefined(fieldName: string, observableBase: ObservableBase) {
  return fieldNameToSetterName(fieldName) in observableBase;
}
function setterNameToFieldName(setterName: string) {
  return setterName[3].toLowerCase() + setterName.slice(4);
}
function isSetterWithDefinedField(key: string, observableBase: ObservableBase) {
  return /^set[A-Z]/.test(key) && setterNameToFieldName(key) in observableBase;
}
function shouldNotDefineSetter(key: string, observableBase: ObservableBase) {
  if (isSetterWithDefinedField(key, observableBase)) {
    return true;
  }
  if (hasSetterDefined(key, observableBase)) {
    return true; // do not override custom setters.
    // If they define a field with a setter's name + a non-function value, TypeScript will punish them,
    // as their resultant type will include FunctionType & ValueType for the field
  }
  return false;
}

// mutates in-place
export function addSettersWhereNoExist<T extends ObservableBase>(
  observableBase: T
): T & Setters<T> {
  Object.keys(observableBase).forEach((key) => {
    if (shouldNotDefineSetter(key, observableBase)) {
      return;
    }
    const setterName = fieldNameToSetterName(key);
    (observableBase as Record<string, any>)[setterName] = function (
      value: any
    ) {
      this[key] = value;
    };
  });
  return observableBase as T & Setters<T>;
}
