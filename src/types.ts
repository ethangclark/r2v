export type Json =
  | null
  | boolean
  | number
  | string
  | Array<Json>
  | { [key: string]: Json };

export type ObservableShape = {
  [key: string]: Json | Function; // not using more-specific (...args: any[]) => any , as that (for some reason) makes observables the "any" type
};

export type AsObservable<T extends ObservableShape> = {
  [Key in keyof T]: T[Key] extends (...args: any[]) => any
    ? ReturnType<T[Key]>
    : T[Key];
};

export type ObservableCollection = Record<string, ObservableShape>;

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
    : T[Key] extends (...args: any[]) => any
    ? never
    : `set${Capitalize<string & Key>}`]: (value: T[Key]) => void;
};

// TODO: do not define if something else is already set (and document)
