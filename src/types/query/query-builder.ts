import ExpressionContract from '../../query/expression-contract';
import DriverConnectionI, { ConnectionSessionI } from '../connection';
import { Binding, BindingExclude, Stringable } from '../generics';
import JoinClauseI from './join-clause';
import RegistryI, { BindingTypes, Where } from './registry';

export type QueryBuilderConstructor<T extends QueryBuilderI> = new (connection: ConnectionSessionI) => T;

export type BooleanCallback<T, U extends QueryBuilderI> = (query: U) => T;

export type ConditionalCallback<T extends QueryBuilderI, U> = (query: T, value: U) => void | T;

export type QueryAbleCallback<T extends QueryBuilderI> = (query: T) => void;

export type SelectColumn<T extends QueryBuilderI> =
    | Stringable
    | { [key: string]: QueryBuilderI | QueryAbleCallback<T> };

export type ConditionBoolean = `${'A' | 'a'}${'N' | 'n'}${'D' | 'd'}` | `${'O' | 'o'}${'R' | 'r'}`;
export type OrderDirection =
    | `${'A' | 'a'}${'S' | 's'}${'C' | 'c'}`
    | `${'D' | 'd'}${'E' | 'e'}${'S' | 's'}${'C' | 'c'}`;
export type WhereMethod = 'where' | 'whereColumn';

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

export interface Objectable<Item> {
    /**
     * Get the instance as an object.
     */
    toObject(): Item;
}

export default interface QueryBuilderI<
    SessionConnection extends ConnectionSessionI<DriverConnectionI> = ConnectionSessionI<DriverConnectionI>
