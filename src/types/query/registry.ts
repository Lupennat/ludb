import ExpressionContract from '../../query/expression-contract';
import IndexHint from '../../query/index-hint';
import { Binding, Stringable } from '../generics';
import GrammarBuilderI, {
    BetweenColumnsTuple,
    BetweenTuple,
    ConditionBoolean,
    FulltextOptions,
    OrderDirection
} from './grammar-builder';
import JoinClauseI from './join-clause';

export interface WhereRaw {
    type: 'Raw';
    sql: Stringable;
    boolean: ConditionBoolean;
}

interface WhereBase {
    boolean: ConditionBoolean;
    not: boolean;
}

export interface WhereExpression extends WhereBase {
    type: 'Expression';
    column: ExpressionContract;
}

export interface WhereExists extends WhereBase {
    type: 'Exists';
    query: GrammarBuilderI;
}

export interface WhereNested extends WhereBase {
    type: 'Nested';
    query: GrammarBuilderI;
}

export interface WhereSub extends WhereBase {
    type: 'Sub';
    column: Stringable;
    operator: string;
    query: GrammarBuilderI;
}

export interface WhereNull extends WhereBase {
    type: 'Null';
    column: Stringable;
}

export interface WhereBasic extends WhereBase {
    type: 'Basic' | 'Bitwise';
    column: Stringable;
    operator: string;
    value: Binding;
}

export interface WhereColumn extends WhereBase {
    type: 'Column';
    first: Stringable;
    operator: string;
    second: Stringable;
}

export interface WhereMultiColumn extends WhereBase {
    type: 'RowValues';
    columns: Stringable[];
    operator: string;
    values: Binding[];
}

export interface WhereKeyContains extends WhereBase {
    type: 'JsonContainsKey';
    column: Stringable;
}

export interface WhereBoolean extends WhereBase {
    type: 'JsonBoolean';
    column: Stringable;
    operator: string;
    value: Binding;
}

export interface WhereContains extends WhereBase {
    type: 'JsonContains';
    column: Stringable;
    value: Binding[] | Binding;
}

export interface WhereLength extends WhereBase {
    type: 'JsonLength';
    column: Stringable;
    operator: string;
    value: number | ExpressionContract | null;
}

export interface whereFulltext extends WhereBase {
    type: 'Fulltext';
    columns: Stringable[];
    value: string;
    options: FulltextOptions;
}

export interface WhereIn extends WhereBase {
    type: 'In';
    column: Stringable;
    values: Binding[];
}

export interface WhereInRaw extends WhereBase {
    type: 'InRaw';
    column: Stringable;
    values: bigint[];
}

export interface WhereBetweenColumns extends WhereBase {
    type: 'BetweenColumns';
    column: Stringable;
    values: BetweenColumnsTuple;
}
export interface WhereBetween extends WhereBase {
    type: 'Between';
    column: Stringable;
    values: BetweenTuple;
}

export interface WhereDateTime extends WhereBase {
    type: 'Date' | 'Time' | 'Year' | 'Month' | 'Day';
    column: Stringable;
    operator: string;
    value: Stringable | number | null;
}

export type HavingRaw = WhereRaw;
export type HavingExpression = WhereExpression;
export type HavingBasic = WhereBasic;
export type HavingNested = WhereNested;
export type HavingNull = WhereNull;
export type HavingBetween = WhereBetween;

export type Having = HavingExpression | HavingRaw | HavingBasic | HavingNested | HavingNull | HavingBetween;

export interface OrderColumn {
    column: Stringable;
    direction: Lowercase<OrderDirection>;
}

export interface OrderRaw {
    type: 'Raw';
    sql: string;
}

export interface Union {
    query: GrammarBuilderI;
    all: boolean;
}

export interface Aggregate {
    fnName: string;
    columns: Stringable[];
}

export type Order = OrderColumn | OrderRaw;

export interface CteCycle {
    markColumn: Stringable;
    pathColumn: Stringable;
    columns: Stringable[];
}

export interface Cte {
    name: Stringable;
    query: string;
    columns: Stringable[];
    materialized: boolean | null;
    recursive: boolean;
    cycle: CteCycle | null;
}

export type Where =
    | WhereExpression
    | WhereRaw
    | WhereBasic
    | WhereIn
    | WhereInRaw
    | WhereNull
    | WhereBetween
    | WhereBetweenColumns
    | WhereDateTime
    | WhereColumn
    | WhereLength
    | WhereExists
    | WhereNested
    | WhereMultiColumn
    | WhereSub
    | WhereBoolean
    | WhereKeyContains
    | WhereContains
    | whereFulltext;

export interface BindingTypes {
    expressions: Binding[];
    select: Binding[];
    from: Binding[];
    join: Binding[];
    where: Binding[];
    groupBy: Binding[];
    having: Binding[];
    order: Binding[];
    union: Binding[];
    unionOrder: Binding[];
}

export default interface RegistryI {
    /**
     * Whether to use write pdo for the select.
     */
    useWritePdo: boolean;

    /**
     * The current query value bindings.
     */
    bindings: BindingTypes;

    /**
     * An aggregate function and column to be run.
     */
    aggregate: Aggregate | null;

    /**
     * The columns that should be returned.
     */
    columns: Stringable[] | null;

    /**
     * Indicates if the query returns distinct results.
     * Occasionally contains the columns that should be distinct.
     */
    distinct: boolean | Array<Stringable>;

    /**
     * The common table expressions for queries.
     */
    expressions: Cte[];

    /**
     * The table which the query is targeting.
     */
    from: Stringable;

    /**
     * The index hint for the query.
     */
    indexHint: IndexHint | null;

    /**
     * The table joins for the query.
     */
    joins: JoinClauseI[];

    /**
     * The where constraints for the query.
     */
    wheres: Where[];

    /**
     * The groupings for the query.
     */
    groups: Stringable[];

    /**
     * The having constraints for the query.
     */
    havings: Having[];

    /**
     * The orderings for the query.
     */
    orders: Order[];

    /**
     * The maximum number of records to return.
     */
    limit: number | null;

    /**
     * The number of records to skip.
     */
    offset: number | null;

    /***
     * The recursion limit.
     */
    recursionLimit: number | null;

    /**
     * The query union statements.
     */
    unions: Union[];

    /**
     * The maximum number of union records to return.
     */
    unionLimit: number | null;

    /**
     * The number of union records to skip.
     */
    unionOffset: number | null;

    /**
     * The orderings for the union query.
     */
    unionOrders: Order[];

    /**
     * The common table expressions for the union query.
     */
    unionExpressions: Cte[];

    /**
     * The recursion limit for the union query.
     */
    unionRecursionLimit: number | null;

    /**
     * Indicates whether row locking is being used.
     */
    lock: boolean | string | null;
}
