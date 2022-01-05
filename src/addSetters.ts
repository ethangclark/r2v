import { asRecord } from "./asRecord";
import { ObservableShape, Caps } from "./types";

function fieldNameToSetterName(fieldName: string) {
  return "set" + fieldName.slice(0, 1).toUpperCase() + fieldName.slice(1);
}
function hasSetterDefined(fieldName: string, observableBase: ObservableShape) {
  return fieldNameToSetterName(fieldName) in observableBase;
}
function shouldDefineSetter(key: string, observableBase: ObservableShape) {
  if (observableBase[key] instanceof Function) {
    return false;
  }
  if (hasSetterDefined(key, observableBase)) {
    return false; // do not override custom setters.
    // If they define a field with a setter's name + a non-function value, TypeScript will punish them,
    // as their resultant type will include FunctionType & ValueType for the field
  }
  return true;
}
function shouldDefineErroringSetter(
  key: string,
  observableBase: ObservableShape
) {
  const { get, set } =
    Object.getOwnPropertyDescriptor(observableBase, key) || {};
  return get instanceof Function && set === undefined;
}

// mutates in-place
export function addValueSettersWhereNoExist<T extends ObservableShape>(obj: T) {
  Object.keys(obj).forEach((key) => {
    if (!shouldDefineSetter(key, obj)) {
      return;
    }
    const setterName = fieldNameToSetterName(key);
    if (shouldDefineErroringSetter(key, obj)) {
      asRecord(obj)[setterName] = function () {
        throw Error(
          `property "${key}" has a "get" function defined but no "set" function, so we have no way of setting the value using auto-generated setter`
        );
      };
    } else {
      asRecord(obj)[setterName] = function (value: any) {
        asRecord(obj)[key] = value;
      };
    }
  });

  // this type logic as initiall encapsulated in a `ValueSetters` generic type,
  // but we're inlining it because it improves type hints.
  return obj as T & {
    [Key in keyof T as Key extends `set${Caps}${string}`
      ? never
      : T[Key] extends (...args: any[]) => any
      ? never
      : `set${Capitalize<string & Key>}`]: (value: T[Key]) => void;
  };
}
