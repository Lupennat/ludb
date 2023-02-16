import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Collection from '../collections/collection';
import LazyCollection from '../collections/lazy-collection';
import { ConnectionSessionI } from '../types/connection';
import ProcessorI from '../types/processor';
import {
    Arrayable,
    BetweenColumnsTuple,
    BetweenTuple,
    Binding,
    BooleanCallback,
    ConditionBoolean,
    FulltextOptions,
    NotExpressionBinding,
    NotNullableBinding,
    NumericValues,
    OrderDirection,
    QueryAbleCallback,
    RowValues,
    SelectColumn,
    Stringable,
    SubQuery,
    WhereColumnTuple,
    WhereObject,
    WhereTuple
} from '../types/query/builder';
import GrammarI from '../types/query/grammar';
import JoinClauseI from '../types/query/join-clause';
import Registry, { BindingTypes, Where } from '../types/query/registry';

import ExpressionContract from './expression-contract';

abstract class BuilderContract {
    /**
     * Get Query Builder Registry
     */
    public abstract getRegistry(): Registry;

    /**
     * Set Query Builder Registry
     */
    public abstract setRegistry(registry: Registry): this;

    /**
     * Set the columns to be selected.
     */
    public abstract select(
        columns?: SelectColumn<this> | SelectColumn<this>[],
        ...otherColumns: SelectColumn<this>[]
    ): this;

    /**
     * Add a subselect expression to the query.
     */
    public abstract selectSub(query: SubQuery<this>, as: Stringable): this;

    /**
     * Add a new "raw" select expression to the query.
     */
    public abstract selectRaw(expression: string, bindings?: Binding[]): this;

    /**
     * Makes "from" fetch from a subquery.
     */
    public abstract fromSub(query: SubQuery<this>, as: Stringable): this;

    /**
     * Add a raw from clause to the query.
     */
    public abstract fromRaw(expression: string | Stringable, bindings?: Binding[]): this;

    /**
     * Add a new select column to the query.
     */
    public abstract addSelect(
        columns: SelectColumn<this> | SelectColumn<this>[],
        ...otherColumns: SelectColumn<this>[]
    ): this;

    /**
     * Force the query to only return distinct results.
     */
    public abstract distinct(column?: boolean | Stringable, ...columns: Stringable[]): this;

    /**
     * Set the table which the query is targeting.
     */
    public abstract from(table: SubQuery<this>, as?: string): this;

    /**
     * Add an index hint to suggest a query index.
     */
    public abstract useIndex(index: string): this;

    /**
     * Add an index hint to force a query index.
     */
    public abstract forceIndex(index: string): this;

    /**
     * Add an index hint to ignore a query index.
     */
    public abstract ignoreIndex(index: string): this;

    /**
     * Add a join clause to the query.
     */
    public abstract join(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public abstract join(table: Stringable, first: Stringable, operator: Stringable): this;
    public abstract join(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public abstract join(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string
    ): this;

    /**
     * Add a "join where" clause to the query.
     */
    public abstract joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public abstract joinWhere(
        table: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>,
        type?: string
    ): this;

    /**
     * Add a subquery join clause to the query.
     */
    public abstract joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: Stringable
    ): this;
    public abstract joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    public abstract joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string
    ): this;

