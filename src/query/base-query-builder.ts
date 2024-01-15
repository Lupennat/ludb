import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Cursor from '../paginations/cursor';
import CursorPaginator from '../paginations/cursor-paginator';
import LengthAwarePaginator from '../paginations/length-aware-paginator';
import Paginator from '../paginations/paginator';
import { CacheSessionOptions } from '../types/cache';
import { Binding, Stringable } from '../types/generics';
import PaginatorI, {
    CursorPaginatorI,
    CursorPaginatorOptions,
    LengthAwarePaginatorI,
    PaginatorOptions
} from '../types/paginations';
import GrammarBuilderI, { NumericValues, QueryAbleCallback, RowValues } from '../types/query/grammar-builder';
import JoinClauseI from '../types/query/join-clause';
import QueryBuilderI, { BaseQueryBuilderI } from '../types/query/query-builder';
import { Order, OrderColumn } from '../types/query/registry';
import { merge } from '../utils';
import CommonGrammarBuilder from './common-grammar-builder';
import JoinClause from './join-clause';
import { cloneOrders } from './registry';

class BaseQueryBuilder extends CommonGrammarBuilder implements BaseQueryBuilderI {
    /**
     * Define Cache Strategy for current builder
     */
    public cache(cache: CacheSessionOptions): this {
        this.getConnection().cache(cache);

        return this;
    }

