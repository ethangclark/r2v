export type Json =
  | null
  | boolean
  | number
  | string
  | Array<Json>
  | { [key: string]: Json };

export type ObservableBase = {
  [key: string]: Json | (() => Function);
};

export type AsObservable<T extends ObservableBase> = {
  [Key in keyof T]: T[Key] extends Function ? ReturnType<T[Key]> : T[Key];
};

export type Observable = {
  [key: string]: Json | Function;
};

export type ObservableCollection = Record<string, Observable>;

type NonCapsToCaps = {
  a: "A";
  b: "B";
  c: "C";
  d: "D";
  e: "E";
  f: "F";
  g: "G";
  h: "H";
  i: "I";
  j: "J";
  k: "K";
  l: "L";
  m: "M";
  n: "N";
  o: "O";
  p: "P";
  q: "Q";
  r: "R";
  s: "S";
  t: "T";
  u: "U";
  v: "V";
  w: "W";
  x: "X";
  y: "Y";
  z: "Z";
};
type Caps = NonCapsToCaps[keyof NonCapsToCaps];

// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
export type ValueSetters<T> = {
  [Key in keyof T as Key extends `set${Caps}${string}`
    ? never
    : `set${Capitalize<string & Key>}`]: T[Key] extends Function
    ? never
    : (value: T[Key]) => void;
};

export type WithFunctionsAsReturns<T> = {
  [Key in keyof T]: T[Key] extends () => Function ? ReturnType<T[Key]> : T[Key];
};
