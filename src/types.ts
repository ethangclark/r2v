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