    /**
     * Chunk the results of the query.
     */
    public async chunk<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<false | void> | false | void
    ): Promise<boolean> {
        this.enforceOrderBy();

        let page = 1;
        let countResults = 0;

        do {
            // We'll execute the query for the given page and get the results. If there are
            // no results we can just break and return from here. When there are results
            // we will call the callback with the current chunk of these results here.
            let results = await this.forPage(page, count).get<T>();

            countResults = results.length;

            if (countResults === 0) {
                break;
            }

            // On each chunk result set, we will pass them to the callback and then let the
            // developer take care of everything within the callback, which allows us to
            // keep the memory low for spinning through large result sets for working.
            if ((await callback(results, page)) === false) {
                return false;
            }

            page++;

            // @ts-expect-error empty for performance
            results = undefined;
        } while (countResults === count);

        return true;
    }

    /**
     * Run a map over each item while chunking.
     */
    public async chunkMap<U, T = Dictionary>(callback: (item: T) => Promise<U> | U, count = 1000): Promise<U[]> {
        const results: U[] = [];

        await this.chunk<T>(count, async items => {
            for (const item of items) {
                results.push(await callback(item));
            }
        });

        return results;
    }

    /**
     * Execute a callback over each item while chunking.
     */
    public async each<T = Dictionary>(
        callback: (item: T, index: number) => Promise<false | void> | false | void,
        count = 1000
    ): Promise<boolean> {
        return this.chunk<T>(count, async (items, page) => {
            for (let x = 0; x < items.length; x++) {
                if ((await callback(items[x], (page - 1) * count + x)) === false) {
                    return false;
                }
            }
            return;
        });
    }

    /**
     * Chunk the results of a query by comparing IDs.
     */
    public async chunkById<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<false | void> | false | void,
        column: string | null = null,
        alias: string | null = null
    ): Promise<boolean> {
        return this.orderedChunkById<T>(count, callback, column, alias);
    }

    /**
     * Chunk the results of a query by comparing IDs in descending order.
     */
    public async chunkByIdDesc<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<false | void> | false | void,
        column: string | null = null,
        alias: string | null = null
    ): Promise<boolean> {
        return this.orderedChunkById<T>(count, callback, column, alias, true);
    }

    /**
     * Chunk the results of a query by comparing IDs in a given order.
     */
    protected async orderedChunkById<T = Dictionary>(
        count: number,
        callback: (items: T[], page: number) => Promise<false | void> | false | void,
        column: string | null,
        alias: string | null,
        descending = false
    ): Promise<boolean> {
        column = column === null ? this.defaultKeyName() : column;
        alias = this.getGrammar()
            .getValue(alias === null ? column : alias)
            .toString();

        let lastId: number | bigint | null | undefined = null;
        let page = 1;
        let countResults = 0;

        do {
            const clone = this.clone();

            // We'll execute the query for the given page and get the results. If there are
            // no results we can just break and return from here. When there are results
            // we will call the callback with the current chunk of these results here.
            let results = descending
                ? await (clone as this).forPageBeforeId(count, lastId, column).get<T>()
                : await (clone as this).forPageAfterId(count, lastId, column).get<T>();

            countResults = results.length;

            if (countResults === 0) {
                break;
            }

            // On each chunk result set, we will pass them to the callback and then let the
            // developer take care of everything within the callback, which allows us to
            // keep the memory low for spinning through large result sets for working.
            if ((await callback(results, page)) === false) {
                return false;
            }

            lastId = results[results.length - 1][alias as keyof T] as number | bigint | null | undefined;

            if (lastId == null) {
                throw new Error(
                    `The chunkById operation was aborted because the [${alias}] column is not present in the query result.`
                );
            }

            page++;

            // @ts-expect-error empty for performance
            results = undefined;
        } while (countResults === count);

        return true;
    }

    /**
     * Execute a callback over each item while chunking by ID.
     */
    public async eachById<T = Dictionary>(
        callback: (item: T, index: number) => Promise<false | void> | false | void,
        count = 1000,
        column: string | null = null,
        alias: string | null = null
    ): Promise<boolean> {
        return this.chunkById<T>(
            count,
            async (items, page) => {
                for (let x = 0; x < items.length; x++) {
                    if ((await callback(items[x], (page - 1) * count + x)) === false) {
                        return false;
                    }
                }
                return;
            },
            column,
            alias
        );
    }

    /**
     * Query lazily, by chunks of the given size.
     */
    public lazy<T = Dictionary>(chunkSize = 1000): AsyncGenerator<T> {
        if (chunkSize < 1) {
            throw new Error('The chunk size should be at least 1');
        }

        this.enforceOrderBy();

        return async function* (this: QueryBuilderI) {
            let page = 1;

            while (true) {
                const results = await this.forPage(page++, chunkSize).get<T>();

                for (const result of results) {
                    yield result;
                }

                if (results.length < chunkSize) {
                    return;
                }
            }
        }.bind(this)();
    }

    /**
     * Query lazily, by chunking the results of a query by comparing IDs.
     */
    public lazyById<T = Dictionary>(
        chunkSize = 1000,
        column: string | null = null,
        alias: string | null = null
    ): AsyncGenerator<T> {
        return this.orderedLazyById<T>(chunkSize, column, alias);
    }

    /**
     * Query lazily, by chunking the results of a query by comparing IDs in descending order.
     */
    public lazyByIdDesc<T = Dictionary>(
        chunkSize = 1000,
        column: string | null = null,
        alias: string | null = null
    ): AsyncGenerator<T> {
        return this.orderedLazyById<T>(chunkSize, column, alias, true);
    }

    /**
     * Query lazily, by chunking the results of a query by comparing IDs in a given order.
     */
    protected orderedLazyById<T = Dictionary>(
        chunkSize: number,
        column: string | null,
        alias: string | null,
        descending = false
    ): AsyncGenerator<T> {
        if (chunkSize < 1) {
            throw new Error('The chunk size should be at least 1');
        }

        const columnString = column === null ? this.defaultKeyName() : column;
        const aliasString = alias === null ? columnString : alias;

        return async function* (this: QueryBuilderI) {
            let lastId: number | bigint | null | undefined = null;

            while (true) {
                const clone = this.clone();
                const results = descending
                    ? await clone.forPageBeforeId(chunkSize, lastId, columnString).get<T>()
                    : await clone.forPageAfterId(chunkSize, lastId, columnString).get<T>();

                for (const result of results) {
                    yield result;
                }

                if (results.length < chunkSize) {
                    return;
                }

                lastId = results[results.length - 1][aliasString as keyof T] as number | bigint | null | undefined;

                if (lastId == null) {
                    throw new Error(
                        `The lazyById operation was aborted because the [${aliasString}] column is not present in the query result.`
                    );
                }
            }
        }.bind(this)();
    }

    /**
     * Execute the query and get the first result.
     */
    public async first<T = Dictionary>(columns: Stringable | Stringable[] = ['*']): Promise<T | null> {
        return (await this.limit(1).get<T>(columns))[0] ?? null;
    }

    /**
     * Execute the query and get the first result if it's the sole matching record.
     */
    public async sole<T = Dictionary>(columns: Stringable | Stringable[] = ['*']): Promise<T> {
        const result = await this.limit(2).get<T>(columns);

        const count = result.length;

        if (count === 0) {
            throw new Error(`no records were found.`);
        }

        if (count > 1) {
            throw new Error(`${count} records were found.`);
        }

        return result[0];
    }

    /**
     * Execute a query for a single record by ID.
     */
    public async find<T = Dictionary>(
        id: string | number | bigint,
        columns: Stringable | Stringable[] = ['*']
    ): Promise<T | null> {
        return this.where('id', '=', id).first<T>(columns);
    }

    /**
     * Execute a query for a single record by ID or call a callback.
     */
    public async findOr<T = Dictionary>(id: number | string | bigint): Promise<T | null>;
    public async findOr<T = Dictionary, U = unknown>(id: number | string | bigint, callback: () => U): Promise<T | U>;
    public async findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        columns: Stringable | Stringable[]
    ): Promise<T | U>;
    public async findOr<T = Dictionary, U = unknown>(
        id: number | string | bigint,
        columns: Stringable | Stringable[],
        callback: () => U
    ): Promise<T | U>;
    public async findOr<T = Dictionary, U = unknown>(
        id: string | number | bigint,
        columnsCallback: Stringable | Stringable[] | (() => U) = ['*'],
        callback: (() => U) | null = null
    ): Promise<T | U | null> {
        if (typeof columnsCallback === 'function') {
            callback = columnsCallback;
            columnsCallback = ['*'];
        }

        const data = await this.find<T>(id, columnsCallback);

        if (data !== null) {
            return data;
        }

        return typeof callback === 'function' ? callback() : null;
    }

    /**
     * Get a single column's value from the first result of a query.
     */
    public async value<T>(column: Stringable): Promise<T | null> {
        const result = await this.first<{ [key: string]: T }>([column]);

        return result !== null && Object.keys(result).length > 0 ? result[Object.keys(result)[0]] : null;
    }

    /**
     * Get a single expression value from the first result of a query.
     */
    public async rawValue<T>(expression: string, bindings: Binding[] = []): Promise<T | null> {
        const result = await this.selectRaw(expression, bindings).first<{ [key: string]: T }>();

        return result !== null && Object.keys(result).length > 0 ? result[Object.keys(result)[0]] : null;
    }

    /**
     * Get a single column's value from the first result of a query if it's the sole matching record.
     */
    public async soleValue<T>(column: Stringable): Promise<T> {
        const result = await this.sole<{ [key: string]: T }>([column]);

        return result[Object.keys(result)[0]];
    }

    /**
     * Execute the query as a "select" statement.
     */
    public async get<T = Dictionary>(columns: Stringable | Stringable[] = ['*']): Promise<T[]> {
        return await this.onceWithColumns<T>(Array.isArray(columns) ? columns : [columns], async () => {
            return await this.runSelect<T>();
        });
    }

    /**
     * Run the query as a "select" statement against the connection.
     */
    protected async runSelect<T = Dictionary>(): Promise<T[]> {
        return this.getConnection().select<T>(this.toSql(), this.getBindings(), !this.registry.useWritePdo);
    }

    /**
     * Paginate the given query into a paginator.
     */
    public async paginate<T = Dictionary>(
        perPage: number | ((total: number) => number) = 15,
        columns: Stringable | Stringable[] = ['*'],
        name = 'page',
        page?: number
    ): Promise<LengthAwarePaginatorI<T>> {
        page = page ?? Paginator.resolveCurrentPage(name);

        page = page >= 1 ? page : 1;

        const total = await this.getCountForPagination();

        perPage = typeof perPage === 'function' ? perPage(total) : perPage;

        const results = total ? await this.forPage(page, perPage).get<T>(columns) : new Array<T>();

        return this.paginator(results, total, perPage, page, {
            path: Paginator.resolveCurrentPath(),
            name
        });
    }

    /**
     * Get a simple paginator
     *
     * This is more efficient on larger data-sets, etc.
     */
    public async simplePaginate<T = Dictionary>(
        perPage = 15,
        columns: Stringable | Stringable[] = ['*'],
        name = 'page',
        page?: number
    ): Promise<PaginatorI<T>> {
        page = page ?? Paginator.resolveCurrentPage(name);

        page = page >= 1 ? page : 1;

        this.offset((page - 1) * perPage).limit(perPage + 1);

        return this.simplePaginator(await this.get<T>(columns), perPage, page, {
            path: Paginator.resolveCurrentPath(),
            name
        });
    }

    /**
     * Get a cursor paginator
     *
     * This is more efficient on larger data-sets, etc.
     */
    public async cursorPaginate<T = Dictionary>(
        perPage = 15,
        columns: Stringable | Stringable[] = ['*'],
        name = 'cursor',
        cursor?: Cursor | string | null
    ): Promise<CursorPaginatorI<T>> {
        return await this.paginateUsingCursor<T>(perPage, columns, name, cursor);
    }

    /**
     * Create a new length-aware paginator instance.
     */
    protected paginator<T>(
        results: T[],
        total: number,
        perPage: number,
        page: number,
        options: PaginatorOptions
    ): LengthAwarePaginator<T> {
        return new LengthAwarePaginator(results, total, perPage, page, options);
    }

    /**
     * Create a new simple paginator instance.
     */
    protected simplePaginator<T>(results: T[], perPage: number, page: number, options: PaginatorOptions): Paginator<T> {
        return new Paginator(results, perPage, page, options);
    }

    /**
     * Create a new cursor paginator instance.
     */
    protected cursorPaginator<T>(
        results: T[],
        perPage: number,
        cursor: Cursor | null,
        options: CursorPaginatorOptions
    ): CursorPaginator<T> {
        return new CursorPaginator(results, perPage, cursor, options);
    }

    /**
     * Get the count of the total records for the paginator.
     */
    public async getCountForPagination(columns: Stringable | Stringable[] = ['*']): Promise<number> {
        const results = await this.runPaginationCountQuery(columns);

        // Once we have run the pagination count query, we will get the resulting count and
        // take into account what type of query it was. When there is a group by we will
        // just return the count of the entire results set since that will be correct.
        if (results.length === 0) {
            return 0;
        }

        return Number(results[0].aggregate);
    }

    /**
     * Run a pagination count query.
     */
    protected async runPaginationCountQuery(
        columns: Stringable | Stringable[]
    ): Promise<{ aggregate: number | string }[]> {
        if (this.registry.groups.length || this.registry.havings.length) {
            const clone = this.cloneForPaginationCount();

            if (clone.getRegistry().columns === null && this.registry.joins.length > 0) {
                clone.select(`${this.registry.from}.*`);
            }

            return await (this.newQuery() as this)
                .from(this.raw(`(${clone.toSql()}) as ${this.getGrammar().wrap('aggregate_table')}`))
                .mergeBindings(clone)
                .setAggregate('count', this.withoutSelectAliases(columns))
                .get<{ aggregate: number | string }>();
        }

        return (
            this.cloneWithout(
                this.registry.unions.length ? ['orders', 'limit', 'offset'] : ['columns', 'orders', 'limit', 'offset']
            ).cloneWithoutBindings(this.registry.unions.length ? ['order'] : ['select', 'order']) as this
        )
            .setAggregate('count', this.withoutSelectAliases(columns))
            .get<{ aggregate: number | string }>();
    }

    /**
     * Clone the existing query instance for usage in a pagination subquery.
     */
    protected cloneForPaginationCount(): QueryBuilderI {
        return this.cloneWithout(['orders', 'limit', 'offset']).cloneWithoutBindings(['order']);
    }

    /**
     * Remove the column aliases since they will break count queries.
     */
    protected withoutSelectAliases(columns: Stringable | Stringable[]): string[] {
        return (Array.isArray(columns) ? columns : [columns]).map(column => {
            column = this.getGrammar().getValue(column).toString();
            const position = column.toLowerCase().indexOf(' as ');
            return position > -1 ? column.slice(0, position) : column;
        });
    }

    /**
     * Paginate the given query using a cursor paginator.
     */
    protected async paginateUsingCursor<T>(
        perPage: number,
        columns: Stringable | Stringable[],
        name: string,
        cursor?: Cursor | string | null
    ): Promise<CursorPaginatorI<T>> {
        const cursorInstance =
            typeof cursor === 'string'
                ? Cursor.fromEncoded(cursor)
                : cursor == null
                  ? CursorPaginator.resolveCurrentCursor(name, cursor)
                  : cursor;

        const orders = this.ensureOrderForCursorPagination(
            cursorInstance !== null && cursorInstance.pointsToPreviousItems()
        );

        if (cursorInstance != null) {
            const addCursorConditions = (builder: GrammarBuilderI, previousColumn: null | string, i: number): void => {
                const unionBuilders = builder.getRegistry().unions.length
                    ? builder.getRegistry().unions.map(union => {
                          return union.query;
                      })
                    : [];
                if (previousColumn !== null) {
                    const originalColumn = this.getOriginalColumnNameForCursorPagination(this, previousColumn);

                    builder.where(
                        originalColumn.includes('(') || originalColumn.includes(')')
                            ? this.raw(originalColumn)
                            : originalColumn,
                        '=',
                        cursorInstance.parameter(previousColumn)
                    );
                    // unionBuilders should always be empty
                    // for (const unionBuilder of unionBuilders) {
                    //     unionBuilder.where(
                    //         this.getOriginalColumnNameForCursorPagination(this, previousColumn),
                    //         '=',
                    //         cursorInstance.parameter(previousColumn)
                    //     );
                    //     this.addBinding(unionBuilder.getRawBindings()['where'], 'union');
                    // }
                }
                builder.where(builder => {
                    const order = orders[i];
                    const column = this.getGrammar().getValue(order.column).toString();
                    const originalColumn = this.getOriginalColumnNameForCursorPagination(this, column);
                    builder.where(
                        originalColumn.includes('(') || originalColumn.includes(')')
                            ? this.raw(originalColumn)
                            : originalColumn,
                        order.direction === 'asc' ? '>' : '<',
                        cursorInstance.parameter(column)
                    );
                    if (i < orders.length - 1) {
                        builder.orWhere(builder => {
                            addCursorConditions(builder, column, i + 1);
                        });
                    }

                    for (const unionBuilder of unionBuilders) {
                        unionBuilder.where(unionBuilder => {
                            unionBuilder.where(
                                this.getOriginalColumnNameForCursorPagination(this, column),
                                order.direction === 'asc' ? '>' : '<',
                                cursorInstance.parameter(column)
                            );
                            if (i < orders.length - 1) {
                                unionBuilder.orWhere(unionBuilder => {
                                    addCursorConditions(unionBuilder, column, i + 1);
                                });
                            }
                            this.addBinding(unionBuilder.getRawBindings()['where'], 'union');
                        });
                    }
                });
            };
            addCursorConditions(this, null, 0);
        }

        this.limit(perPage + 1);

        return this.cursorPaginator<T>(await this.get<T>(columns), perPage, cursorInstance, {
            path: CursorPaginator.resolveCurrentPath(),
            name,
            parameters: orders.map(order => this.getGrammar().getValue(order.column).toString())
        });
    }

    /**
     * Ensure the proper order by required for cursor pagination.
     */
    protected ensureOrderForCursorPagination(shouldReverse: boolean): OrderColumn[] {
        this.enforceOrderBy();

        let orders = cloneOrders(
            (this.registry.orders.length > 0 ? this.registry.orders : this.registry.unionOrders).filter(
                (order: Order) => {
                    return 'direction' in order;
                }
            )
        ) as OrderColumn[];

        if (shouldReverse) {
            orders = orders.map(order => {
                order.direction = order.direction === 'asc' ? 'desc' : 'asc';
                return order;
            });
        }

        return orders;
    }

    /**
     * Get the original column name of the given column, without any aliasing.
     */
    protected getOriginalColumnNameForCursorPagination(builder: QueryBuilderI, parameter: string): string {
        const columns = builder.getColumns();
        for (const column of columns) {
            const position = column.toLowerCase().lastIndexOf(' as ');
            if (position > -1) {
                const original = column.slice(0, position);
                const alias = column.slice(position + 4);
                if (parameter === alias || builder.getGrammar().wrap(parameter) === alias) {
                    return original;
                }
            }
        }

        return parameter;
    }

    /**
     * Get an async generator for the given query.
     */
    public cursor<T>(): AsyncGenerator<T> {
        if (this.registry.columns === null) {
            this.registry.columns = ['*'];
        }

        return async function* (this: QueryBuilderI) {
            yield* await this.getConnection().cursor<T>(
                this.toSql(),
                this.getBindings(),
                !this.getRegistry().useWritePdo
            );
        }.bind(this)();
    }

    /**
     * Throw an exception if the query doesn't have an orderBy clause.
     */
    protected enforceOrderBy(): void {
        if (this.registry.orders.length === 0 && this.registry.unionOrders.length === 0) {
            throw new Error('You must specify an orderBy clause when using this function.');
        }
    }

    /**
     * Get an object or an array instance containing the values of a given column.
     */
    public async pluck<T>(column: Stringable): Promise<T[]>;
    public async pluck<T>(column: Stringable, key: Stringable): Promise<{ [key: string]: T }>;
    public async pluck<T>(column: Stringable, key: Stringable | null = null): Promise<{ [key: string]: T } | T[]> {
        // First, we will need to select the results of the query accounting for the
        // given columns / key. Once we have the results, we will be able to take
        // the results and get the exact data that was requested for the query.
        const queryResult = await this.onceWithColumns(key === null ? [column] : [column, key], async () => {
            return await this.runSelect();
        });

        if (queryResult.length === 0) {
            if (key === null) {
                return [];
            }
            return {};
        }

        // If the columns are qualified with a table or have an alias, we cannot use
        // those directly in the "pluck" operations since the results from the DB
        // are only keyed by the column itself. We'll strip the table out here.
        column = this.stripTableForPluck(column);

        if (key === null) {
            return queryResult.map(item => item[column as keyof Dictionary]) as T[];
        } else {
            key = this.stripTableForPluck(key);
            return queryResult.reduce((carry, item) => {
                const newKey = item[key as keyof Dictionary];
                if (Array.isArray(newKey) || Buffer.isBuffer(newKey)) {
                    throw new Error(`key value [${Array.isArray(newKey) ? 'Array' : 'Buffer'}] is not stringable`);
                }
                carry[newKey === null ? 'null' : newKey.toString()] = item[column as keyof Dictionary];
                return carry;
            }, {}) as { [key: string]: T };
        }
    }

    /**
     * Strip off the table name or alias from a column identifier.
     */
    protected stripTableForPluck(column: Stringable): string {
        column = this.getGrammar().getValue(column).toString();
        const separator = column.toLowerCase().includes(' as ') ? ' as ' : '\\.';
        const regex = new RegExp(separator, 'gi');

        return column.split(regex).pop() as string;
    }

    /**
     * Concatenate values of a given column as a string.
     */
    public async implode<T>(column: Stringable, glue = ''): Promise<string> {
        return (await this.pluck<T>(column)).join(glue);
    }

    /**
     * Determine if any rows exist for the current query.
     */
    public async exists(): Promise<boolean> {
        this.applyBeforeQueryCallbacks();

        const results = await this.getConnection().select<{ exists: boolean }>(
            this.getGrammar().compileExists(this),
            this.getBindings(),
            !this.registry.useWritePdo
        );

        // If the results have rows, we will get the row and see if the exists column is a
        // boolean true. If there are no results for this query we will return false as
        // there are no rows for this query at all, and we can return that info here.
        if (results.length > 0) {
            return Boolean(results[0].exists);
        }

        return false;
    }

    /**
     * Determine if no rows exist for the current query.
     */
    public async doesntExist(): Promise<boolean> {
        return !(await this.exists());
    }

    /**
     * Execute the given callback if no rows exist for the current query.
     */
    public async existsOr<T>(callback: () => T): Promise<true | T> {
        return (await this.exists()) ? true : callback();
    }

    /**
     * Execute the given callback if rows exist for the current query.
     */
    public async doesntExistOr<T>(callback: () => T): Promise<true | T> {
        return (await this.doesntExist()) ? true : callback();
    }

    /**
     * Retrieve the "count" result of the query.
     */
    public async count(columns: Stringable | Stringable[] = '*'): Promise<number | bigint> {
        const res = await this.aggregate('count', Array.isArray(columns) ? columns : [columns]);
        return res === null ? 0 : this.getInteger(res);
    }

    /**
     * Get Number Or Bigint Integer
     */
    protected getInteger(value: string | number | bigint): number | bigint {
        return BigInt(value) > Number.MAX_SAFE_INTEGER || BigInt(value) < Number.MIN_SAFE_INTEGER
            ? BigInt(value)
            : Number(value);
    }

    /**
     * Retrieve the minimum value of a given column.
     */
    public async min(column: Stringable): Promise<string | number | bigint | null> {
        return this.aggregate('min', [column]);
    }

    /**
     * Retrieve the maximum value of a given column.
     */
    public async max(column: Stringable): Promise<string | number | bigint | null> {
        return this.aggregate('max', [column]);
    }

    /**
     * Retrieve the sum of the values of a given column.
     */
    public async sum(column: Stringable): Promise<string | number | bigint> {
        const res = await this.aggregate('sum', [column]);
        return res === null ? 0 : res;
    }

    /**
     * Retrieve the average of the values of a given column.
     */
    public async avg(column: Stringable): Promise<string | number | bigint | null> {
        return this.aggregate('avg', [column]);
    }

    /**
     * Alias for the "avg" method.
     */
    public async average(column: Stringable): Promise<string | number | bigint | null> {
        return this.avg(column);
    }

    /**
     * Execute an aggregate function on the database.
     */
    public async aggregate(fnName: string, columns: Stringable[] = ['*']): Promise<string | number | bigint | null> {
        const results = await (
            this.cloneWithout(
                this.registry.unions.length > 0 || this.registry.havings.length > 0 ? [] : ['columns']
            ).cloneWithoutBindings(
                this.registry.unions.length > 0 || this.registry.havings.length > 0 ? [] : ['select']
            ) as this
        )
            .setAggregate(fnName, columns)
            .get<{ aggregate: string | number | bigint | null }>(columns);

        if (results.length > 0) {
            return results[0].aggregate;
        }

        return null;
    }

    /**
     * Execute a numeric aggregate function on the database.
     */
    public async numericAggregate(fnName: string, columns: Stringable[] = ['*']): Promise<number | bigint> {
        const result = await this.aggregate(fnName, columns);

        // If there is no result, we can obviously just return 0 here. Next, we will check
        // if the result is an integer or float. If it is already one of these two data
        // types we can just return the result as-is, otherwise we will convert this.
        if (!result) {
            return 0;
        }

        if (typeof result === 'bigint' || typeof result === 'number') {
            return result;
        }

        // If the result doesn't contain a decimal place, we will assume it is an int then
        // cast it to one. When it does we will cast it to a float since it needs to be
        // cast to the expected data type for the developers out of pure convenience.
        return !result.includes('.') ? this.getInteger(result) : parseFloat(result);
    }

    /**
     * Execute the given callback while selecting the given columns.
     *
     * After running the callback, the columns are reset to the original value.
     */
    protected async onceWithColumns<T>(columns: Stringable[], callback: () => Promise<T[]>): Promise<T[]> {
        const original = this.registry.columns;

        if (original === null) {
            this.registry.columns = columns;
        }

        const result = await callback();

        this.registry.columns = original;

        return result;
    }

    /**
     * Insert new records into the database.
     */
    public async insert(values: RowValues | RowValues[]): Promise<boolean> {
        // Since every insert gets treated like a batch insert, we will make sure the
        // bindings are structured in a way that is convenient when building these
        // inserts statements by verifying these elements are actually an array.
        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            return true;
        }

        const sortedRowValues = this.getSortedRowValues(values);

        this.applyBeforeQueryCallbacks();

        // Finally, we will run this query against the database connection and return
        // the results. We will need to also flatten these bindings before running
        // the query so they are all in one huge, flattened array for execution.
        return this.getConnection().insert(
            this.getGrammar().compileInsert(this, sortedRowValues),
            this.cleanBindings(sortedRowValues.map(value => Object.values(value)).flat(1))
        );
    }

    /**
     * Insert new records into the database while ignoring errors.
     */
    public async insertOrIgnore(values: RowValues | RowValues[]): Promise<number> {
        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            return 0;
        }

        const sortedRowValues = this.getSortedRowValues(values);

        this.applyBeforeQueryCallbacks();

        return await this.getConnection().affectingStatement(
            this.getGrammar().compileInsertOrIgnore(this, sortedRowValues),
            this.cleanBindings(sortedRowValues.map(value => Object.values(value)).flat(1))
        );
    }

    /**
     * Get Sorted Values From Array Of RowValues
     */
    protected getSortedRowValues(values: RowValues | RowValues[]): RowValues[] {
        let currentKeys: string[];

        return !Array.isArray(values)
            ? [values]
            : // Here, we will sort the insert keys for every record so that each insert is
              // in the same order for the record. We need to make sure this is the case
              // so there are not any errors or problems when inserting these records.
              values.map(value => {
                  const row = Object.keys(value)
                      .sort()
                      .reduce(
                          (acc: RowValues, key) => ({
                              ...acc,
                              [key]: value[key]
                          }),
                          {}
                      );
                  if (currentKeys == null) {
                      currentKeys = Object.keys(row);
                  } else {
                      const keys = Object.keys(row);
                      if (keys.length !== currentKeys.length) {
                          const difference = keys
                              .filter(x => !currentKeys.includes(x))
                              .concat(currentKeys.filter(x => !keys.includes(x)));
                          throw new Error(`Missing columns [${difference.join(', ')}], please add to each rows.`);
                      }
                  }
                  return row;
              });
    }

    /**
     * Insert a new record and get the value of the primary key.
     */
    public async insertGetId<T extends number | bigint | string>(
        values: RowValues,
        sequence: string | null = null
    ): Promise<T | null> {
        this.applyBeforeQueryCallbacks();

        return this.getConnection().insertGetId(
            this.getGrammar().compileInsertGetId(this, values, sequence),
            this.cleanBindings(Object.values(values)),
            sequence
        );
    }

    /**
     * Insert new records into the table using a subquery.
     */
    public async insertUsing(
        columns: Stringable[],
        query: QueryAbleCallback<GrammarBuilderI> | GrammarBuilderI | Stringable
    ): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const [sql, bindings] = this.createSub(query);

        const fullBindings = [...this.registry.bindings['expressions'], ...bindings];

        return await this.getConnection().affectingStatement(
            this.getGrammar().compileInsertUsing(this, columns, sql),
            this.cleanBindings(fullBindings)
        );
    }

    /**
     * Update records in the database.
     */
    public async update(values: RowValues): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const sql = this.getGrammar().compileUpdate(this, values);

        return await this.getConnection().update(
            sql,
            this.cleanBindings(this.getGrammar().prepareBindingsForUpdate(this, this.registry.bindings, values))
        );
    }

    /**
     * Update records in a PostgreSQL database using the update from syntax.
     */
    public async updateFrom(values: RowValues): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const sql = this.getGrammar().compileUpdateFrom(this, values);

        return await this.getConnection().update(
            sql,
            this.cleanBindings(this.getGrammar().prepareBindingsForUpdateFrom(this, this.registry.bindings, values))
        );
    }

    /**
     * Insert or update a record matching the attributes, and fill it with values.
     */
    public async updateOrInsert(attributes: RowValues, values: RowValues = {}): Promise<boolean> {
        if (!(await this.where(attributes).exists())) {
            return this.insert(merge(attributes, values));
        }

        if (Object.keys(values).length === 0) {
            return true;
        }

        return Boolean(await this.limit(1).update(values));
    }

    /**
     * Insert new records or update the existing ones.
     */
    public async upsert(
        values: RowValues | RowValues[],
        uniqueBy: string | string[],
        update: Array<string | RowValues> | null = null
    ): Promise<number> {
        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            return 0;
        } else if (update !== null && Array.isArray(update) && update.length === 0) {
            await this.insert(values);
            return Array.isArray(values) ? values.length : 1;
        }

        const sortedRowValues = this.getSortedRowValues(values);

        if (update === null) {
            update = Object.keys(sortedRowValues[0]);
        }

        this.applyBeforeQueryCallbacks();

        const bindings = this.cleanBindings(
            sortedRowValues
                .map(value => Object.values(value))
                .flat(1)
                .concat(
                    (
                        update.filter(binding => {
                            return typeof binding !== 'string';
                        }) as RowValues[]
                    ).reduce((carry: any[], item: RowValues) => {
                        return carry.concat(Object.values(item));
                    }, [])
                )
        );

        return this.getConnection().affectingStatement(
            this.getGrammar().compileUpsert(
                this,
                sortedRowValues,
                Array.isArray(uniqueBy) ? uniqueBy : [uniqueBy],
                update
            ),
            bindings
        );
    }

    /**
     * Increment a column's value by a given amount.
     */
    public async increment(
        column: string,
        amount: number | bigint | string = 1,
        extra: RowValues = {}
    ): Promise<number> {
        if ((typeof amount !== 'number' || typeof amount !== 'bigint') && isNaN(Number(amount))) {
            throw new TypeError('Non-numeric value passed to increment method.');
        }

        return this.incrementEach({ [column]: amount }, extra);
    }

    /**
     * Increment the given column's values by the given amounts.
     */
    public async incrementEach(columns: NumericValues, extra: RowValues = {}): Promise<number> {
        const processed: { [key: string]: Stringable } = {};
        for (const column in columns) {
            const amount = columns[column];
            if ((typeof amount !== 'number' || typeof amount !== 'bigint') && isNaN(Number(amount))) {
                throw new TypeError(`Non-numeric value passed as increment amount for column: '${column}'.`);
            }

            processed[column] = this.raw(`${this.getGrammar().wrap(column)} + ${amount.toString()}`);
        }

        return this.update(merge(processed, extra));
    }

    /**
     * Decrement a column's value by a given amount.
     */
    public async decrement(
        column: string,
        amount: number | bigint | string = 1,
        extra: RowValues = {}
    ): Promise<number> {
        if ((typeof amount !== 'number' || typeof amount !== 'bigint') && isNaN(Number(amount))) {
            throw new TypeError('Non-numeric value passed to decrement method.');
        }

        return this.decrementEach({ [column]: amount }, extra);
    }

    /**
     * Decrement the given column's values by the given amounts.
     */
    public async decrementEach(columns: NumericValues, extra: RowValues = {}): Promise<number> {
        const processed: { [key: string]: Stringable } = {};
        for (const column in columns) {
            const amount = columns[column];
            if ((typeof amount !== 'number' || typeof amount !== 'bigint') && isNaN(Number(amount))) {
                throw new TypeError(`Non-numeric value passed as decrement amount for column: '${column}'.`);
            }

            processed[column] = this.raw(`${this.getGrammar().wrap(column)} - ${amount.toString()}`);
        }

        return this.update(merge(processed, extra));
    }

    /**
     * Delete records from the database.
     */
    public async delete(id: string | number | bigint | null = null): Promise<number> {
        // If an ID is passed to the method, we will set the where clause to check the
        // ID to let developers to simply and quickly remove a single row from this
        // database without manually specifying the "where" clauses on the query.
        if (id !== null) {
            this.where(`${this.registry.from}.id`, '=', id);
        }

        this.applyBeforeQueryCallbacks();

        return this.getConnection().delete(
            this.getGrammar().compileDelete(this),
            this.cleanBindings(this.getGrammar().prepareBindingsForDelete(this.registry.bindings))
        );
    }

    /**
     * Run a truncate statement on the table.
     */
    public async truncate(): Promise<void> {
        this.applyBeforeQueryCallbacks();

        const truncates = this.getGrammar().compileTruncate(this);

        for (const sql in truncates) {
            this.getConnection().statement(sql, truncates[sql]);
        }
    }

    /**
     * Explains the query.
     */
    public async explain(): Promise<string[]> {
        const sql = this.toSql();
        const bindings = this.getBindings();

        return await this.getConnection().select<string>(`EXPLAIN ${sql}`, bindings);
    }

    /**
     * Get a new join clause.
     */
    protected newJoinClause<T extends GrammarBuilderI>(parentQuery: T, type: string, table: Stringable): JoinClauseI {
        return new JoinClause<T>(parentQuery, type, table);
    }
}

export default BaseQueryBuilder;
