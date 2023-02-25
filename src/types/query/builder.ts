import { TypedBinding } from 'lupdo';
import BuilderContract from '../../query/builder-contract';

import GrammarI from '../base-grammar';
import { ConnectionSessionI } from '../connection';
import ProcessorI from '../processor';

import ExpressionContract from '../../query/expression-contract';
import RegistryI, { BindingTypes } from './registry';

export type Stringable = string | ExpressionContract;
export type PrimitiveBinding = string | number | bigint | Date | boolean | Buffer | TypedBinding;
export type NotExpressionBinding = PrimitiveBinding | null;
export type NotNullableBinding = PrimitiveBinding | ExpressionContract;
export type Binding = NotNullableBinding | null | ExpressionContract;

export type BooleanCallback<T, U extends BuilderContract> = (query: U) => T;
export type QueryAbleCallback<T extends BuilderContract> = (query: T) => void;

export type QueryAble = BuilderContract | Stringable;
export type SubQuery<T extends BuilderContract> = QueryAble | QueryAbleCallback<T>;
export type SelectColumn<T extends BuilderContract> =
    | Stringable
    | { [key: string]: BuilderContract | QueryAbleCallback<T> };

export type WhereTuple = [Stringable, string | Binding, Binding?];
export type WhereObject = {
    [key: string]: Binding;
};
export type WhereColumnTuple = [Stringable, Stringable, Stringable?];

export type BetweenTuple = [Stringable | number | bigint | Date, Stringable | number | bigint | Date];
export type BetweenColumnsTuple = [Stringable, Stringable];

export interface RowValues {
    [key: string]: any;
}

export interface NumericValues {
    [key: string]: number | bigint | string;
}

export type ConditionBoolean = `${'A' | 'a'}${'N' | 'n'}${'D' | 'd'}` | `${'O' | 'o'}${'R' | 'r'}`;
export type OrderDirection =
    | `${'A' | 'a'}${'S' | 's'}${'C' | 'c'}`
    | `${'D' | 'd'}${'E' | 'e'}${'S' | 's'}${'C' | 'c'}`;
export type WhereMethod = 'where' | 'whereColumn';

export interface FulltextOptions {
    mode?: string;
    expanded?: boolean;
    language?: string;
}

export interface Arrayable<Item> {
    /**
     * Get the instance as an array.
     */
    toArray(): Item[];
}

export type BuilderConstructor = new (
    connection: ConnectionSessionI,
    grammar?: GrammarI,
    processor?: ProcessorI
) => BuilderI;

export default interface BuilderI extends BuilderContract {
    /**
     * Get a new instance of the join clause builder.
     */
    newQuery(): BuilderI;

    /**
     * Clone the query.
     */
    clone(): BuilderI;

    /**
     * Clone the query without the given registry properties.
     */
    cloneWithout(properties: (keyof RegistryI)[]): BuilderI;

    /**
     * Clone the query without the given bindings.
     */
    cloneWithoutBindings(except: (keyof BindingTypes)[]): BuilderI;
}
