export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// === Type Mapping =============================================

type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

export type ArgType = keyof TypeMap;

// === Inference Engine =========================================

type IsGuaranteed<T> =
  T extends { required: true } ? true :
  T extends { default: string | number | boolean } ? true :
  false;

export type InferParsed<Defs extends readonly { readonly name: string; readonly type: ArgType }[]> = Prettify<
  { [D in Defs[number] as IsGuaranteed<D> extends true ? D['name'] : never]: TypeMap[D['type']] }
  &
  { [D in Defs[number] as IsGuaranteed<D> extends true ? never : D['name']]?: TypeMap[D['type']] }
>;