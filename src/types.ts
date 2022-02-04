export type Json =
  | null
  | boolean
  | number
  | string
  | Array<Json>
  | { [key: string]: Json };

export type StateModuleShape = {
  [key: string]: Json | Function; // not using more-specific (...args: any[]) => any , as that (for some reason) makes observables the "any" type
};

export type ObservableCollection = Record<string, StateModuleShape>;
