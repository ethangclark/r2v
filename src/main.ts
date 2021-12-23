import { makeAutoObservable } from "mobx";
export { autorun, reaction } from "mobx";
export { observer } from "mobx-react";
import { initializeIdempotent, logResultantState } from "./reduxDevToolLogger";

const stores = {};
let storesJson = {};
function updateStoresJson(storeName: string, storeBase: {}) {
  storesJson = {
    ...storesJson,
    [storeName]: JSON.parse(JSON.stringify(storeBase)),
  };
}

const stack: string[] = [];

export function observable<T extends object>(
  objectName: string,
  objectBase: T
): T {
  if (stores[objectName]) {
    throw new Error(`storeName "${objectName}" is already in use`);
  }
  if (Object.getPrototypeOf(objectBase) !== Object.getPrototypeOf({})) {
    throw new Error("storeBase must be a plain object");
  }
  updateStoresJson(objectName, objectBase);
  Object.keys(objectBase).forEach((key) => {
    const { value } = Object.getOwnPropertyDescriptor(objectBase, key) || {};
    if (value instanceof Function) {
      const boundMethod = value.bind(objectBase);
      objectBase[key] = (...args) => {
        initializeIdempotent(storesJson);
        const stackSnapshot = [...stack];
        const methodSignature = `${objectName}.${key}`;
        stack.push(methodSignature);
        boundMethod(...args);
        stack.pop();
        updateStoresJson(objectName, objectBase);
        logResultantState(
          { type: methodSignature, methodCallStack: stackSnapshot },
          storesJson
        );
      };
    }
  });
  makeAutoObservable(objectBase);
  const store = objectBase as T;
  stores[objectName] = store;
  setTimeout(() => initializeIdempotent(storesJson));
  return store;
}
