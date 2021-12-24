export type ObservableFields =
  | null
  | boolean
  | number
  | string
  | Array<ObservableFields>
  | { [key: string]: ObservableFields }
  | ((...params: any[]) => void);

export type ObservableBase = { [key: string]: ObservableFields };

export type ObservableCollection = Record<string, ObservableBase>;

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
export type Setters<T> = {
  [Key in keyof T as Key extends `set${Caps}${string}`
    ? never
    : `set${Capitalize<string & Key>}`]: (value: T[Key]) => void;
};
