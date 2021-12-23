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

// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
export type Setters<T> = {
  [Key in keyof T as `set${Capitalize<string & Key>}`]: (value: T[Key]) => void;
};
