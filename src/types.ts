export type Json =
  | null
  | boolean
  | number
  | string
  | Array<Json>
  | { [key: string]: Json };

export type ObservableBase = {
  [key: string]: Json | Function; // for some reason making this "Json | (args: any[]) => any" breaks typing in that `const state = observable({ x: 2, x2: () => state.x * 2 })` won't work...
};

export type AsObservable<T extends ObservableBase> = {
  [Key in keyof T]: T[Key] extends (...args: any[]) => any
    ? ReturnType<T[Key]>
    : T[Key];
};

export type Observable = {
  // TODO: use branded type for this
  [key: string]: Json | Function;
};

export type ObservableCollection = Record<string, Observable>;
