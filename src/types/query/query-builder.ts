import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Cursor from '../../paginations/cursor';
import { Binding, Stringable } from '../generics';
import PaginatorI, { CursorPaginatorI, LengthAwarePaginatorI } from '../paginations';
import GrammarBuilderI, { NumericValues, QueryAbleCallback, RowValues } from './grammar-builder';
import RegistryI, { BindingTypes } from './registry';

export default interface QueryBuilderI extends GrammarBuilderI {
    /**
     * Chunk the results of the query.
     */
    chunk<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<void | false> | void | false
    ): Promise<boolean>;

    /**
     * Run a map over each item while chunking.
     */
    chunkMap<U, T = Dictionary>(callback: (item: T) => Promise<U> | U, count?: number): Promise<U[]>;

    /**
     * Execute a callback over each item while chunking.
     */
    each<T = Dictionary>(
        callback: (item: T, index: number) => Promise<void | false> | void | false,
        count?: number
    ): Promise<boolean>;

    /**
     * Chunk the results of a query by comparing IDs.
     */
    chunkById<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<void | false> | void | false,
        column?: string | null,
        alias?: string | null
    ): Promise<boolean>;

    /**
     * Chunk the results of a query by comparing IDs in descending order.
     */
    chunkByIdDesc<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<void | false> | void | false,
        column?: string | null,
        alias?: string | null
    ): Promise<boolean>;

    /**
     * Execute a callback over each item while chunking by ID.
     */
    eachById<T = Dictionary>(
        callback: (item: T, index: number) => Promise<false | void> | false | void,
        count?: number,
        column?: string | null,
        alias?: string | null
    ): Promise<boolean>;

    /**
     * Query lazily, by chunks of the given size.
     */
    lazy<T = Dictionary>(chunkSize?: number): AsyncGenerator<T>;

    /**
     * Query lazily, by chunking the results of a query by comparing IDs.
     */
    lazyById<T = Dictionary>(chunkSize?: number, column?: string | null, alias?: string | null): AsyncGenerator<T>;

    /**
     * Query lazily, by chunking the results of a query by comparing IDs in descending order.
     */
    lazyByIdDesc<T = Dictionary>(chunkSize?: number, column?: string, alias?: string | null): AsyncGenerator<T>;

    /**
     * Execute the query and get the first result.
     */
    first<T = Dictionary>(columns?: Stringable | Stringable[]): Promise<T | null>;

    /**
     * Execute the query and get the first result if it's the sole matching record.
     */
    sole<T = Dictionary>(columns?: Stringable | Stringable[]): Promise<T>;

    /**
     * Execute a query for a single record by ID.
     */
    find<T = Dictionary>(id: number | string | bigint, columns?: Stringable | Stringable[]): Promise<T | null>;

    /**
     * Execute a query for a single record by ID or call a callback.
     */
    findOr<T = Dictionary>(id: number | string | bigint): Promise<T | null>;
    findOr<T = Dictionary, U = unknown>(id: number | string | bigint, callback: () => U): Promise<T | U>;
    findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        columns: Stringable | Stringable[]
    ): Promise<T | U>;
    findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        columnsCallback?: Stringable | Stringable[] | (() => U),
        callback?: (() => U) | null
    ): Promise<T | U | null>;

    /**
     * Get a single column's value from the first result of a query.
     */
    value<T>(column: Stringable): Promise<T | null>;

    /**
     * Get a single expression value from the first result of a query.
     */
    rawValue<T>(expression: string, bindings?: Binding[]): Promise<T | null>;

    /**
     * Get a single column's value from the first result of a query if it's the sole matching record.
     */
    soleValue<T>(column: Stringable): Promise<T>;

    /**
     * Execute the query as a "select" statement.
     */
    get<T = Dictionary>(columns?: Stringable | Stringable[]): Promise<T[]>;

    /**
     * Paginate the given query into a paginator.
     */
    paginate<T = Dictionary>(
        perPage?: number | ((total: number) => number),
        columns?: Stringable | Stringable[],
        name?: string,
        page?: number
    ): Promise<LengthAwarePaginatorI<T>>;

    /**
     * Get a simple paginator
     *
     * This is more efficient on larger data-sets, etc.
     */
    simplePaginate<T = Dictionary>(
        perPage?: number,
        columns?: Stringable | Stringable[],
        name?: string,
        page?: number
    ): Promise<PaginatorI<T>>;

    /**
     * Get a cursor paginator
     *
     * This is more efficient on larger data-sets, etc.
     */
    cursorPaginate<T = Dictionary>(
        perPage?: number,
        columns?: Stringable | Stringable[],
        name?: string,
        cursor?: Cursor | string | null
    ): Promise<CursorPaginatorI<T>>;

    /**
     * Get the count of the total records for the paginator.
     */
    getCountForPagination(columns?: Stringable | Stringable[]): Promise<number>;

    /**
     * Get an async Generator for the given query.
     */
    cursor<T>(): AsyncGenerator<T>;

    /**
     * Get an object or an array containing the values of a given column.
     */
    pluck<T>(column: Stringable, key?: null): Promise<T[]>;
    pluck<T>(column: Stringable, key: Stringable): Promise<{ [key: string]: T }>;
    pluck<T>(column: Stringable, key?: Stringable | null): Promise<{ [key: string]: T } | T[]>;

    /**
     * Concatenate values of a given column as a string.
     */
    implode(column: Stringable, glue?: string): Promise<string>;

    /**
     * Determine if any rows exist for the current query.
     */
    exists(): Promise<boolean>;

    /**
     * Determine if no rows exist for the current query.
     */
    doesntExist(): Promise<boolean>;

    /**
     * Execute the given callback if no rows exist for the current query.
     */
    existsOr<T>(callback: () => T): Promise<T | true>;

    /**
     * Execute the given callback if rows exist for the current query.
     */
    doesntExistOr<T>(callback: () => T): Promise<T | true>;

    /**
     * Retrieve the "count" result of the query.
     */
    count(columns?: Stringable | Stringable[]): Promise<number | bigint>;

    /**
     * Retrieve the minimum value of a given column.
     */
    min(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Retrieve the maximum value of a given column.
     */
    max(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Retrieve the sum of the values of a given column.
     */
    sum(column: Stringable): Promise<number | bigint | string>;

    /**
     * Retrieve the average of the values of a given column.
     */
    avg(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Alias for the "avg" method.
     */
    average(column: Stringable): Promise<number | bigint | string | null>;

    /**
     * Execute an aggregate function on the database.
     */
    aggregate(fnName: string, columns?: Stringable[]): Promise<number | bigint | string | null>;

    /**
     * Execute a numeric aggregate function on the database.
     */
    numericAggregate(fnName: string, columns?: Stringable[]): Promise<number | bigint>;

    /**
     * Insert new records into the database.
     */
    insert(values: RowValues | RowValues[]): Promise<boolean>;

    /**
     * Insert new records into the database while ignoring errors.
     */
    insertOrIgnore(values: RowValues | RowValues[]): Promise<number>;

    /**
     * Insert a new record and get the value of the primary key.
     */
    insertGetId<T extends number | bigint | string>(values: RowValues, sequence?: string | null): Promise<T | null>;

    /**
     * Insert new records into the table using a subquery.
     */
    insertUsing(
        columns: Stringable[],
        query: QueryAbleCallback<QueryBuilderI> | QueryBuilderI | Stringable
    ): Promise<number>;

    /**
     * Update records in the database.
     */
    update(values: RowValues): Promise<number>;

    /**
     * Update records in a PostgreSQL database using the update from syntax.
     */
    updateFrom(values: RowValues): Promise<number>;

    /**
     * Insert or update a record matching the attributes, and fill it with values.
     */
    updateOrInsert(attributes: RowValues, values?: RowValues): Promise<boolean>;

    /**
     * Insert new records or update the existing ones.
     */
    upsert(
        values: RowValues | RowValues[],
        uniqueBy: string | string[],
        update?: Array<string | RowValues> | null
    ): Promise<number>;

    /**
     * Increment a column's value by a given amount.
     */
    increment(column: string, amount?: number | bigint | string, extra?: RowValues): Promise<number>;

    /**
     * Increment the given column's values by the given amounts.
     */
    incrementEach(columns: NumericValues, extra?: RowValues): Promise<number>;

    /**
     * Decrement a column's value by a given amount.
     */
    decrement(column: string, amount?: number | bigint | string, extra?: RowValues): Promise<number>;

    /**
     * Decrement the given column's values by the given amounts.
     */
    decrementEach(columns: NumericValues, extra?: RowValues): Promise<number>;

    /**
     * Delete records from the database.
     */
    delete(id?: string | bigint | number | null): Promise<number>;

    /**
     * Run a truncate statement on the table.
     */
    truncate(): Promise<void>;

    /**
     * Explains the query.
     */
    explain(): Promise<string[]>;

    /**
     * Use the "write" PDO connection when executing the query.
     */
    useWritePdo(): this;

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
