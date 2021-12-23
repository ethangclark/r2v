export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Array<Json>;

export type JsonObject = { [key: string]: Json };
