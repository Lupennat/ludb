import { TypedBinding } from 'lupdo';
import ExpressionContract from '../query/expression-contract';

export type Stringable = string | ExpressionContract;

export type Binding = string | number | bigint | Date | boolean | Buffer | null | ExpressionContract | TypedBinding;
export type BindingExclude<T> = Exclude<Binding, T>;

export type BindingObject = {
    [key: string]: Binding;
};
export type BindingExcludeObject<T> = {
    [key: string]: BindingExclude<T>;
};
