import { TypedBinding } from 'lupdo';
import BuilderContract from '../../query/builder-contract';

import GrammarI from '../base-grammar';
import { ConnectionSessionI } from '../connection';
import ProcessorI from '../processor';

import ExpressionContract from '../../query/expression-contract';
import JoinClauseI from './join-clause';
import Registry, { BindingTypes } from './registry';

export type Stringable = string | ExpressionContract;
export type PrimitiveBinding = string | number | bigint | Date | boolean | Buffer | TypedBinding;
export type NotExpressionBinding = PrimitiveBinding | null;
export type NotNullableBinding = PrimitiveBinding | ExpressionContract;
export type Binding = NotNullableBinding | null | ExpressionContract;

export type BooleanCallback<T, U extends BuilderContract = BuilderContract> = (query: U) => T;
export type QueryAbleCallback<T extends BuilderContract = BuilderContract> = (query: T) => void;
export type JoinCallback = (join: JoinClauseI) => void;

export type QueryAble = BuilderContract | Stringable;
export type SubQuery = QueryAble | QueryAbleCallback;
export type SelectColumn = Stringable | { [key: string]: BuilderContract | QueryAbleCallback };

export type WhereTuple = [Stringable, string | Binding, Binding?];
export type WhereObject = {
    [key: string]: Binding;
};
export type WhereColumnTuple = [Stringable, Stringable, Stringable?];

export type BetweenTuple = [Stringable | number | bigint | Date, Stringable | number | bigint | Date];
export type BetweenColumnsTuple = [Stringable, Stringable];

export interface RowValues {
    [key: string]: Binding;
}

export interface NumericValues {
    [key: string]: number | bigint;
}

export type ConditionBoolean = 'and' | 'or';
export type OrderDirection = 'asc' | 'desc' | 'ASC' | 'DESC';
export type WhereMethod = 'where' | 'whereColumn';

export interface FulltextOptions {
    mode?: string;
    expanded?: boolean;
    language?: string;
}

export interface Arrayable {
    /**
     * Get the instance as an array.
     */
    toArray: <T>() => T[];
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
    cloneWithout(properties: (keyof Registry)[]): BuilderI;

    /**
     * Clone the query without the given bindings.
     */
    cloneWithoutBindings(except: (keyof BindingTypes)[]): BuilderI;
}