> {
    /**
     * Get Query Builder Registry
     */
    getRegistry(): RegistryI;

    /**
     * Set Query Builder Registry
     */
    setRegistry(registry: RegistryI): this;

    /**
     * Set the columns to be selected.
     */
    select(columns?: SelectColumn<this> | SelectColumn<this>[], ...otherColumns: SelectColumn<this>[]): this;

    /**
     * Add a subselect expression to the query.
     */
    selectSub(query: QueryAbleCallback<this> | QueryBuilderI | Stringable, as: Stringable): this;

    /**
     * Add a new "raw" select expression to the query.
     */
    selectRaw(expression: string, bindings?: Binding[]): this;

    /**
     * Makes "from" fetch from a subquery.
     */
    fromSub(query: QueryAbleCallback<this> | QueryBuilderI | Stringable, as: Stringable): this;

    /**
     * Add a raw from clause to the query.
     */
    fromRaw(expression: string | Stringable, bindings?: Binding[]): this;

    /**
     * Add a new select column to the query.
     */
    addSelect(columns: SelectColumn<this> | SelectColumn<this>[], ...otherColumns: SelectColumn<this>[]): this;

    /**
     * Force the query to only return distinct results.
     */
    distinct(column?: boolean | Stringable, ...columns: Stringable[]): this;

    /**
     * Set the table which the query is targeting.
     */
    from(table: QueryAbleCallback<this> | QueryBuilderI | Stringable, as?: string): this;

    /**
     * Add an index hint to suggest a query index.
     */
    useIndex(index: string): this;

    /**
     * Add an index hint to force a query index.
     */
    forceIndex(index: string): this;

    /**
     * Add an index hint to ignore a query index.
     */
    ignoreIndex(index: string): this;

    /**
     * Add a join clause to the query.
     */
    join(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    join(table: Stringable, first: Stringable, operator: Stringable): this;
    join(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    join(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string
    ): this;

    /**
     * Add a "join where" clause to the query.
     */
    joinWhere(table: Stringable, first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject): this;
    joinWhere(table: Stringable, first: Stringable, second: Binding | QueryAbleCallback<JoinClauseI>): this;
    joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        operator: string,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>,
        type?: string
    ): this;

    /**
     * Add a subquery join clause to the query.
     */
    joinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    joinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: Stringable
    ): this;
    joinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    joinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string
    ): this;

    /**
     * Add a subquery join where clause to the query.
     */
    joinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    joinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        operator: string,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    joinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>,
        type?: string
    ): this;

    /**
     * Add a left join to the query.
     */
    leftJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    leftJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    leftJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    leftJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a "join where" clause to the query.
     */
    leftJoinWhere(table: Stringable, first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject): this;
    leftJoinWhere(table: Stringable, first: Stringable, second: Binding | QueryAbleCallback<JoinClauseI>): this;
    leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        operator: string,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a subquery left join to the query.
     */
    leftJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: Stringable
    ): this;
    leftJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    leftJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a subquery left join where clause to the query.
     */
    leftJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    leftJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        operator: string,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    leftJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a right join to the query.
     */
    rightJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    rightJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    rightJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    rightJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a "right join where" clause to the query.
     */
    rightJoinWhere(table: Stringable, first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject): this;
    rightJoinWhere(table: Stringable, first: Stringable, second: Binding | QueryAbleCallback<JoinClauseI>): this;
    rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        operator: string,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a subquery right join to the query.
     */
    rightJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: Stringable
    ): this;
    rightJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    rightJoinSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a subquery left join where clause to the query.
     */
    rightJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    rightJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI,
        operator: string,
        second: BindingExclude<null> | QueryAbleCallback<JoinClauseI>
    ): this;
    rightJoinWhereSub(
        query: QueryAbleCallback<this> | QueryBuilderI | Stringable,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | QueryBuilderI | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a "cross join" clause to the query.
     */
    crossJoin(table: Stringable): this;
    crossJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    crossJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    crossJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    crossJoin(
        table: Stringable,
        first?: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable | null,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a subquery cross join to the query.
     */
    crossJoinSub(query: QueryAbleCallback<this> | QueryBuilderI | Stringable, as: Stringable): this;

    /**
     * Merge an array of where clauses and bindings.
     */
    mergeWheres(wheres: Where[], bindings: Binding[]): this;

    /**
     * Add a basic where clause to the query.
     */
    where(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    where(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    where(
        column: QueryAbleCallback<this> | QueryBuilderI,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    where(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    where(
        column: QueryAbleCallback<this> | QueryBuilderI,
        operator: string,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    where(
        column: Stringable | QueryAbleCallback<this> | QueryBuilderI | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this> | QueryBuilderI,
        value?: Binding | QueryAbleCallback<this> | QueryBuilderI,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where" clause to the query.
     */
    orWhere(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    orWhere(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    orWhere(
        column: QueryAbleCallback<this> | QueryBuilderI,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    orWhere(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    orWhere(
        column: QueryAbleCallback<this> | QueryBuilderI,
        operator: string,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    orWhere(
        column: Stringable | QueryAbleCallback<this> | QueryBuilderI | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this> | QueryBuilderI,
        value?: Binding | QueryAbleCallback<this> | QueryBuilderI
    ): this;

    /**
     * Add a basic "where not" clause to the query.
     */
    whereNot(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    whereNot(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    whereNot(
        column: QueryAbleCallback<this> | QueryBuilderI,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    whereNot(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this> | QueryBuilderI): this;
    whereNot(
        column: QueryAbleCallback<this> | QueryBuilderI,
        operator: string,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    whereNot(
        column: Stringable | QueryAbleCallback<this> | QueryBuilderI | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this> | QueryBuilderI,
        value?: Binding | QueryAbleCallback<this> | QueryBuilderI,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not" clause to the query.
     */
    orWhereNot(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    orWhereNot(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    orWhereNot(
        column: QueryAbleCallback<this> | QueryBuilderI,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    orWhereNot(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this> | QueryBuilderI): this;
    orWhereNot(
        column: QueryAbleCallback<this> | QueryBuilderI,
        operator: string,
        value: BindingExclude<null> | QueryAbleCallback<this> | QueryBuilderI
    ): this;
    orWhereNot(
        column: Stringable | QueryAbleCallback<this> | QueryBuilderI | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this> | QueryBuilderI,
        value?: Binding | QueryAbleCallback<this> | QueryBuilderI
    ): this;

    /**
     * Add a "where" clause comparing two columns to the query.
     */
    whereColumn(first: WhereColumnTuple[]): this;
    whereColumn(first: Stringable, second: Stringable): this;
    whereColumn(first: Stringable, operator: string, second: Stringable): this;
    whereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where" clause comparing two columns to the query.
     */
    orWhereColumn(first: WhereColumnTuple[]): this;
    orWhereColumn(first: Stringable, second: Stringable): this;
    orWhereColumn(first: Stringable, operator: string, second: Stringable): this;
    orWhereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a "where not" clause comparing two columns to the query.
     */
    whereColumnNot(first: WhereColumnTuple[]): this;
    whereColumnNot(first: Stringable, second: Stringable): this;
    whereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    whereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not" clause comparing two columns to the query.
     */
    orWhereColumnNot(first: WhereColumnTuple[]): this;
    orWhereColumnNot(first: Stringable, second: Stringable): this;
    orWhereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    orWhereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a raw where clause to the query.
     */
    whereRaw(sql: Stringable, bindings?: Binding[], boolean?: ConditionBoolean): this;

    /**
     * Add a raw or where clause to the query.
     */
    orWhereRaw(sql: Stringable, bindings?: Binding[]): this;

    /**
     * Add a "where in" clause to the query.
     */
    whereIn(
        column: Stringable,
        values: QueryBuilderI | QueryAbleCallback<this> | Binding[] | Arrayable<Binding>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where in" clause to the query.
     */
    orWhereIn(
        column: Stringable,
        values: QueryBuilderI | QueryAbleCallback<this> | Binding[] | Arrayable<Binding>
    ): this;

    /**
     * Add a "where not in" clause to the query.
     */
    whereNotIn(
        column: Stringable,
        values: QueryBuilderI | QueryAbleCallback<this> | Binding[] | Arrayable<Binding>,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not in" clause to the query.
     */
    orWhereNotIn(
        column: Stringable,
        values: QueryBuilderI | QueryAbleCallback<this> | Binding[] | Arrayable<Binding>
    ): this;

    /**
     * Add a "where in raw" clause for integer values to the query.
     */
    whereIntegerInRaw(
        column: Stringable,
        values: Binding[] | Arrayable<Binding>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where in raw" clause for integer values to the query.
     */
    orWhereIntegerInRaw(column: Stringable, values: Binding[] | Arrayable<Binding>): this;

    /**
     * Add a "where not in raw" clause for integer values to the query.
     */
    whereIntegerNotInRaw(column: Stringable, values: Binding[] | Arrayable<Binding>, boolean?: ConditionBoolean): this;

    /**
     * Add an "or where not in raw" clause for integer values to the query.
     */
    orWhereIntegerNotInRaw(column: Stringable, values: Binding[] | Arrayable<Binding>): this;

    /**
     * Add a "where null" clause to the query.
     */
    whereNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or where null" clause to the query.
     */
    orWhereNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a "where not null" clause to the query.
     */
    whereNotNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean): this;

    /**
     * Add an "or where not null" clause to the query.
     */
    orWhereNotNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a where between statement to the query.
     */
    whereBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add a where between statement using columns to the query.
     */
    whereBetweenColumns(
        column: Stringable,
        values: BetweenColumnsTuple | Arrayable<Stringable>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an or where between statement to the query.
     */
    orWhereBetween(column: Stringable, values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>): this;

    /**
     * Add an or where between statement using columns to the query.
     */
    orWhereBetweenColumns(column: Stringable, values: BetweenColumnsTuple | Arrayable<Stringable>): this;

    /**
     * Add a where not between statement to the query.
     */
    whereNotBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a where not between statement using columns to the query.
     */
    whereNotBetweenColumns(
        column: Stringable,
        values: BetweenColumnsTuple | Arrayable<Stringable>,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an or where not between statement to the query.
     */
    orWhereNotBetween(column: Stringable, values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>): this;

    /**
     * Add an or where not between statement using columns to the query.
     */
    orWhereNotBetweenColumns(column: Stringable, values: BetweenColumnsTuple | Arrayable<Stringable>): this;

    /**
     * Add a "where date" statement to the query.
     */
    whereDate(column: Stringable, value: Stringable | Date | null): this;
    whereDate(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    whereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where date" statement to the query.
     */
    orWhereDate(column: Stringable, value: Stringable | Date | null): this;
    orWhereDate(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    orWhereDate(column: Stringable, operatorOrValue: Stringable | Date | null, value?: Stringable | Date | null): this;

    /**
     * Add a "where not date" statement to the query.
     */
    whereDateNot(column: Stringable, value: Stringable | Date | null): this;
    whereDateNot(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    whereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not date" statement to the query.
     */
    orWhereDateNot(column: Stringable, value: Stringable | Date | null): this;
    orWhereDateNot(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    orWhereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;

    /**
     * Add a "where time" statement to the query.
     */
    whereTime(column: Stringable, value: Stringable | Date | null): this;
    whereTime(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    whereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where time" statement to the query.
     */
    orWhereTime(column: Stringable, value: Stringable | Date | null): this;
    orWhereTime(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    orWhereTime(column: Stringable, operatorOrValue: Stringable | Date | null, value?: Stringable | Date | null): this;

    /**
     * Add a "where not time" statement to the query.
     */
    whereTimeNot(column: Stringable, value: Stringable | Date | null): this;
    whereTimeNot(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    whereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not time" statement to the query.
     */
    orWhereTimeNot(column: Stringable, value: Stringable | Date | null): this;
    orWhereTimeNot(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    orWhereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;

    /**
     * Add a "where day" statement to the query.
     */
    whereDay(column: Stringable, value: Stringable | number | Date | null): this;
    whereDay(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    whereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where day" statement to the query.
     */
    orWhereDay(column: Stringable, value: Stringable | number | Date | null): this;
    orWhereDay(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    orWhereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where not day" statement to the query.
     */
    whereDayNot(column: Stringable, value: Stringable | number | Date | null): this;
    whereDayNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    whereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not day" statement to the query.
     */
    orWhereDayNot(column: Stringable, value: Stringable | number | Date | null): this;
    orWhereDayNot(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    orWhereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where month" statement to the query.
     */
    whereMonth(column: Stringable, value: Stringable | number | Date | null): this;
    whereMonth(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    whereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where month" statement to the query.
     */
    orWhereMonth(column: Stringable, value: Stringable | number | Date | null): this;
    orWhereMonth(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    orWhereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where not month" statement to the query.
     */
    whereMonthNot(column: Stringable, value: Stringable | number | Date | null): this;
    whereMonthNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    whereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not month" statement to the query.
     */
    orWhereMonthNot(column: Stringable, value: Stringable | number | Date | null): this;
    orWhereMonthNot(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    orWhereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where year" statement to the query.
     */
    whereYear(column: Stringable, value: Stringable | number | Date | null): this;
    whereYear(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    whereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where year" statement to the query.
     */
    orWhereYear(column: Stringable, value: Stringable | number | Date | null): this;
    orWhereYear(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    orWhereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where not year" statement to the query.
     */
    whereYearNot(column: Stringable, value: Stringable | number | Date | null): this;
    whereYearNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    whereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not year" statement to the query.
     */
    orWhereYearNot(column: Stringable, value: Stringable | number | Date | null): this;
    orWhereYearNot(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    orWhereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a nested where statement to the query.
     */
    whereNested(callback: QueryAbleCallback<this>, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add another query builder as a nested where to the query builder.
     */
    addNestedWhereQuery(query: QueryBuilderI, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an exists clause to the query.
     */
    whereExists(callback: QueryBuilderI | QueryAbleCallback<this>, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an or exists clause to the query.
     */
    orWhereExists(callback: QueryBuilderI | QueryAbleCallback<this>, not?: boolean): this;

    /**
     * Add a where not exists clause to the query.
     */
    whereNotExists(callback: QueryBuilderI | QueryAbleCallback<this>, boolean?: ConditionBoolean): this;

    /**
     * Add a where not exists clause to the query.
     */
    orWhereNotExists(callback: QueryBuilderI | QueryAbleCallback<this>): this;

    /**
     * Add an exists clause to the query.
     */
    addWhereExistsQuery(query: QueryBuilderI, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Adds a where condition using row values.
     */
    whereRowValues(
        columns: Stringable[],
        operator: string,
        values: Binding[],
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Adds an or where condition using row values.
     */
    orWhereRowValues(columns: Stringable[], operator: string, values: Binding[]): this;

    /**
     * Adds a where not condition using row values.
     */
    whereRowValuesNot(columns: Stringable[], operator: string, values: Binding[], boolean?: ConditionBoolean): this;

    /**
     * Adds an or where not condition using row values.
     */
    orWhereRowValuesNot(columns: Stringable[], operator: string, values: Binding[]): this;
    /**
     * Add a "where JSON contains" clause to the query.
     */
    whereJsonContains(column: Stringable, value: Binding[] | Binding, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or where JSON contains" clause to the query.
     */
    orWhereJsonContains(column: Stringable, value: Binding[] | Binding): this;

    /**
     * Add a "where JSON not contains" clause to the query.
     */
    whereJsonDoesntContain(column: Stringable, value: Binding[] | Binding, boolean?: ConditionBoolean): this;

    /**
     * Add an "or where JSON not contains" clause to the query.
     */
    orWhereJsonDoesntContain(column: Stringable, value: Binding[] | Binding): this;

    /**
     * Add a clause that determines if a JSON path exists to the query.
     */
    whereJsonContainsKey(column: Stringable, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or" clause that determines if a JSON path exists to the query.
     */
    orWhereJsonContainsKey(column: Stringable): this;

    /**
     * Add a clause that determines if a JSON path does not exist to the query.
     */
    whereJsonDoesntContainKey(column: Stringable, boolean?: ConditionBoolean): this;

    /**
     * Add an "or" clause that determines if a JSON path does not exist to the query.
     */
    orWhereJsonDoesntContainKey(column: Stringable): this;

    /**
     * Add a "where JSON length" clause to the query.
     */
    whereJsonLength(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where JSON length" clause to the query.
     */
    orWhereJsonLength(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null
    ): this;

    /**
     * Add a "where JSON length not" clause to the query.
     */
    whereJsonLengthNot(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where JSON length not" clause to the query.
     */
    orWhereJsonLengthNot(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null
    ): this;

    /**
     * Handles dynamic "where" clauses to the query.
     */
    dynamicWhere(method: string, parameters: Binding[]): this;

    /**
     * Add a "where fulltext" clause to the query.
     */
    whereFulltext(
        columns: Stringable | Stringable[],
        value: string,
        options?: FulltextOptions,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add a "or where fulltext" clause to the query.
     */
    orWhereFulltext(columns: Stringable | Stringable[], value: string, options?: FulltextOptions): this;

    /**
     * Add a "where not fulltext" clause to the query.
     */
    whereFulltextNot(
        columns: Stringable | Stringable[],
        value: string,
        options?: FulltextOptions,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a "or where not fulltext" clause to the query.
     */
    orWhereFulltextNot(columns: Stringable | Stringable[], value: string, options?: FulltextOptions): this;

    /**
     * Add a "group by" clause to the query.
     */
    groupBy(...groups: Stringable[][] | Stringable[]): this;

    /**
     * Add a raw groupBy clause to the query.
     */
    groupByRaw(sql: string, bindings?: Binding[]): this;

    /**
     * Add a "having" clause to the query.
     */
    having(column: QueryAbleCallback<this> | Stringable): this;
    having(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    having(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    having(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or having" clause to the query.
     */
    orHaving(column: QueryAbleCallback<this> | Stringable): this;
    orHaving(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    orHaving(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    orHaving(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null
    ): this;

    /**
     * Add a "having not" clause to the query.
     */
    havingNot(column: QueryAbleCallback<this> | Stringable): this;
    havingNot(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    havingNot(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    havingNot(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or having not" clause to the query.
     */
    orHavingNot(column: QueryAbleCallback<this> | Stringable): this;
    orHavingNot(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    orHavingNot(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    orHavingNot(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null
    ): this;

    /**
     * Add a nested having statement to the query.
     */
    havingNested(callback: QueryAbleCallback<this>, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add another query builder as a nested having to the query builder.
     */
    addNestedHavingQuery(query: QueryBuilderI, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add a "having null" clause to the query.
     */
    havingNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or having null" clause to the query.
     */
    orHavingNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a "having not null" clause to the query.
     */
    havingNotNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean): this;

    /**
     * Add an "or having not null" clause to the query.
     */
    orHavingNotNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a "having between" clause to the query.
     */
    havingBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add a "or having between " clause to the query.
     */
    orHavingBetween(column: Stringable, values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>): this;

    /**
     * Add a "having not between" clause to the query.
     */
    havingBetweenNot(
        column: Stringable,
        values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a "or having not between " clause to the query.
     */
    orHavingBetweenNot(column: Stringable, values: BetweenTuple | Arrayable<number | bigint | Stringable | Date>): this;

    /**
     * Add a raw having clause to the query.
     */
    havingRaw(sql: Stringable, bindings?: Binding[], boolean?: ConditionBoolean): this;

    /**
     * Add a raw or having clause to the query.
     */
    orHavingRaw(sql: Stringable, bindings?: Binding[]): this;

    /**
     * Add an "order by" clause to the query.
     */
    orderBy(column: QueryAbleCallback<this> | QueryBuilderI | Stringable, direction?: OrderDirection): this;

    /**
     * Add a descending "order by" clause to the query.
     */
    orderByDesc(column: QueryAbleCallback<this> | QueryBuilderI | Stringable): this;

    /**
     * Add an "order by" clause for a timestamp to the query.
     */
    latest(column?: QueryAbleCallback<this> | QueryBuilderI | Stringable): this;

    /**
     * Add an "order by" clause for a timestamp to the query.
     */
    oldest(column?: QueryAbleCallback<this> | QueryBuilderI | Stringable): this;

    /**
     * Put the query's results in random order.
     */
    inRandomOrder(seed?: string | number): this;

    /**
     * Add a raw "order by" clause to the query.
     */
    orderByRaw(sql: string, bindings?: Binding[] | Binding): this;

    /**
     * Alias to set the "offset" value of the query.
     */
    skip(value?: number | null): this;

    /**
     * Set the "offset" value of the query.
     */
    offset(value?: number | null): this;

    /**
     * Alias to set the "limit" value of the query.
     */
    take(value?: number | null): this;

    /**
     * Set the "limit" value of the query.
     */
    limit(value?: number | null): this;

    /**
     * Set the limit and offset for a given page.
     */
    forPage(page: number, perPage?: number): this;

    /**
     * Constrain the query to the previous "page" of results before a given ID.
     */
    forPageBeforeId(perPage?: number, lastId?: number | bigint | null, column?: string): this;

    /**
     * Constrain the query to the next "page" of results after a given ID.
     */
    forPageAfterId(perPage?: number, lastId?: number | bigint | null, column?: string): this;

    /**
     * Remove all existing orders and optionally add a new order.
     */
    reorder(column?: QueryAbleCallback<this> | QueryBuilderI | Stringable | null, direction?: OrderDirection): this;

    /**
     * Add a union statement to the query.
     */
    union(query: QueryAbleCallback<this> | QueryBuilderI, all?: boolean): this;

    /**
     * Add a union all statement to the query.
     */
    unionAll(query: QueryAbleCallback<this> | QueryBuilderI): this;

    /**
     * Lock the selected rows in the table.
     */
    lock(value?: string | boolean): this;

    /**
     * Lock the selected rows in the table for updating.
     */
    lockForUpdate(): this;

    /**
     * Share lock the selected rows in the table.
     */
    sharedLock(): this;

    /**
     * Set the aggregate property without running the query.
     */
    setAggregate(fnName: string, columns: Stringable[]): this;

    /**
     * Get the SQL representation of the query.
     */
    toSql(): string;

    /**
     * Get the raw SQL representation of the query with embedded bindings.
     */
    toRawSql(): string;

    /**
     * Pass the query to a given callback.
     */
    tap(callback: QueryAbleCallback<this>): this;

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    when<T = boolean>(
        value: BooleanCallback<T, this> | T,
        callback: (query: this, value: T) => void | this,
        defaultCallback?: null | ((query: this, value: T) => void | this)
    ): this;

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    unless<T = boolean>(
        value: BooleanCallback<T, this> | T,
        callback: (query: this, value: T) => void | this,
        defaultCallback?: null | ((query: this, value: T) => void | this)
    ): this;

    /**
     * Create a raw database expression.
     */
    raw(value: string | number | bigint): ExpressionContract;

    /**
     * Get the current query value bindings in a flattened array.
     */
    getBindings(): Binding[];

    /**
     * Get the raw array of bindings.
     */
    getRawBindings(): BindingTypes;

    /**
     * Set the bindings on the query builder.
     */
    setBindings(bindings: Binding[], type?: keyof BindingTypes): this;

    /**
     * Add a binding to the query.
     */
    addBinding(value: Binding | Binding[], type?: keyof BindingTypes): this;

    /**
     * Cast the given binding value.
     */
    castBinding(value: Binding): Binding;

    /**
     * Merge an array of bindings into our bindings.
     */
    mergeBindings(query: QueryBuilderI): this;

    /**
     * Remove all of the expressions from a list of bindings.
     */
    cleanBindings(bindings: any[]): BindingExclude<ExpressionContract>[];

    /**
     * Get all of the query builder's columns in a text-only array with all expressions evaluated.
     */
    getColumns(): string[];

    /**
     * Get the query grammar instance.
     */
    getGrammar(): ReturnType<ReturnType<this['getConnection']>['getQueryGrammar']>;

    /**
     * Get the database connection instance.
     */
    getConnection(): SessionConnection;

    /**
     * Register a closure to be invoked before the query is executed.
     */
    beforeQuery(callback: QueryAbleCallback<this>): this;

    /**
     * Invoke the "before query" modification callbacks.
     */
    applyBeforeQueryCallbacks(): void;

    /**
     * Log the current SQL and bindings.
     */
    log(): this;

    /**
     * Log the raw current SQL with embedded bindings.
     */
    logRawSql(): this;

    /**
     * Create a new query instance for nested where condition.
     */
    forNestedWhere(): QueryBuilderI;

    /**
     * Get a new instance of the query builder.
     */
    newQuery(): QueryBuilderI;

    /**
     * Clone the query.
     */
    clone(): QueryBuilderI;

    /**
     * Clone the query without the given registry properties.
     */
    cloneWithout(properties: (keyof RegistryI)[]): QueryBuilderI;

    /**
     * Clone the query without the given bindings.
     */
    cloneWithoutBindings(except: (keyof BindingTypes)[]): QueryBuilderI;
}
