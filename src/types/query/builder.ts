import { TypedBinding } from 'lupdo';
import BuilderContract from '../../query/builder-contract';
import Expression from '../../query/expression';

import GrammarI from '../base-grammar';
import { ConnectionSessionI } from '../connection';
import ProcessorI from '../processor';

import JoinClauseI from './join-clause';
import Registry, { BindingTypes } from './registry';

export type Stringable = string | Expression;
export type PrimitiveBinding = string | number | bigint | Date | boolean | Buffer | TypedBinding;
export type NotExpressionBinding = PrimitiveBinding | null;
export type NotNullableBinding = PrimitiveBinding | Expression;
export type Binding = NotNullableBinding | null | Expression;

export type BooleanCallback = (query: BuilderContract) => boolean;
export type QueryAbleCallback = (query: BuilderContract) => void;
export type JoinCallback = (join: JoinClauseI) => void;

export type QueryAble = BuilderContract | Stringable;
export type SubQuery = QueryAble | QueryAbleCallback;
export type SelectColumn = Stringable | { [key: string]: BuilderContract | QueryAbleCallback };

export type WhereTuple = [Stringable, string | Binding, Binding?];
export type WhereColumnTuple = [Stringable, Stringable, Stringable?];
export type BetweenTuple = [Stringable | number | bigint | Date, Stringable | number | bigint | Date];

export interface RowValues {
    [key: string]: Binding;
}

export interface NumericValues {
    [key: string]: number;
}

export type ConditionBoolean = 'and' | 'or';
export type OrderDirection = 'asc' | 'desc' | 'ASC' | 'DESC';
export type WhereMethod = 'where' | 'whereColumn';

export interface FullTextOptions {
    mode?: string;
    expanded?: boolean;
    language?: string;
}

export interface Arrayable {
    /**
     * Get the instance as an array.
     */
    toArray: () => Binding[];
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