    /**
     * Add a subquery join where clause to the query.
     */
    public abstract joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public abstract joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>,
        type?: string
    ): this;

    /**
     * Add a left join to the query.
     */
    public abstract leftJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public abstract leftJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    public abstract leftJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public abstract leftJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a "join where" clause to the query.
     */
    public abstract leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public abstract leftJoinWhere(
        table: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a subquery left join to the query.
     */
    public abstract leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: Stringable
    ): this;
    public abstract leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    public abstract leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a subquery left join where clause to the query.
     */
    public abstract leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public abstract leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a right join to the query.
     */
    public abstract rightJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public abstract rightJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    public abstract rightJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public abstract rightJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a "right join where" clause to the query.
     */
    public abstract rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public abstract rightJoinWhere(
        table: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a subquery right join to the query.
     */
    public abstract rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: Stringable
    ): this;
    public abstract rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    public abstract rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a subquery left join where clause to the query.
     */
    public abstract rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public abstract rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public abstract rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;

    /**
     * Add a "cross join" clause to the query.
     */
    public abstract crossJoin(table: Stringable): this;
    public abstract crossJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public abstract crossJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    public abstract crossJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public abstract crossJoin(
        table: Stringable,
        first?: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable | null,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a subquery cross join to the query.
     */
    public abstract crossJoinSub(query: SubQuery<JoinClauseI>, as: Stringable): this;

    /**
     * Merge an array of where clauses and bindings.
     */
    public abstract mergeWheres(wheres: Where[], bindings: Binding[]): this;

    /**
     * Add a basic where clause to the query.
     */
    public abstract where(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public abstract where(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public abstract where(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract where(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public abstract where(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract where(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where" clause to the query.
     */
    public abstract orWhere(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public abstract orWhere(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public abstract orWhere(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract orWhere(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public abstract orWhere(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract orWhere(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>
    ): this;

    /**
     * Add a basic "where not" clause to the query.
     */
    public abstract whereNot(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public abstract whereNot(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public abstract whereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract whereNot(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public abstract whereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract whereNot(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not" clause to the query.
     */
    public abstract orWhereNot(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public abstract orWhereNot(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public abstract orWhereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract orWhereNot(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public abstract orWhereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public abstract orWhereNot(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>
    ): this;

    /**
     * Add a "where" clause comparing two columns to the query.
     */
    public abstract whereColumn(first: WhereColumnTuple[]): this;
    public abstract whereColumn(first: Stringable, second: Stringable): this;
    public abstract whereColumn(first: Stringable, operator: string, second: Stringable): this;
    public abstract whereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where" clause comparing two columns to the query.
     */
    public abstract orWhereColumn(first: WhereColumnTuple[]): this;
    public abstract orWhereColumn(first: Stringable, second: Stringable): this;
    public abstract orWhereColumn(first: Stringable, operator: string, second: Stringable): this;
    public abstract orWhereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a "where not" clause comparing two columns to the query.
     */
    public abstract whereColumnNot(first: WhereColumnTuple[]): this;
    public abstract whereColumnNot(first: Stringable, second: Stringable): this;
    public abstract whereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    public abstract whereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not" clause comparing two columns to the query.
     */
    public abstract orWhereColumnNot(first: WhereColumnTuple[]): this;
    public abstract orWhereColumnNot(first: Stringable, second: Stringable): this;
    public abstract orWhereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    public abstract orWhereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Add a raw where clause to the query.
     */
    public abstract whereRaw(sql: string, bindings?: Binding[], boolean?: ConditionBoolean): this;

    /**
     * Add a raw or where clause to the query.
     */
    public abstract orWhereRaw(sql: string, bindings?: Binding[]): this;

    /**
     * Add a "where in" clause to the query.
     */
    public abstract whereIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where in" clause to the query.
     */
    public abstract orWhereIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable
    ): this;

    /**
     * Add a "where not in" clause to the query.
     */
    public abstract whereNotIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not in" clause to the query.
     */
    public abstract orWhereNotIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable
    ): this;

    /**
     * Add a "where in raw" clause for integer values to the query.
     */
    public abstract whereIntegerInRaw(
        column: Stringable,
        values: Binding[] | Arrayable,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where in raw" clause for integer values to the query.
     */
    public abstract orWhereIntegerInRaw(column: Stringable, values: Binding[] | Arrayable): this;

    /**
     * Add a "where not in raw" clause for integer values to the query.
     */
    public abstract whereIntegerNotInRaw(
        column: Stringable,
        values: Binding[] | Arrayable,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not in raw" clause for integer values to the query.
     */
    public abstract orWhereIntegerNotInRaw(column: Stringable, values: Binding[] | Arrayable): this;

    /**
     * Add a "where null" clause to the query.
     */
    public abstract whereNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or where null" clause to the query.
     */
    public abstract orWhereNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a "where not null" clause to the query.
     */
    public abstract whereNotNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean): this;

    /**
     * Add an "or where not null" clause to the query.
     */
    public abstract orWhereNotNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a where between statement to the query.
     */
    public abstract whereBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add a where between statement using columns to the query.
     */
    public abstract whereBetweenColumns(
        column: Stringable,
        values: BetweenColumnsTuple | Arrayable,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an or where between statement to the query.
     */
    public abstract orWhereBetween(column: Stringable, values: BetweenTuple | Arrayable): this;

    /**
     * Add an or where between statement using columns to the query.
     */
    public abstract orWhereBetweenColumns(column: Stringable, values: BetweenColumnsTuple | Arrayable): this;

    /**
     * Add a where not between statement to the query.
     */
    public abstract whereNotBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a where not between statement using columns to the query.
     */
    public abstract whereNotBetweenColumns(
        column: Stringable,
        values: BetweenColumnsTuple | Arrayable,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an or where not between statement to the query.
     */
    public abstract orWhereNotBetween(column: Stringable, values: BetweenTuple | Arrayable): this;

    /**
     * Add an or where not between statement using columns to the query.
     */
    public abstract orWhereNotBetweenColumns(column: Stringable, values: BetweenColumnsTuple | Arrayable): this;

    /**
     * Add a "where date" statement to the query.
     */
    public abstract whereDate(column: Stringable, value: Stringable | Date | null): this;
    public abstract whereDate(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public abstract whereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where date" statement to the query.
     */
    public abstract orWhereDate(column: Stringable, value: Stringable | Date | null): this;
    public abstract orWhereDate(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public abstract orWhereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;

    /**
     * Add a "where not date" statement to the query.
     */
    public abstract whereDateNot(column: Stringable, value: Stringable | Date | null): this;
    public abstract whereDateNot(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public abstract whereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not date" statement to the query.
     */
    public abstract orWhereDateNot(column: Stringable, value: Stringable | Date | null): this;
    public abstract orWhereDateNot(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public abstract orWhereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;

    /**
     * Add a "where time" statement to the query.
     */
    public abstract whereTime(column: Stringable, value: Stringable | Date | null): this;
    public abstract whereTime(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public abstract whereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where time" statement to the query.
     */
    public abstract orWhereTime(column: Stringable, value: Stringable | Date | null): this;
    public abstract orWhereTime(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public abstract orWhereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;

    /**
     * Add a "where not time" statement to the query.
     */
    public abstract whereTimeNot(column: Stringable, value: Stringable | Date | null): this;
    public abstract whereTimeNot(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public abstract whereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not time" statement to the query.
     */
    public abstract orWhereTimeNot(column: Stringable, value: Stringable | Date | null): this;
    public abstract orWhereTimeNot(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public abstract orWhereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;

    /**
     * Add a "where day" statement to the query.
     */
    public abstract whereDay(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract whereDay(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public abstract whereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where day" statement to the query.
     */
    public abstract orWhereDay(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract orWhereDay(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public abstract orWhereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where not day" statement to the query.
     */
    public abstract whereDayNot(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract whereDayNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public abstract whereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not day" statement to the query.
     */
    public abstract orWhereDayNot(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract orWhereDayNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null
    ): this;
    public abstract orWhereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where month" statement to the query.
     */
    public abstract whereMonth(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract whereMonth(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public abstract whereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where month" statement to the query.
     */
    public abstract orWhereMonth(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract orWhereMonth(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public abstract orWhereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where not month" statement to the query.
     */
    public abstract whereMonthNot(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract whereMonthNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public abstract whereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not month" statement to the query.
     */
    public abstract orWhereMonthNot(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract orWhereMonthNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null
    ): this;
    public abstract orWhereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where year" statement to the query.
     */
    public abstract whereYear(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract whereYear(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public abstract whereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where year" statement to the query.
     */
    public abstract orWhereYear(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract orWhereYear(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public abstract orWhereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a "where not year" statement to the query.
     */
    public abstract whereYearNot(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract whereYearNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public abstract whereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where not year" statement to the query.
     */
    public abstract orWhereYearNot(column: Stringable, value: Stringable | number | Date | null): this;
    public abstract orWhereYearNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null
    ): this;
    public abstract orWhereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;

    /**
     * Add a nested where statement to the query.
     */
    public abstract whereNested(callback: QueryAbleCallback<this>, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Create a new query instance for nested where condition.
     */
    public abstract forNestedWhere(): BuilderContract;

    /**
     * Add another query builder as a nested where to the query builder.
     */
    public abstract addNestedWhereQuery(query: BuilderContract, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an exists clause to the query.
     */
    public abstract whereExists(
        callback: BuilderContract | QueryAbleCallback<this>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an or exists clause to the query.
     */
    public abstract orWhereExists(callback: BuilderContract | QueryAbleCallback<this>, not?: boolean): this;

    /**
     * Add a where not exists clause to the query.
     */
    public abstract whereNotExists(
        callback: BuilderContract | QueryAbleCallback<this>,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a where not exists clause to the query.
     */
    public abstract orWhereNotExists(callback: BuilderContract | QueryAbleCallback<this>): this;

    /**
     * Add an exists clause to the query.
     */
    public abstract addWhereExistsQuery(query: BuilderContract, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Adds a where condition using row values.
     */
    public abstract whereRowValues(
        columns: Stringable[],
        operator: string,
        values: Binding[],
        boolean?: ConditionBoolean
    ): this;

    /**
     * Adds an or where condition using row values.
     */
    public abstract orWhereRowValues(columns: Stringable[], operator: string, values: Binding[]): this;

    /**
     * Add a "where JSON contains" clause to the query.
     */
    public abstract whereJsonContains(
        column: Stringable,
        value: Binding[] | Binding,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where JSON contains" clause to the query.
     */
    public abstract orWhereJsonContains(column: Stringable, value: Binding[] | Binding): this;

    /**
     * Add a "where JSON not contains" clause to the query.
     */
    public abstract whereJsonDoesntContain(
        column: Stringable,
        value: Binding[] | Binding,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where JSON not contains" clause to the query.
     */
    public abstract orWhereJsonDoesntContain(column: Stringable, value: Binding[] | Binding): this;

    /**
     * Add a clause that determines if a JSON path exists to the query.
     */
    public abstract whereJsonContainsKey(column: Stringable, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or" clause that determines if a JSON path exists to the query.
     */
    public abstract orWhereJsonContainsKey(column: Stringable): this;

    /**
     * Add a clause that determines if a JSON path does not exist to the query.
     */
    public abstract whereJsonDoesntContainKey(column: Stringable, boolean?: ConditionBoolean): this;

    /**
     * Add an "or" clause that determines if a JSON path does not exist to the query.
     */
    public abstract orWhereJsonDoesntContainKey(column: Stringable): this;

    /**
     * Add a "where JSON length" clause to the query.
     */
    public abstract whereJsonLength(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or where JSON length" clause to the query.
     */
    public abstract orWhereJsonLength(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null
    ): this;

    /**
     * Add a "where JSON length not" clause to the query.
     */
    public abstract whereJsonLengthNot(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or where JSON length not" clause to the query.
     */
    public abstract orWhereJsonLengthNot(
        column: Stringable,
        operator: string | number | ExpressionContract,
        value?: number | ExpressionContract | null
    ): this;

    /**
     * Handles dynamic "where" clauses to the query.
     */
    public abstract dynamicWhere(method: string, parameters: Binding[]): this;

    /**
     * Add a "where fulltext" clause to the query.
     */
    public abstract whereFulltext(
        columns: Stringable | Stringable[],
        value: string,
        options?: FulltextOptions,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add a "or where fulltext" clause to the query.
     */
    public abstract orwhereFulltext(columns: Stringable | Stringable[], value: string, options?: FulltextOptions): this;

    /**
     * Add a "where not fulltext" clause to the query.
     */
    public abstract whereFulltextNot(
        columns: Stringable | Stringable[],
        value: string,
        options?: FulltextOptions,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a "or where not fulltext" clause to the query.
     */
    public abstract orwhereFulltextNot(
        columns: Stringable | Stringable[],
        value: string,
        options?: FulltextOptions
    ): this;

    /**
     * Add a "group by" clause to the query.
     */
    public abstract groupBy(...groups: Stringable[][] | Stringable[]): this;

    /**
     * Add a raw groupBy clause to the query.
     */
    public abstract groupByRaw(sql: string, bindings?: Binding[]): this;

    /**
     * Add a "having" clause to the query.
     */
    public abstract having(column: QueryAbleCallback<this> | Stringable): this;
    public abstract having(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public abstract having(
        column: QueryAbleCallback<this> | Stringable,
        operator: string,
        value: Stringable | number
    ): this;
    public abstract having(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add an "or having" clause to the query.
     */
    public abstract orHaving(column: QueryAbleCallback<this> | Stringable): this;
    public abstract orHaving(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public abstract orHaving(
        column: QueryAbleCallback<this> | Stringable,
        operator: string,
        value: Stringable | number
    ): this;
    public abstract orHaving(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null
    ): this;

    /**
     * Add a "having not" clause to the query.
     */
    public abstract havingNot(column: QueryAbleCallback<this> | Stringable): this;
    public abstract havingNot(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public abstract havingNot(
        column: QueryAbleCallback<this> | Stringable,
        operator: string,
        value: Stringable | number
    ): this;
    public abstract havingNot(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or having not" clause to the query.
     */
    public abstract orHavingNot(column: QueryAbleCallback<this> | Stringable): this;
    public abstract orHavingNot(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public abstract orHavingNot(
        column: QueryAbleCallback<this> | Stringable,
        operator: string,
        value: Stringable | number
    ): this;
    public abstract orHavingNot(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null
    ): this;

    /**
     * Add a nested having statement to the query.
     */
    public abstract havingNested(callback: QueryAbleCallback<this>, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add another query builder as a nested having to the query builder.
     */
    public abstract addNestedHavingQuery(query: BuilderContract, boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add a "having null" clause to the query.
     */
    public abstract havingNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean, not?: boolean): this;

    /**
     * Add an "or having null" clause to the query.
     */
    public abstract orHavingNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a "having not null" clause to the query.
     */
    public abstract havingNotNull(columns: Stringable | Stringable[], boolean?: ConditionBoolean): this;

    /**
     * Add an "or having not null" clause to the query.
     */
    public abstract orHavingNotNull(columns: Stringable | Stringable[]): this;

    /**
     * Add a "having between" clause to the query.
     */
    public abstract havingBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    /**
     * Add a "or having between " clause to the query.
     */
    public abstract orHavingBetween(column: Stringable, values: BetweenTuple | Arrayable): this;

    /**
     * Add a "having not between" clause to the query.
     */
    public abstract havingBetweenNot(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add a "or having not between " clause to the query.
     */
    public abstract orHavingBetweenNot(column: Stringable, values: BetweenTuple | Arrayable): this;

    /**
     * Add a raw having clause to the query.
     */
    public abstract havingRaw(sql: string, bindings?: Binding[], boolean?: ConditionBoolean): this;

    /**
     * Add a raw or having clause to the query.
     */
    public abstract orHavingRaw(sql: string, bindings?: Binding[]): this;

    /**
     * Add an "order by" clause to the query.
     */
    public abstract orderBy(column: SubQuery<this>, direction?: OrderDirection): this;

    /**
     * Add a descending "order by" clause to the query.
     */
    public abstract orderByDesc(column: SubQuery<this>): this;

    /**
     * Add an "order by" clause for a timestamp to the query.
     */
    public abstract latest(column?: SubQuery<this>): this;

    /**
     * Add an "order by" clause for a timestamp to the query.
     */
    public abstract oldest(column?: SubQuery<this>): this;

    /**
     * Put the query's results in random order.
     */
    public abstract inRandomOrder(seed?: string | number): this;

    /**
     * Add a raw "order by" clause to the query.
     */
    public abstract orderByRaw(sql: string, bindings?: Binding[] | Binding): this;

    /**
     * Alias to set the "offset" value of the query.
     */
    public abstract skip(value?: number | null): this;

    /**
     * Set the "offset" value of the query.
     */
    public abstract offset(value?: number | null): this;

    /**
     * Alias to set the "limit" value of the query.
     */
    public abstract take(value?: number | null): this;

    /**
     * Set the "limit" value of the query.
     */
    public abstract limit(value?: number | null): this;

    /**
     * Set the limit and offset for a given page.
     */
    public abstract forPage(page: number, perPage?: number): this;

    /**
     * Constrain the query to the previous "page" of results before a given ID.
     */
    public abstract forPageBeforeId(perPage?: number, lastId?: number | bigint | null, column?: Stringable): this;

    /**
     * Constrain the query to the next "page" of results after a given ID.
     */
    public abstract forPageAfterId(perPage?: number, lastId?: number | bigint | null, column?: Stringable): this;

    /**
     * Remove all existing orders and optionally add a new order.
     */
    public abstract reorder(column?: SubQuery<this> | null, direction?: OrderDirection): this;

    /**
     * Add a union statement to the query.
     */
    public abstract union(query: QueryAbleCallback<this> | BuilderContract, all?: boolean): this;

    /**
     * Add a union all statement to the query.
     */
    public abstract unionAll(query: QueryAbleCallback<this> | BuilderContract): this;

    /**
     * Lock the selected rows in the table.
     */
    public abstract lock(value?: string | boolean): this;

    /**
     * Lock the selected rows in the table for updating.
     */
    public abstract lockForUpdate(): this;

    /**
     * Share lock the selected rows in the table.
     */
    public abstract sharedLock(): this;

    /**
     * Register a closure to be invoked before the query is executed.
     */
    public abstract beforeQuery(callback: QueryAbleCallback<BuilderContract>): this;

    /**
     * Invoke the "before query" modification callbacks.
     */
    public abstract applyBeforeQueryCallbacks(): void;

    /**
     * Get the SQL representation of the query.
     */
    public abstract toSql(): string;

    /**
     * Chunk the results of the query.
     */
    public abstract chunk<T>(
        count: number,
        callback: (items: Collection<T>, page: number) => Promise<void | false> | void | false
    ): Promise<boolean>;

    /**
     * Run a map over each item while chunking.
     */
    public abstract chunkMap<T>(callback: (item: T) => Promise<T> | T, count?: number): Promise<Collection<T>>;

    /**
     * Execute a callback over each item while chunking.
     */
    public abstract each<T>(
        callback: (item: T, index: number) => Promise<void | false> | void | false,
        count?: number
    ): Promise<boolean>;

    /**
     * Chunk the results of a query by comparing IDs.
     */
    public abstract chunkById<T>(
        count: number,
        callback: (items: Collection<T>, page: number) => Promise<void | false> | void | false,
        column?: Stringable | null,
        alias?: Stringable | null
    ): Promise<boolean>;

    /**
     * Execute a callback over each item while chunking by ID.
     */
    public abstract eachById<T>(
        callback: (item: T, index: number) => Promise<false | void> | false | void,
        count?: number,
        column?: Stringable | null,
        alias?: Stringable | null
    ): Promise<boolean>;

    /**
     * Query lazily, by chunks of the given size.
     */
    public abstract lazy<T>(chunkSize?: number): LazyCollection<T>;

    /**
     * Query lazily, by chunking the results of a query by comparing IDs.
     */
    public abstract lazyById<T>(
        chunkSize?: number,
        column?: Stringable | null,
        alias?: string | null
    ): LazyCollection<T>;

    /**
     * Query lazily, by chunking the results of a query by comparing IDs in descending order.
     */
    public abstract lazyByIdDesc<T>(chunkSize?: number, column?: Stringable, alias?: string | null): LazyCollection<T>;

    /**
     * Execute the query and get the first result.
     */
    public abstract first<T = Dictionary>(columns?: Stringable | Stringable[]): Promise<T | null>;

    /**
     * Execute the query and get the first result if it's the sole matching record.
     */
    public abstract sole<T>(columns?: Stringable | Stringable[]): Promise<T>;

    /**
     * Execute a query for a single record by ID.
     */
    public abstract find<T = Dictionary>(
        id: number | string | bigint,
        columns?: Stringable | Stringable[]
    ): Promise<T | null>;

    /**
     * Execute a query for a single record by ID or call a callback.
     */
    public abstract findOr<T = Dictionary>(id: number | string | bigint): Promise<T | null>;
    public abstract findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        callback: () => U
    ): Promise<T | U>;
    public abstract findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        columns: Stringable | Stringable[]
    ): Promise<T | U>;
    public abstract findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        columnsCallback?: Stringable | Stringable[] | (() => U),
        callback?: (() => U) | null
    ): Promise<T | U | null>;

    /**
     * Get a single column's value from the first result of a query.
     */
    public abstract value<T>(column: Stringable): Promise<T | null>;

    /**
     * Get a single expression value from the first result of a query.
     */
    public abstract rawValue<T>(expression: string, bindings?: Binding[]): Promise<T | null>;

    /**
     * Get a single column's value from the first result of a query if it's the sole matching record.
     */
    public abstract soleValue<T>(column: Stringable): Promise<T>;

    /**
     * Execute the query as a "select" statement.
     */
    public abstract get<T = Dictionary>(columns?: Stringable | Stringable[]): Promise<Collection<T>>;

    /**
     * Get a lazy collection for the given query.
     */
    public abstract cursor<T>(): LazyCollection<T>;

    /**
     * Get a collection instance containing the values of a given column.
     */
    public abstract pluck<T = unknown>(column: Stringable, key?: Stringable | null): Promise<Collection<T>>;

    /**
     * Concatenate values of a given column as a string.
     */
    public abstract implode(column: Stringable, glue?: string): Promise<string>;

    /**
     * Determine if any rows exist for the current query.
     */
    public abstract exists(): Promise<boolean>;

    /**
     * Determine if no rows exist for the current query.
     */
    public abstract doesntExist(): Promise<boolean>;

    /**
     * Execute the given callback if no rows exist for the current query.
     */
    public abstract existsOr<T>(callback: () => T): Promise<T | true>;

    /**
     * Execute the given callback if rows exist for the current query.
     */
    public abstract doesntExistOr<T>(callback: () => T): Promise<T | true>;

    /**
     * Retrieve the "count" result of the query.
     */
    public abstract count(columns?: Stringable | Stringable[]): Promise<number | bigint>;

    /**
     * Retrieve the minimum value of a given column.
     */
    public abstract min(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Retrieve the maximum value of a given column.
     */
    public abstract max(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Retrieve the sum of the values of a given column.
     */
    public abstract sum(column: Stringable): Promise<number | bigint | string>;

    /**
     * Retrieve the average of the values of a given column.
     */
    public abstract avg(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Alias for the "avg" method.
     */
    public abstract average(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Execute an aggregate function on the database.
     */
    public abstract aggregate(fnName: string, columns?: Stringable[]): Promise<number | bigint | string | null>;

    /**
     * Execute a numeric aggregate function on the database.
     */
    public abstract numericAggregate(fnName: string, columns?: Stringable[]): Promise<number | bigint>;

    /**
     * Set the aggregate property without running the query.
     */
    public abstract setAggregate(fnName: string, columns: Stringable[]): this;

    /**
     * Insert new records into the database.
     */
    public abstract insert(values: RowValues | RowValues[]): Promise<boolean>;

    /**
     * Insert new records into the database while ignoring errors.
     */
    public abstract insertOrIgnore(values: RowValues | RowValues[]): Promise<number>;

    /**
     * Insert a new record and get the value of the primary key.
     */
    public abstract insertGetId<T extends number | bigint | string>(
        values: RowValues,
        sequence?: string | null
    ): Promise<T | null>;

    /**
     * Insert new records into the table using a subquery.
     */
    public abstract insertUsing(columns: Stringable[], query: SubQuery<this>): Promise<number>;

    /**
     * Update records in the database.
     */
    public abstract update(values: RowValues): Promise<number>;

    /**
     * Update records in a PostgreSQL database using the update from syntax.
     */
    public abstract updateFrom(values: RowValues): Promise<number>;

    /**
     * Insert or update a record matching the attributes, and fill it with values.
     */
    public abstract updateOrInsert(attributes: RowValues, values?: RowValues): Promise<boolean>;

    /**
     * Insert new records or update the existing ones.
     */
    public abstract upsert(
        values: RowValues[] | RowValues,
        uniqueBy: string | string[],
        update?: string[] | RowValues | null
    ): Promise<number>;

    /**
     * Increment a column's value by a given amount.
     */
    public abstract increment(column: string, amount?: number | bigint, extra?: RowValues): Promise<number>;

    /**
     * Increment the given column's values by the given amounts.
     */
    public abstract incrementEach(columns: NumericValues, extra?: RowValues): Promise<number>;

    /**
     * Decrement a column's value by a given amount.
     */
    public abstract decrement(column: string, amount?: number | bigint, extra?: RowValues): Promise<number>;

    /**
     * Decrement the given column's values by the given amounts.
     */
    public abstract decrementEach(columns: NumericValues, extra?: RowValues): Promise<number>;

    /**
     * Delete records from the database.
     */
    public abstract delete(id?: string | bigint | number | null): Promise<number>;

    /**
     * Run a truncate statement on the table.
     */
    public abstract truncate(): Promise<void>;

    /**
     * Explains the query.
     */
    public abstract explain(): Promise<Collection<string>>;

    /**
     * Pass the query to a given callback.
     */
    public abstract tap(callback: QueryAbleCallback<this>): this;

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    public abstract when<T = boolean>(
        value: BooleanCallback<T, this> | T,
        callback: (query: this, value: T) => void | this,
        defaultCallback?: null | ((query: this, value: T) => void | this)
    ): this;

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    public abstract unless<T = boolean>(
        value: BooleanCallback<T, this> | T,
        callback: (query: this, value: T) => void | this,
        defaultCallback?: null | ((query: this, value: T) => void | this)
    ): this;

    /**
     * Get a new instance of the query builder.
     */
    public abstract newQuery(): BuilderContract;

    /**
     * Get all of the query builder's columns in a text-only array with all expressions evaluated.
     */
    public abstract getColumns(): string[];

    /**
     * Create a raw database expression.
     */
    public abstract raw(value: string | number | bigint): ExpressionContract;

    /**
     * Get the current query value bindings in a flattened array.
     */
    public abstract getBindings(): Binding[];

    /**
     * Get the raw array of bindings.
     */
    public abstract getRawBindings(): BindingTypes;

    /**
     * Set the bindings on the query builder.
     */
    public abstract setBindings(bindings: Binding[], type?: keyof BindingTypes): this;

    /**
     * Add a binding to the query.
     */
    public abstract addBinding(value: Binding | Binding[], type?: keyof BindingTypes): this;

    /**
     * Cast the given binding value.
     */
    public abstract castBinding(value: Binding): Binding;

    /**
     * Merge an array of bindings into our bindings.
     */
    public abstract mergeBindings(query: BuilderContract): this;

    /**
     * Remove all of the expressions from a list of bindings.
     */
    public abstract cleanBindings(bindings: Binding[]): NotExpressionBinding[];

    /**
     * Use the "write" PDO connection when executing the query.
     */
    public abstract useWritePdo(): this;

    /**
     * Get the database connection instance.
     */
    public abstract getConnection(): ConnectionSessionI;

    /**
     * Get the database query processor instance.
     */
    public abstract getProcessor(): ProcessorI;

    /**
     * Get the query grammar instance.
     */
    public abstract getGrammar(): GrammarI;

    /**
     * Clone the query.
     */
    public abstract clone(): BuilderContract;

    /**
     * Clone the query without the given registry properties.
     */
    public abstract cloneWithout(properties: (keyof Registry)[]): BuilderContract;

    /**
     * Clone the query without the given bindings.
     */
    public abstract cloneWithoutBindings(except: (keyof BindingTypes)[]): BuilderContract;
}

export default BuilderContract;
