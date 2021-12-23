export type ObservableFields =
  | null
  | boolean
  | number
  | string
  | Array<ObservableFields>
  | { [key: string]: ObservableFields }
  | ((...params: any[]) => void);

export type ObservableBase = { [key: string]: ObservableFields };
