import { Collection } from 'collect.js';
import deepmerge from 'deepmerge';
import { snakeCase } from 'snake-case';
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
    QueryAble,
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

import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Registry, { BindingTypes, Order, Where } from '../types/query/registry';
import { raw } from '../utils';
import BuilderContract from './builder-contract';
import ExpressionContract from './expression-contract';
import { default as createRegistry } from './registry';

abstract class BaseBuilder extends BuilderContract {
    /**
     * The Builder registry.
     */
    protected registry: Registry;

    /**
     * All of the available clause operators.
     */
    protected operators = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '<>',
        '!=',
        '<=>',
        'like',
        'like binary',
        'not like',
        'ilike',
        '&',
        '|',
        '^',
        '<<',
        '>>',
        '&~',
        'is',
        'is not',
        'rlike',
        'not rlike',
        'regexp',
        'not regexp',
        '~',
        '~*',
        '!~',
        '!~*',
        'similar to',
        'not similar to',
        'not ilike',
        '~~*',
        '!~~*'
    ];

    /**
     * All of the available bitwise operators.
     */
    protected bitwiseOperators = ['&', '|', '^', '<<', '>>', '&~'];

    /**
     * Create a new query builder instance.
     */
    constructor(
        protected connection: ConnectionSessionI,
        protected grammar?: GrammarI,
        protected processor?: ProcessorI
    ) {
        super();
        this.registry = createRegistry();
    }

    /**
     * Get Query Builder Registry
     */
    public getRegistry(): Registry {
        return this.registry;
    }

    /**
     * Set Query Builder Registry
     */
    public setRegistry(registry: Registry): this {
        this.registry = registry;

        return this;
    }

    /**
     * Set the columns to be selected.
     */
    public select(
        columns: SelectColumn<this> | SelectColumn<this>[] = ['*'],
        ...otherColumns: SelectColumn<this>[]
    ): this {
        this.registry.columns = [];
        this.registry.bindings.select = [];

        columns = (Array.isArray(columns) ? columns : [columns]).concat(otherColumns);

        for (const column of columns) {
            if (this.isStringable(column)) {
                if (this.registry.columns == null) {
                    this.registry.columns = [];
                }

                this.registry.columns.push(column);
            } else {
                for (const key in column) {
                    if (this.isQueryable(key)) {
                        this.selectSub(column[key], key);
                    }
                }
            }
        }

        return this;
    }

    /**
     * Add a subselect expression to the query.
     */
    public selectSub(query: SubQuery<this>, as: Stringable): this {
        const [queryString, bindings] = this.createSub(query);

        return this.selectRaw(`(${queryString}) as ${this.getGrammar().wrap(as)}`, bindings);
    }

    /**
     * Add a new "raw" select expression to the query.
     */
    public selectRaw(expression: string, bindings: Binding[] = []): this {
        this.addSelect(this.raw(expression));

        if (bindings) {
            this.addBinding(bindings, 'select');
        }

        return this;
    }

    /**
     * Makes "from" fetch from a subquery.
     */
    public fromSub(query: SubQuery<this>, as: Stringable): this {
        const [queryString, bindings] = this.createSub(query);

        return this.fromRaw(`(${queryString}) as ${this.getGrammar().wrapTable(as)}`, bindings);
    }

    /**
     * Add a raw from clause to the query.
     */
    public fromRaw(expression: string, bindings: Binding[] = []): this {
        this.registry.from = this.raw(expression);

        this.addBinding(bindings, 'from');

        return this;
    }

    /**
     * Creates a subquery and parse it.
     */
    protected createSub<T extends BuilderContract = this>(query: SubQuery<T>): [string, Binding[]] {
        // If the given query is a Closure, we will execute it while passing in a new
        // query instance to the Closure. This will give the developer a chance to
        // format and work with the query before we cast it to a raw SQL string.
        if (this.isQueryableCallback<T>(query)) {
            const callback = query;
            query = this.forSubQuery();
            callback(query as T);
        }

        return this.parseSub(query);
    }

    /**
     * Parse the subquery into SQL and bindings.
     */
    protected parseSub(query: QueryAble): [string, Binding[]] {
        if (this.isBuilderContract(query)) {
            query = this.prependDatabaseNameIfCrossDatabaseQuery(query);
            return [query.toSql(), query.getBindings()];
        }

        if (this.isStringable(query)) {
            return [this.getGrammar().getValue(query).toString(), []];
        }

        throw new TypeError('A subquery must be a query builder instance, a Closure, or a string.');
    }

    /**
     * Prepend the database name if the given query is on another database.
     */
    protected prependDatabaseNameIfCrossDatabaseQuery(query: BuilderContract): BuilderContract {
        if (query.getConnection().getDatabaseName() !== this.getConnection().getDatabaseName()) {
            const databaseName = query.getConnection().getDatabaseName();
            const queryFrom = query.getGrammar().getValue(query.getRegistry().from).toString();
            if (queryFrom.startsWith(databaseName) && !queryFrom.includes('.')) {
                query.getRegistry().from = `${databaseName}.${queryFrom}`;
            }
        }

        return query;
    }

    /**
     * Add a new select column to the query.
     */
    public addSelect(columns: SelectColumn<this> | SelectColumn<this>[], ...otherColumns: SelectColumn<this>[]): this {
        columns = (Array.isArray(columns) ? columns : [columns]).concat(otherColumns);

        for (const column of columns) {
            if (this.isStringable(column)) {
                if (this.registry.columns == null) {
                    this.registry.columns = [];
                }

                this.registry.columns.push(column);
            } else {
                for (const key in column) {
                    if (this.isQueryable(key)) {
                        this.selectSub(column[key], key);
                    }
                }
            }
        }

        return this;
    }

    /**
     * Force the query to only return distinct results.
     */
    public distinct(column?: boolean | Stringable, ...columns: Stringable[]): this {
        if (column != null) {
            this.registry.distinct = typeof column === 'boolean' ? column : [column].concat(columns);
        } else {
            this.registry.distinct = true;
        }

        return this;
    }

    /**
     * Set the table which the query is targeting.
     */
    public from(table: SubQuery<this>, as = ''): this {
        if (this.isQueryable(table)) {
            return this.fromSub(table, as);
        }

        this.registry.from = as ? `${this.getGrammar().getValue(table).toString()} as ${as}` : table;

        return this;
    }

    /**
     * Add a join clause to the query.
     */
    public join(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public join(table: Stringable, first: Stringable, operator: Stringable): this;
    public join(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public join(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string
    ): this;
    public join(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        type = 'inner'
    ): this {
        return this.baseJoin(type, table, first, join => {
            join.on(first, operatorOrSecond, second);
        });
    }

    /**
     * Add a join on or where clause to the query.
     */
    protected baseJoin<T>(type: string, table: Stringable, first: T, callback: (join: JoinClauseI) => void): this {
        const join = this.newJoinClause(this, type, table);
        // If the first "column" of the join is really a Closure instance the developer
        // is trying to build a join with a complex "on" clause containing more than
        // one condition, so we'll add the join and call a Closure with the query.
        if (this.isQueryableCallback<JoinClauseI>(first)) {
            first(join);
        }

        // If the column is simply a string, we can assume the join simply has a basic
        // "on" clause with a single condition. So we will just build the join with
        // this simple join clauses attached to it. There is not a join callback.
        else {
            callback(join);
        }

        this.registry.joins.push(join);
        this.addBinding(join.getBindings(), 'join');

        return this;
    }

    /**
     * Add a "join where" clause to the query.
     */
    public joinWhere(table: Stringable, first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject): this;
    public joinWhere(table: Stringable, first: Stringable, second: Binding | QueryAbleCallback<JoinClauseI>): this;
    public joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>,
        type?: string
    ): this;
    public joinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond: string | Binding | QueryAbleCallback<JoinClauseI> = null,
        second: Binding | QueryAbleCallback<JoinClauseI> = null,
        type = 'inner'
    ): this {
        return this.baseJoin(type, table, first, join => {
            join.where(first, operatorOrSecond, second);
        });
    }
    /**
     * Add a subquery join clause to the query.
     */
    public joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinSub(query: SubQuery<JoinClauseI>, as: Stringable, first: Stringable, operator: Stringable): this;
    public joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    public joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string
    ): this;
    public joinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        type = 'inner'
    ): this {
        return this.baseJoinSub(query, as, (expression: ExpressionContract) => {
            return this.join(expression, first, operatorOrSecond, second, type);
        });
    }

    /**
     * Add a subquery join on or where clause to the query.
     */
    protected baseJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        callback: (expression: ExpressionContract) => this
    ): this {
        const [queryString, bindings] = this.createSub(query);

        const expression = `(${queryString}) as ${this.getGrammar().wrapTable(as)}`;

        this.addBinding(bindings, 'join');

        return callback(this.raw(expression));
    }

    /**
     * Add a subquery join where clause to the query.
     */
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>,
        type?: string
    ): this;
    public joinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond: string | Binding | QueryAbleCallback<JoinClauseI> = null,
        second: Binding | QueryAbleCallback<JoinClauseI> = null,
        type = 'inner'
    ): this {
        return this.baseJoinSub(query, as, (expression: ExpressionContract) => {
            return this.joinWhere(expression, first, operatorOrSecond, second, type);
        });
    }

    /**
     * Add a left join to the query.
     */
    public leftJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public leftJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    public leftJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public leftJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public leftJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.join(table, first, operatorOrSecond, second, 'left');
    }
    /**
     * Add a "join where" clause to the query.
     */
    public leftJoinWhere(table: Stringable, first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject): this;
    public leftJoinWhere(table: Stringable, first: Stringable, second: Binding | QueryAbleCallback<JoinClauseI>): this;
    public leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond: string | Binding | QueryAbleCallback<JoinClauseI> = null,
        second: Binding | QueryAbleCallback<JoinClauseI> = null
    ): this {
        return this.joinWhere(table, first, operatorOrSecond, second, 'left');
    }

    /**
     * Add a subquery left join to the query.
     */
    public leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinSub(query: SubQuery<JoinClauseI>, as: Stringable, first: Stringable, operator: Stringable): this;
    public leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    public leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public leftJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.joinSub(query, as, first, operatorOrSecond, second, 'left');
    }

    /**
     * Add a subquery left join where clause to the query.
     */
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public leftJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond: string | Binding | QueryAbleCallback<JoinClauseI> = null,
        second: Binding | QueryAbleCallback<JoinClauseI> = null
    ): this {
        return this.joinWhereSub(query, as, first, operatorOrSecond, second, 'left');
    }

    /**
     * Add a right join to the query.
     */
    public rightJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public rightJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    public rightJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public rightJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public rightJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.join(table, first, operatorOrSecond, second, 'right');
    }

    /**
     * Add a "right join where" clause to the query.
     */
    public rightJoinWhere(table: Stringable, first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject): this;
    public rightJoinWhere(table: Stringable, first: Stringable, second: Binding | QueryAbleCallback<JoinClauseI>): this;
    public rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhere(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond: string | Binding | QueryAbleCallback<JoinClauseI> = null,
        second: Binding | QueryAbleCallback<JoinClauseI> = null
    ): this {
        return this.joinWhere(table, first, operatorOrSecond, second, 'right');
    }

    /**
     * Add a subquery right join to the query.
     */
    public rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinSub(query: SubQuery<JoinClauseI>, as: Stringable, first: Stringable, operator: Stringable): this;
    public rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable
    ): this;
    public rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public rightJoinSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.joinSub(query, as, first, operatorOrSecond, second, 'right');
    }

    /**
     * Add a subquery left join where clause to the query.
     */
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereTuple[] | WhereObject
    ): this;
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract,
        operator: string,
        second: NotNullableBinding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond?: string | Binding | QueryAbleCallback<JoinClauseI>,
        second?: Binding | QueryAbleCallback<JoinClauseI>
    ): this;
    public rightJoinWhereSub(
        query: SubQuery<JoinClauseI>,
        as: Stringable,
        first: QueryAbleCallback<JoinClauseI> | BuilderContract | WhereTuple[] | WhereObject | Stringable,
        operatorOrSecond: string | Binding | QueryAbleCallback<JoinClauseI> = null,
        second: Binding | QueryAbleCallback<JoinClauseI> = null
    ): this {
        return this.joinWhereSub(query, as, first, operatorOrSecond, second, 'right');
    }
    /**
     * Add a "cross join" clause to the query.
     */
    public crossJoin(table: Stringable): this;
    public crossJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public crossJoin(table: Stringable, first: Stringable, operator: Stringable): this;
    public crossJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public crossJoin(
        table: Stringable,
        first?: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public crossJoin(
        table: Stringable,
        first: QueryAbleCallback<JoinClauseI> | WhereColumnTuple[] | Stringable | null = null,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        if (first !== null) {
            return this.join(table, first, operatorOrSecond, second, 'cross');
        }

        this.registry.joins.push(this.newJoinClause(this, 'cross', table));

        return this;
    }

    /**
     * Add a subquery cross join to the query.
     */
    public crossJoinSub(query: SubQuery<JoinClauseI>, as: Stringable): this {
        const [queryString, bindings] = this.createSub(query);

        const expression = `(${queryString}) as ${this.getGrammar().wrapTable(as)}`;

        this.addBinding(bindings, 'join');

        this.registry.joins.push(this.newJoinClause(this, 'cross', this.raw(expression)));

        return this;
    }

    /**
     * Get a new join clause.
     */
    protected abstract newJoinClause(parentQuery: BuilderContract, type: string, table: Stringable): JoinClauseI;

    /**
     * Merge an array of where clauses and bindings.
     */
    public mergeWheres(wheres: Where[], bindings: Binding[]): this {
        this.registry.wheres = this.registry.wheres.concat(wheres);

        this.registry.bindings.where = this.registry.bindings.where.concat(bindings);

        return this;
    }

    /**
     * Add a basic where clause to the query.
     */
    public where(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public where(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public where(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public where(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public where(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public where(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public where(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue: string | Binding | QueryAbleCallback<this> = null,
        value: Binding | QueryAbleCallback<this> = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        // If the column is an array, we will assume it is an array of key-value pairs
        // and can add them each as a where clause. We will maintain the boolean we
        // received when the method was called and pass it into the nested where.
        if (Array.isArray(column) || this.isWhereObject(column)) {
            return this.addArrayOfWheres(
                Array.isArray(column) ? column : Object.entries(column),
                boolean,
                not,
                (query, values) => {
                    query.where(...values);
                }
            );
        }

        // Here we will make some assumptions about the operator. If only 2 values are
        // passed to the method, we will assume that the operator is an equals sign
        // and keep going. Otherwise, we'll require the operator to be passed in.
        let [val, operator] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        // If the column is actually a Closure instance, we will assume the developer
        // wants to begin a nested where statement which is wrapped in parentheses.
        // We will add that Closure to the query and return back out immediately.
        if (this.isQueryableCallback(column) && operator === null) {
            return this.whereNested(column, boolean, not);
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        [val, operator] = this.assignValueAndOperator(value, operatorOrValue, arguments.length === 2);

        // If the column is a Closure instance and there is an operator value, we will
        // assume the developer wants to run a subquery and then compare the result
        // of that subquery with the given value that was provided to the method.
        if (this.isQueryable(column)) {
            const [sub, bindings] = this.createSub(column);

            if (this.isQueryableCallback(val)) {
                throw new TypeError('Value Cannot be a closure when column is instance of Query Builder or closure.');
            }

            return this.addBinding(bindings, 'where').where(this.raw(`(${sub})`), operator, val, boolean);
        }

        // If the value is a Closure, it means the developer is performing an entire
        // sub-select within the query and we will need to compile the sub-select
        // within the where clause to get the appropriate query record results.
        if (this.isQueryableCallback(val)) {
            return this.whereSub(column, operator, val, boolean, not);
        }

        // If the value is "null", we will just assume the developer wants to add a
        // where null clause to the query. So, we will allow a short-cut here to
        // that method for convenience so the developer doesn't have to check.
        if (val === null) {
            return this.whereNull(column, boolean, operator !== '=');
        }

        let type: 'Basic' | 'Bitwise' | 'JsonBoolean' = 'Basic';

        const columnToString = this.getGrammar().getValue(column).toString();

        // If the column is making a JSON reference we'll check to see if the value
        // is a boolean. If it is, we'll add the raw boolean string as an actual
        // value to the query to ensure this is properly handled by the query.
        if (columnToString.includes('->') && typeof val === 'boolean') {
            val = this.raw(val ? 'true' : 'false');
            type = 'JsonBoolean';
        }

        if (this.isBitwiseOperator(operator)) {
            type = 'Bitwise';
        }

        // Now that we are working with just a simple query we can put the elements
        // in our array and add the query binding to our array of bindings that
        // will be bound to each SQL statements when it is finally executed.
        this.registry.wheres.push({
            type: type,
            column: column,
            operator,
            value: val,
            boolean,
            not: not
        });

        if (!this.isExpression(val)) {
            this.addBinding(this.flattenValue(val), 'where');
        }

        return this;
    }

    /**
     * Add an array of where clauses to the query.
     */
    protected addArrayOfWheres<T>(
        column: T[],
        boolean: ConditionBoolean,
        not: boolean,
        callback: (query: this, values: T) => void
    ): this {
        return this.whereNested(
            (query: this): void => {
                for (const values of column) {
                    callback(query, values);
                }
            },
            boolean,
            not
        );
    }

    /**
     * Assign the value and operator for a where clause.
     */
    protected assignValueAndOperator<T>(value: T, operator: string | T, useDefault = false): [T, string] {
        if (useDefault) {
            return [operator as T, '='];
        } else if (this.isValidOperatorAndValue(operator, value)) {
            return [value, operator];
        }

        throw new TypeError('Illegal operator and value combination.');
    }

    /**
     * Determine if the given operator and value combination is legal.
     * Opeator should be a string and prevents using Null values with invalid operators.
     */
    protected isValidOperatorAndValue<T>(operator: string | T, value: T): operator is string {
        return (
            typeof operator === 'string' &&
            (value !== null || (this.operators.includes(operator) && !['=', '<>', '!='].includes(operator)))
        );
    }

    /**
     * Prepare the value and operator to proxy call another method.
     */
    protected prepareValueAndOperator<T>(value: T, operator: string | T, useDefault = false): [T, T | string] {
        if (useDefault) {
            return [operator as T, '='];
        } else if (this.invalidOperatorAndValue(operator, value)) {
            throw new TypeError('Illegal operator and value combination.');
        }

        return [value, operator];
    }

    /**
     * Determine if the given operator and value combination is legal.
     * Only Prevents using Null values with invalid operators.
     */
    protected invalidOperatorAndValue<T, U>(operator: T, value: U): boolean {
        return (
            value === null &&
            typeof operator === 'string' &&
            this.operators.includes(operator) &&
            !['=', '<>', '!='].includes(operator)
        );
    }

    /**
     * Determine if the given operator is supported.
     */
    protected isValidOperator(operator: Binding): operator is string {
        return (
            typeof operator === 'string' &&
            (this.operators.includes(operator.toLowerCase()) ||
                this.getGrammar().getOperators().includes(operator.toLowerCase()))
        );
    }

    /**
     * Determine if the operator is a bitwise operator.
     */
    protected isBitwiseOperator(operator: Stringable | Binding): operator is string {
        return (
            typeof operator === 'string' &&
            (this.bitwiseOperators.includes(operator.toLowerCase()) ||
                this.getGrammar().getBitwiseOperators().includes(operator.toLowerCase()))
        );
    }

    /**
     * Add an "or where" clause to the query.
     */
    public orWhere(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public orWhere(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public orWhere(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public orWhere(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public orWhere(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public orWhere(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>
    ): this;
    public orWhere(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue: string | Binding | QueryAbleCallback<this> = null,
        value: Binding | QueryAbleCallback<this> = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.where(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a basic "where not" clause to the query.
     */
    public whereNot(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public whereNot(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public whereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public whereNot(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public whereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public whereNot(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>,
        boolean?: ConditionBoolean
    ): this;
    public whereNot(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue: string | Binding | QueryAbleCallback<this> = null,
        value: Binding | QueryAbleCallback<this> = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.where(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not" clause to the query.
     */
    public orWhereNot(column: QueryAbleCallback<this> | WhereTuple[] | WhereObject): this;
    public orWhereNot(column: Stringable, value: Binding | QueryAbleCallback<this>): this;
    public orWhereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public orWhereNot(column: Stringable, operator: string, value: Binding | QueryAbleCallback<this>): this;
    public orWhereNot(
        column: QueryAbleCallback<this> | BuilderContract,
        operator: string,
        value: NotNullableBinding | QueryAbleCallback<this>
    ): this;
    public orWhereNot(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue?: string | Binding | QueryAbleCallback<this>,
        value?: Binding | QueryAbleCallback<this>
    ): this;
    public orWhereNot(
        column: Stringable | QueryAbleCallback<this> | BuilderContract | WhereTuple[] | WhereObject,
        operatorOrValue: string | Binding | QueryAbleCallback<this> = null,
        value: Binding | QueryAbleCallback<this> = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.whereNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where" clause comparing two columns to the query.
     */
    public whereColumn(first: WhereColumnTuple[]): this;
    public whereColumn(first: Stringable, second: Stringable): this;
    public whereColumn(first: Stringable, operator: string, second: Stringable): this;
    public whereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        // If the column is an array, we will assume it is an array of key-value pairs
        // and can add them each as a where clause. We will maintain the boolean we
        // received when the method was called and pass it into the nested where.
        if (Array.isArray(first)) {
            return this.addArrayOfWheres(first, boolean, not, (query, values) => {
                query.whereColumn(...values);
            });
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (!this.isValidOperator(operatorOrSecond)) {
            [second, operatorOrSecond] = [operatorOrSecond, '='];
        }

        if (!this.isStringable(second)) {
            throw new TypeError('Second Parameter must be string or Expression.');
        }

        // Finally, we will add this where clause into this array of clauses that we
        // are building for the query. All of them will be compiled via a grammar
        // once the query is about to be executed and run against the database.
        const type = 'Column';

        this.registry.wheres.push({
            type,
            first,
            operator: operatorOrSecond,
            second: second,
            boolean,
            not
        });

        return this;
    }

    /**
     * Add an "or where" clause comparing two columns to the query.
     */
    public orWhereColumn(first: WhereColumnTuple[]): this;
    public orWhereColumn(first: Stringable, second: Stringable): this;
    public orWhereColumn(first: Stringable, operator: string, second: Stringable): this;
    public orWhereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public orWhereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.whereColumn(first, operatorOrSecond, second, 'or');
    }

    /**
     * Add a "where not" clause comparing two columns to the query.
     */
    public whereColumnNot(first: WhereColumnTuple[]): this;
    public whereColumnNot(first: Stringable, second: Stringable): this;
    public whereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    public whereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean
    ): this;
    public whereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereColumn(first, operatorOrSecond, second, boolean, true);
    }

    /**
     * Add an "or where not" clause comparing two columns to the query.
     */
    public orWhereColumnNot(first: WhereColumnTuple[]): this;
    public orWhereColumnNot(first: Stringable, second: Stringable): this;
    public orWhereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    public orWhereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;
    public orWhereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.whereColumnNot(first, operatorOrSecond, second, 'or');
    }

    /**
     * Add a raw where clause to the query.
     */
    public whereRaw(sql: string, bindings: Binding[] = [], boolean: ConditionBoolean = 'and'): this {
        const type = 'Raw';

        this.registry.wheres.push({ type, sql: sql, boolean: boolean });

        this.addBinding(bindings, 'where');

        return this;
    }

    /**
     * Add a raw or where clause to the query.
     */
    public orWhereRaw(sql: string, bindings: Binding[] = []): this {
        return this.whereRaw(sql, bindings, 'or');
    }

    /**
     * Add a "where in" clause to the query.
     */
    public whereIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Arrayable | Binding[],
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'In';

        // If the value is a query builder instance we will assume the developer wants to
        // look for any values that exist within this given query. So, we will add the
        // query accordingly so that this query is properly executed when it is run.
        if (this.isQueryable(values)) {
            const [query, bindings] = this.createSub(values);

            values = [this.raw(query)];

            this.addBinding(bindings, 'where');
        }

        // Next, if the value is Arrayable we need to cast it to its raw array form so we
        // have the underlying array value instead of an Arrayable object which is not
        // able to be added as a binding, etc. We will then add to the wheres array.
        if (this.isArrayable(values)) {
            values = values.toArray<Binding>();
        }

        this.registry.wheres.push({ type, column, values, boolean, not });

        if (values.length !== values.flat(1).length) {
            throw new TypeError('Nested arrays may not be passed to whereIn method.');
        }

        // Finally, we'll add a binding for each value unless that value is an expression
        // in which case we will just skip over it since it will be the query as a raw
        // string and not as a parameterized place-holder to be replaced by the PDO.
        this.addBinding(this.cleanBindings(values), 'where');

        return this;
    }
    /**
     * Add an "or where in" clause to the query.
     */
    public orWhereIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable
    ): this {
        return this.whereIn(column, values, 'or');
    }

    /**
     * Add a "where not in" clause to the query.
     */
    public whereNotIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable,
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereIn(column, values, boolean, true);
    }

    /**
     * Add an "or where not in" clause to the query.
     */
    public orWhereNotIn(
        column: Stringable,
        values: BuilderContract | QueryAbleCallback<this> | Binding[] | Arrayable
    ): this {
        return this.whereNotIn(column, values, 'or');
    }

    /**
     * Add a "where in raw" clause for integer values to the query.
     */
    public whereIntegerInRaw(
        column: Stringable,
        values: Arrayable | Binding[],
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'InRaw';

        this.registry.wheres.push({
            type,
            column,
            values: (this.isArrayable(values) ? values.toArray<Binding>() : values).map((value: any): bigint => {
                try {
                    return BigInt(value);
                } catch (error) {
                    return BigInt('0');
                }
            }),
            boolean,
            not
        });

        return this;
    }

    /**
     * Add an "or where in raw" clause for integer values to the query.
     */
    public orWhereIntegerInRaw(column: Stringable, values: Arrayable | Binding[]): this {
        return this.whereIntegerInRaw(column, values, 'or');
    }

    /**
     * Add a "where not in raw" clause for integer values to the query.
     */
    public whereIntegerNotInRaw(
        column: Stringable,
        values: Arrayable | Binding[],
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereIntegerInRaw(column, values, boolean, true);
    }

    /**
     * Add an "or where not in raw" clause for integer values to the query.
     */
    public orWhereIntegerNotInRaw(column: Stringable, values: Arrayable | Binding[]): this {
        return this.whereIntegerNotInRaw(column, values, 'or');
    }

    /**
     * Add a "where null" clause to the query.
     */
    public whereNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'Null';
        columns = Array.isArray(columns) ? columns : [columns];
        for (const column of columns) {
            this.registry.wheres.push({ type, column, boolean, not });
        }

        return this;
    }

    /**
     * Add an "or where null" clause to the query.
     */
    public orWhereNull(columns: Stringable | Stringable[]): this {
        return this.whereNull(columns, 'or');
    }

    /**
     * Add a "where not null" clause to the query.
     */
    public whereNotNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and'): this {
        return this.whereNull(columns, boolean, true);
    }

    /**
     * Add an "or where not null" clause to the query.
     */
    public orWhereNotNull(columns: Stringable | Stringable[]): this {
        return this.whereNotNull(columns, 'or');
    }

    /**
     * Add a where between statement to the query.
     */
    public whereBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'Between';

        if (this.isArrayable(values)) {
            values = values.toArray<Stringable | number | bigint | Date>().slice(0, 2) as BetweenTuple;
        }

        this.registry.wheres.push({ type, column, values, boolean, not });

        this.addBinding(this.cleanBindings(values.flat(Infinity)).slice(0, 2), 'where');

        return this;
    }

    /**
     * Add a where between statement using columns to the query.
     */
    public whereBetweenColumns(
        column: Stringable,
        values: BetweenColumnsTuple | Arrayable,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'BetweenColumns';

        if (this.isArrayable(values)) {
            values = values.toArray<Stringable>().slice(0, 2) as BetweenColumnsTuple;
        }

        this.registry.wheres.push({ type, column, values, boolean, not });

        return this;
    }

    /**
     * Add an or where between statement to the query.
     */
    public orWhereBetween(column: Stringable, values: BetweenTuple | Arrayable): this {
        return this.whereBetween(column, values, 'or');
    }

    /**
     * Add an or where between statement using columns to the query.
     */
    public orWhereBetweenColumns(column: Stringable, values: BetweenColumnsTuple | Arrayable): this {
        return this.whereBetweenColumns(column, values, 'or');
    }

    /**
     * Add a where not between statement to the query.
     */
    public whereNotBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereBetween(column, values, boolean, true);
    }

    /**
     * Add a where not between statement using columns to the query.
     */
    public whereNotBetweenColumns(
        column: Stringable,
        values: BetweenColumnsTuple | Arrayable,
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereBetweenColumns(column, values, boolean, true);
    }

    /**
     * Add an or where not between statement to the query.
     */
    public orWhereNotBetween(column: Stringable, values: BetweenTuple | Arrayable): this {
        return this.whereNotBetween(column, values, 'or');
    }

    /**
     * Add an or where not between statement using columns to the query.
     */
    public orWhereNotBetweenColumns(column: Stringable, values: BetweenColumnsTuple | Arrayable): this {
        return this.whereNotBetweenColumns(column, values, 'or');
    }

    /**
     * Add a "where date" statement to the query.
     */
    public whereDate(column: Stringable, value: Stringable | Date | null): this;
    public whereDate(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operatorOrValue] = this.assignValueAndOperator(value, operatorOrValue, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = `${value.getFullYear().toString().padStart(4, '0')}-${(value.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;
        }

        return this.addDateBasedWhere('Date', column, operatorOrValue, value, boolean, not);
    }

    /**
     * Add an "or where date" statement to the query.
     */
    public orWhereDate(column: Stringable, value: Stringable | Date | null): this;
    public orWhereDate(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public orWhereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;
    public orWhereDate(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereDate(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where not date" statement to the query.
     */
    public whereDateNot(column: Stringable, value: Stringable | Date | null): this;
    public whereDateNot(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereDate(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not date" statement to the query.
     */
    public orWhereDateNot(column: Stringable, value: Stringable | Date | null): this;
    public orWhereDateNot(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public orWhereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;
    public orWhereDateNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereDateNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where time" statement to the query.
     */
    public whereTime(column: Stringable, value: Stringable | Date | null): this;
    public whereTime(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operatorOrValue] = this.assignValueAndOperator(value, operatorOrValue, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = `${value.getHours().toString().padStart(2, '0')}-${value
                .getMinutes()
                .toString()
                .padStart(2, '0')}-${value.getSeconds().toString().padStart(2, '0')}`;
        }

        return this.addDateBasedWhere('Time', column, operatorOrValue, value, boolean, not);
    }

    /**
     * Add an "or where time" statement to the query.
     */
    public orWhereTime(column: Stringable, value: Stringable | Date | null): this;
    public orWhereTime(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public orWhereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;
    public orWhereTime(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereTime(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where not time" statement to the query.
     */
    public whereTimeNot(column: Stringable, value: Stringable | Date | null): this;
    public whereTimeNot(
        column: Stringable,
        operator: string,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereTime(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not time" statement to the query.
     */
    public orWhereTimeNot(column: Stringable, value: Stringable | Date | null): this;
    public orWhereTimeNot(column: Stringable, operator: string, value?: Stringable | Date | null): this;
    public orWhereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value?: Stringable | Date | null
    ): this;
    public orWhereTimeNot(
        column: Stringable,
        operatorOrValue: Stringable | Date | null,
        value: Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereTimeNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where day" statement to the query.
     */
    public whereDay(column: Stringable, value: Stringable | number | Date | null): this;
    public whereDay(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operatorOrValue] = this.assignValueAndOperator(value, operatorOrValue, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.getDate();
        }

        if (!this.isExpression(value)) {
            value = isNaN(Number(value)) ? '00' : Number(value).toString().padStart(2, '0');
        }

        return this.addDateBasedWhere('Day', column, operatorOrValue, value, boolean, not);
    }

    /**
     * Add an "or where day" statement to the query.
     */
    public orWhereDay(column: Stringable, value: Stringable | number | Date | null): this;
    public orWhereDay(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public orWhereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;
    public orWhereDay(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereDay(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where not day" statement to the query.
     */
    public whereDayNot(column: Stringable, value: Stringable | number | Date | null): this;
    public whereDayNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereDay(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not day" statement to the query.
     */
    public orWhereDayNot(column: Stringable, value: Stringable | number | Date | null): this;
    public orWhereDayNot(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public orWhereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;
    public orWhereDayNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereDayNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where month" statement to the query.
     */
    public whereMonth(column: Stringable, value: Stringable | number | Date | null): this;
    public whereMonth(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operatorOrValue] = this.assignValueAndOperator(value, operatorOrValue, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.getMonth() + 1;
        }

        if (!this.isExpression(value)) {
            value = isNaN(Number(value)) ? '00' : Number(value).toString().padStart(2, '0');
        }

        return this.addDateBasedWhere('Month', column, operatorOrValue, value, boolean, not);
    }

    /**
     * Add an "or where month" statement to the query.
     */
    public orWhereMonth(column: Stringable, value: Stringable | number | Date | null): this;
    public orWhereMonth(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public orWhereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;
    public orWhereMonth(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereMonth(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where not month" statement to the query.
     */
    public whereMonthNot(column: Stringable, value: Stringable | number | Date | null): this;
    public whereMonthNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereMonth(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not month" statement to the query.
     */
    public orWhereMonthNot(column: Stringable, value: Stringable | number | Date | null): this;
    public orWhereMonthNot(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public orWhereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;
    public orWhereMonthNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereMonthNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where year" statement to the query.
     */
    public whereYear(column: Stringable, value: Stringable | number | Date | null): this;
    public whereYear(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public whereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operatorOrValue] = this.assignValueAndOperator(value, operatorOrValue, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.getFullYear();
        }

        if (!this.isExpression(value)) {
            value = isNaN(Number(value)) ? '0000' : Number(value).toString().padStart(4, '0');
        }

        return this.addDateBasedWhere('Year', column, operatorOrValue, value, boolean, not);
    }

    /**
     * Add an "or where year" statement to the query.
     */
    public orWhereYear(column: Stringable, value: Stringable | number | Date | null): this;
    public orWhereYear(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public orWhereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;
    public orWhereYear(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereYear(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "where not year" statement to the query.
     */
    public whereYearNot(column: Stringable, value: Stringable | number | Date | null): this;
    public whereYearNot(
        column: Stringable,
        operator: string,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null,
        boolean?: ConditionBoolean
    ): this;
    public whereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereYear(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not year" statement to the query.
     */
    public orWhereYearNot(column: Stringable, value: Stringable | number | Date | null): this;
    public orWhereYearNot(column: Stringable, operator: string, value?: Stringable | number | Date | null): this;
    public orWhereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value?: Stringable | number | Date | null
    ): this;
    public orWhereYearNot(
        column: Stringable,
        operatorOrValue: Stringable | number | Date | null,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.whereYearNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a date based (year, month, day, time) statement to the query.
     */
    protected addDateBasedWhere(
        type: 'Date' | 'Time' | 'Year' | 'Month' | 'Day',
        column: Stringable,
        operator: string,
        value: Stringable | number | null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        this.registry.wheres.push({ type: type, column, operator, value, boolean, not });

        if (!this.isExpression(value)) {
            this.addBinding(value, 'where');
        }

        return this;
    }

    /**
     * Add a nested where statement to the query.
     */
    public whereNested(callback: QueryAbleCallback<this>, boolean: ConditionBoolean = 'and', not = false): this {
        const query = this.forNestedWhere() as this;
        callback(query);

        return this.addNestedWhereQuery(query, boolean, not);
    }

    /**
     * Create a new query instance for nested where condition.
     */
    public forNestedWhere(): BuilderContract {
        return this.newQuery().from(this.registry.from);
    }

    /**
     * Add another query builder as a nested where to the query builder.
     */
    public addNestedWhereQuery(query: BuilderContract, boolean: ConditionBoolean = 'and', not = false): this {
        if (query.getRegistry().wheres.length > 0) {
            const type = 'Nested';

            this.registry.wheres.push({
                type,
                query,
                boolean,
                not
            });

            this.addBinding(query.getRawBindings().where, 'where');
        }
        return this;
    }

    /**
     * Add a full sub-select to the query.
     */
    protected whereSub(
        column: Stringable,
        operator: string,
        callback: QueryAbleCallback<this>,
        boolean: ConditionBoolean,
        not: boolean
    ): this {
        const type = 'Sub';

        // Once we have the query instance we can simply execute it so it can add all
        // of the sub-select's conditions to itself, and then we can cache it off
        // in the array of where clauses for the "main" parent query instance.
        const query = this.forSubQuery() as this;
        callback(query);

        this.registry.wheres.push({
            type,
            column,
            operator,
            query,
            boolean,
            not
        });

        this.addBinding(query.getBindings(), 'where');

        return this;
    }

    /**
     * Add an exists clause to the query.
     */
    public whereExists(
        callback: BuilderContract | QueryAbleCallback<this>,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        let query: this | BuilderContract;
        if (this.isQueryableCallback(callback)) {
            query = this.forSubQuery();

            // Similar to the sub-select clause, we will create a new query instance so
            // the developer may cleanly specify the entire exists query and we will
            // compile the whole thing in the grammar and insert it into the SQL.
            callback(query as this);
        } else {
            query = callback;
        }

        return this.addWhereExistsQuery(query, boolean, not);
    }

    /**
     * Add an or exists clause to the query.
     */
    public orWhereExists(callback: BuilderContract | QueryAbleCallback<this>, not = false): this {
        return this.whereExists(callback, 'or', not);
    }

    /**
     * Add a where not exists clause to the query.
     */
    public whereNotExists(
        callback: BuilderContract | QueryAbleCallback<this>,
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereExists(callback, boolean, true);
    }

    /**
     * Add a where not exists clause to the query.
     */
    public orWhereNotExists(callback: BuilderContract | QueryAbleCallback<this>): this {
        return this.orWhereExists(callback, true);
    }

    /**
     * Add an exists clause to the query.
     */
    public addWhereExistsQuery(query: BuilderContract, boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'Exists';

        this.registry.wheres.push({ type, query, boolean, not });

        this.addBinding(query.getBindings(), 'where');

        return this;
    }

    /**
     * Adds a where condition using row values.
     */
    public whereRowValues(
        columns: Stringable[],
        operator: string,
        values: Binding[],
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        if (columns.length !== values.length) {
            throw new TypeError('The number of columns must match the number of values');
        }

        const type = 'RowValues';

        this.registry.wheres.push({ type, columns, operator, values, boolean, not });

        this.addBinding(this.cleanBindings(values));

        return this;
    }

    /**
     * Adds an or where condition using row values.
     */
    public orWhereRowValues(columns: Stringable[], operator: string, values: Binding[]): this {
        return this.whereRowValues(columns, operator, values, 'or');
    }

    /**
     * Add a "where JSON contains" clause to the query.
     */
    public whereJsonContains(
        column: Stringable,
        value: Binding[] | Binding,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'JsonContains';

        this.registry.wheres.push({ type, column, value: value, boolean, not });

        if (!this.isExpression(value)) {
            this.addBinding(this.getGrammar().prepareBindingForJsonContains(value));
        }

        return this;
    }

    /**
     * Add an "or where JSON contains" clause to the query.
     */
    public orWhereJsonContains(column: Stringable, value: Binding[] | Binding): this {
        return this.whereJsonContains(column, value, 'or');
    }

    /**
     * Add a "where JSON not contains" clause to the query.
     */
    public whereJsonDoesntContain(column: Stringable, value: Binding[] | Binding, boolean: ConditionBoolean): this {
        return this.whereJsonContains(column, value, boolean, true);
    }

    /**
     * Add an "or where JSON not contains" clause to the query.
     */
    public orWhereJsonDoesntContain(column: Stringable, value: Binding[] | Binding): this {
        return this.whereJsonDoesntContain(column, value, 'or');
    }

    /**
     * Add a clause that determines if a JSON path exists to the query.
     */
    public whereJsonContainsKey(column: Stringable, boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'JsonContainsKey';

        this.registry.wheres.push({ type, column, boolean, not });

        return this;
    }

    /**
     * Add an "or" clause that determines if a JSON path exists to the query.
     */
    public orWhereJsonContainsKey(column: Stringable): this {
        return this.whereJsonContainsKey(column, 'or');
    }

    /**
     * Add a clause that determines if a JSON path does not exist to the query.
     */
    public whereJsonDoesntContainKey(column: Stringable, boolean: ConditionBoolean = 'and'): this {
        return this.whereJsonContainsKey(column, boolean, true);
    }

    /**
     * Add an "or" clause that determines if a JSON path does not exist to the query.
     */
    public orWhereJsonDoesntContainKey(column: Stringable): this {
        return this.whereJsonDoesntContainKey(column, 'or');
    }

    /**
     * Add a "where JSON length" clause to the query.
     */
    public whereJsonLength(
        column: Stringable,
        operator: string,
        value: number | ExpressionContract | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'JsonLength';

        [value, operator] = this.assignValueAndOperator(value, operator, arguments.length === 2);

        this.registry.wheres.push({ type, column, operator, value, boolean, not });

        if (!this.isExpression(value)) {
            this.addBinding(Number(this.flattenValue(value)));
        }

        return this;
    }

    /**
     * Add an "or where JSON length" clause to the query.
     */
    public orWhereJsonLength(
        column: Stringable,
        operator: string,
        value: number | ExpressionContract | null = null
    ): this {
        [value, operator] = this.assignValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLength(column, operator, value, 'or');
    }

    /**
     * Add a "where JSON length not" clause to the query.
     */
    public whereJsonLengthNot(
        column: Stringable,
        operator: string,
        value: number | ExpressionContract | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.assignValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLength(column, operator, value, boolean, true);
    }

    /**
     * Add an "or where JSON length not" clause to the query.
     */
    public orWhereJsonLengthNot(
        column: Stringable,
        operator: string,
        value: number | ExpressionContract | null = null
    ): this {
        [value, operator] = this.assignValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLengthNot(column, operator, value, 'or');
    }

    /**
     * Handles dynamic "where" clauses to the query.
     */
    public dynamicWhere(method: string, parameters: Binding[]): this {
        const finder = method.slice(5);

        const segments = finder.split(/(And|Or)(?=[A-Z])/g);

        // The connector variable will determine which connector will be used for the
        // query condition. We will change it as we come across new boolean values
        // in the dynamic method strings, which could contain a number of these.
        let connector: ConditionBoolean = 'and';

        let index = 0;

        for (const segment of segments) {
            // If the segment is not a boolean connector, we can assume it is a column's name
            // and we will add it to the query as a new constraint as a where clause, then
            // we can keep iterating through the dynamic method string's segments again.
            if (segment !== 'And' && segment !== 'Or') {
                this.addDynamic(segment, connector, parameters, index);

                index++;
            }

            // Otherwise, we will store the connector so we know how the next where clause we
            // find in the query should be connected to the previous ones, meaning we will
            // have the proper boolean connector to connect the next where clause found.
            else {
                connector = segment.toLowerCase() as ConditionBoolean;
            }
        }

        return this;
    }

    /**
     * Add a single dynamic where clause statement to the query.
     */
    protected addDynamic(segment: string, connector: ConditionBoolean, parameters: Binding[], index: number): void {
        const not = segment.startsWith('Not');
        segment = not ? segment.slice(3) : segment;
        // Once we have parsed out the columns and formatted the boolean operators we
        // are ready to add it to this query as a where clause just like any other
        // clause on the query. Then we'll increment the parameter index values.

        this.where(snakeCase(segment), '=', parameters[index], connector, not);
    }

    /**
     * Add a "where fulltext" clause to the query.
     */
    public whereFulltext(
        columns: Stringable | Stringable[],
        value: string,
        options: FulltextOptions = {},
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'Fulltext';

        columns = Array.isArray(columns) ? columns : [columns];

        this.registry.wheres.push({ type, columns, value, options, boolean, not });

        this.addBinding(value);

        return this;
    }

    /**
     * Add a "or where fulltext" clause to the query.
     */
    public orwhereFulltext(columns: Stringable | Stringable[], value: string, options: FulltextOptions = {}): this {
        return this.whereFulltext(columns, value, options, 'or');
    }

    /**
     * Add a "where not fulltext" clause to the query.
     */
    public whereFulltextNot(
        columns: Stringable | Stringable[],
        value: string,
        options: FulltextOptions = {},
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereFulltext(columns, value, options, boolean, true);
    }

    /**
     * Add a "or where not fulltext" clause to the query.
     */
    public orwhereFulltextNot(columns: Stringable | Stringable[], value: string, options: FulltextOptions = {}): this {
        return this.whereFulltextNot(columns, value, options, 'or');
    }

    /**
     * Add a "group by" clause to the query.
     */
    public groupBy(...groups: Stringable[][] | Stringable[]): this {
        for (const group of groups) {
            this.registry.groups.push(...(Array.isArray(group) ? group : [group]));
        }

        return this;
    }

    /**
     * Add a raw groupBy clause to the query.
     */
    public groupByRaw(sql: string, bindings: Binding[] = []): this {
        this.registry.groups.push(this.raw(sql));

        this.addBinding(bindings, 'groupBy');

        return this;
    }

    /**
     * Add a "having" clause to the query.
     */
    public having(column: QueryAbleCallback<this> | Stringable): this;
    public having(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public having(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    public having(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public having(
        column: Stringable | QueryAbleCallback<this>,
        operatorOrValue: Stringable | number | null = null,
        value: Stringable | number | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        let type: 'Basic' | 'Bitwise' = 'Basic';

        // Here we will make some assumptions about the operator. If only 2 values are
        // passed to the method, we will assume that the operator is an equals sign
        // and keep going. Otherwise, we'll require the operator to be passed in.
        let [val, operator] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        if (this.isQueryableCallback(column) && operator === null) {
            return this.havingNested(column, boolean);
        }

        if (this.isQueryableCallback(column)) {
            throw new TypeError('Value must be null when column is a callback.');
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (!this.isValidOperator(operator)) {
            [val, operator] = [operator, '='];
        }

        if (this.isBitwiseOperator(operator)) {
            type = 'Bitwise';
        }

        this.registry.havings.push({
            type: type,
            column: column,
            operator,
            value: val,
            boolean,
            not
        });

        if (!this.isExpression(val)) {
            this.addBinding(this.flattenValue(val), 'having');
        }

        return this;
    }

    /**
     * Add an "or having" clause to the query.
     */
    public orHaving(column: QueryAbleCallback<this> | Stringable): this;
    public orHaving(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public orHaving(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    public orHaving(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null
    ): this;
    public orHaving(
        column: Stringable | QueryAbleCallback<this>,
        operatorOrValue: number | Stringable | null = null,
        value: number | Stringable | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.having(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a "having not" clause to the query.
     */
    public havingNot(column: QueryAbleCallback<this> | Stringable): this;
    public havingNot(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public havingNot(column: QueryAbleCallback<this> | Stringable, operator: string, value: Stringable | number): this;
    public havingNot(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean
    ): this;
    public havingNot(
        column: Stringable | QueryAbleCallback<this>,
        operatorOrValue: Stringable | number | null = null,
        value: Stringable | number | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.having(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or having not" clause to the query.
     */
    public orHavingNot(column: QueryAbleCallback<this> | Stringable): this;
    public orHavingNot(column: QueryAbleCallback<this> | Stringable, value: Stringable | number): this;
    public orHavingNot(
        column: QueryAbleCallback<this> | Stringable,
        operator: string,
        value: Stringable | number
    ): this;
    public orHavingNot(
        column: QueryAbleCallback<this> | Stringable,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null
    ): this;
    public orHavingNot(
        column: Stringable | QueryAbleCallback<this>,
        operatorOrValue: number | Stringable | null = null,
        value: number | Stringable | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.havingNot(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a nested having statement to the query.
     */
    public havingNested(callback: QueryAbleCallback<this>, boolean: ConditionBoolean = 'and', not = false): this {
        const query = this.forNestedWhere() as this;
        callback(query);

        return this.addNestedHavingQuery(query, boolean, not);
    }

    /**
     * Add another query builder as a nested having to the query builder.
     */
    public addNestedHavingQuery(query: BuilderContract, boolean: ConditionBoolean = 'and', not = false): this {
        if (query.getRegistry().havings.length > 0) {
            const type = 'Nested';

            this.registry.havings.push({ type, query, boolean, not });

            this.addBinding(query.getRawBindings().having, 'having');
        }

        return this;
    }

    /**
     * Add a "having null" clause to the query.
     */
    public havingNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'Null';
        columns = Array.isArray(columns) ? columns : [columns];

        for (const column of columns) {
            this.registry.havings.push({ type, column, boolean, not });
        }

        return this;
    }

    /**
     * Add an "or having null" clause to the query.
     */
    public orHavingNull(columns: Stringable | Stringable[]): this {
        return this.havingNull(columns, 'or');
    }

    /**
     * Add a "having not null" clause to the query.
     */
    public havingNotNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and'): this {
        return this.havingNull(columns, boolean, true);
    }

    /**
     * Add an "or having not null" clause to the query.
     */
    public orHavingNotNull(columns: Stringable | Stringable[]): this {
        return this.havingNotNull(columns, 'or');
    }

    /**
     * Add a "having between" clause to the query.
     */
    public havingBetween(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'Between';

        if (this.isArrayable(values)) {
            values = values.toArray<Stringable | number | bigint | Date>().slice(0, 2) as BetweenTuple;
        }

        this.registry.havings.push({ type, column, values, boolean, not });

        this.addBinding(this.cleanBindings(values.flat(Infinity)).slice(0, 2), 'having');

        return this;
    }

    /**
     * Add a "or having between " clause to the query.
     */
    public orHavingBetween(column: Stringable, values: BetweenTuple | Arrayable): this {
        return this.whereBetween(column, values, 'or');
    }

    /**
     * Add a "having not between" clause to the query.
     */
    public havingBetweenNot(
        column: Stringable,
        values: BetweenTuple | Arrayable,
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereBetween(column, values, boolean, true);
    }

    /**
     * Add a "or having not between " clause to the query.
     */
    public orHavingBetweenNot(column: Stringable, values: BetweenTuple | Arrayable): this {
        return this.havingBetweenNot(column, values, 'or');
    }

    /**
     * Add a raw having clause to the query.
     */
    public havingRaw(sql: string, bindings: Binding[] = [], boolean: ConditionBoolean = 'and'): this {
        const type = 'Raw';

        this.registry.havings.push({ type, sql, boolean });

        this.addBinding(bindings, 'having');

        return this;
    }

    /**
     * Add a raw or having clause to the query.
     */
    public orHavingRaw(sql: string, bindings: Binding[] = []): this {
        return this.havingRaw(sql, bindings, 'or');
    }

    /**
     * Add an "order by" clause to the query.
     */
    public orderBy(column: SubQuery<this>, direction: OrderDirection = 'asc'): this {
        if (this.isQueryable(column)) {
            const [query, bindings] = this.createSub(column);

            column = this.raw(`(${query})`);

            this.addBinding(bindings, this.registry.unions.length > 0 ? 'unionOrder' : 'order');
        }

        direction = direction.toLowerCase() as Lowercase<OrderDirection>;

        if (!['asc', 'desc'].includes(direction.toLowerCase())) {
            throw new TypeError('Order direction must be "asc" or "desc".');
        }

        this.registry[this.registry.unions.length > 0 ? 'unionOrders' : 'orders'].push({
            column: column,
            direction: direction
        });

        return this;
    }

    /**
     * Add a descending "order by" clause to the query.
     */
    public orderByDesc(column: SubQuery<this>): this {
        return this.orderBy(column, 'desc');
    }

    /**
     * Add an "order by" clause for a timestamp to the query.
     */
    public latest(column: SubQuery<this> = 'created_at'): this {
        return this.orderBy(column, 'desc');
    }

    /**
     * Add an "order by" clause for a timestamp to the query.
     */
    public oldest(column: SubQuery<this> = 'created_at'): this {
        return this.orderBy(column, 'asc');
    }

    /**
     * Put the query's results in random order.
     */
    public inRandomOrder(seed: string | number = ''): this {
        return this.orderByRaw(this.getGrammar().compileRandom(seed));
    }

    /**
     * Add a raw "order by" clause to the query.
     */
    public orderByRaw(sql: string, bindings: Binding[] = []): this {
        const type = 'Raw';

        this.registry[this.registry.unions.length > 0 ? 'unionOrders' : 'orders'].push({ type, sql });

        this.addBinding(bindings, this.registry.unions.length > 0 ? 'unionOrder' : 'order');

        return this;
    }

    /**
     * Alias to set the "offset" value of the query.
     */
    public skip(value: number | null = null): this {
        return this.offset(value);
    }

    /**
     * Set the "offset" value of the query.
     */
    public offset(value: number | null = null): this {
        this.registry[this.registry.unions.length > 0 ? 'unionOffset' : 'offset'] =
            value == null ? 0 : Math.max(0, value);

        return this;
    }

    /**
     * Alias to set the "limit" value of the query.
     */
    public take(value: number | null = null): this {
        return this.limit(value);
    }

    /**
     * Set the "limit" value of the query.
     */
    public limit(value: number | null = null): this {
        this.registry[this.registry.unions.length > 0 ? 'unionLimit' : 'limit'] =
            value == null || value < 0 ? null : value;

        return this;
    }

    /**
     * Set the limit and offset for a given page.
     */
    public forPage(page: number, perPage = 15): this {
        return this.offset((page - 1) * perPage).limit(perPage);
    }

    /**
     * Constrain the query to the previous "page" of results before a given ID.
     */
    public forPageBeforeId(perPage = 15, lastId: number | null = null, column: Stringable = 'id'): this {
        this.registry.orders = this.removeExistingOrdersFor(column);

        if (lastId !== null) {
            this.where(column, '<', lastId);
        }

        return this.orderBy(column, 'desc').limit(perPage);
    }

    /**
     * Constrain the query to the next "page" of results after a given ID.
     */
    public forPageAfterId(perPage = 15, lastId: number | null = null, column: Stringable = 'id'): this {
        this.registry.orders = this.removeExistingOrdersFor(column);

        if (lastId !== null) {
            this.where(column, '>', lastId);
        }

        return this.orderBy(column, 'asc').limit(perPage);
    }

    /**
     * Remove all existing orders and optionally add a new order.
     */
    public reorder(column: SubQuery<this> | null = null, direction: OrderDirection = 'asc'): this {
        this.registry.orders = [];
        this.registry.unionOrders = [];
        this.registry.bindings.order = [];
        this.registry.bindings.unionOrder = [];

        if (column != null) {
            return this.orderBy(column, direction);
        }

        return this;
    }

    /**
     * Get an array with all orders with a given column removed.
     */
    protected removeExistingOrdersFor(column: Stringable): Order[] {
        return this.registry.orders.filter((order: Order) => {
            if ('column' in order) {
                return (
                    this.getGrammar().getValue(order.column).toString() !==
                    this.getGrammar().getValue(column).toString()
                );
            }
            return true;
        });
    }

    /**
     * Add a union statement to the query.
     */
    public union(query: BuilderContract | QueryAbleCallback<this>, all = false): this {
        if (this.isQueryableCallback(query)) {
            const callback = query;
            query = this.newQuery();
            callback(query as this);
        }

        this.registry.unions.push({ query, all });

        this.addBinding(query.getBindings(), 'union');

        return this;
    }

    /**
     * Add a union all statement to the query.
     */
    public unionAll(query: BuilderContract | QueryAbleCallback<this>): this {
        return this.union(query, true);
    }

    /**
     * Lock the selected rows in the table.
     */
    public lock(value: string | boolean = true): this {
        this.registry.lock = value;

        if (this.registry.lock !== null) {
            this.useWritePdo();
        }

        return this;
    }

    /**
     * Lock the selected rows in the table for updating.
     */
    public lockForUpdate(): this {
        return this.lock(true);
    }

    /**
     * Share lock the selected rows in the table.
     */
    public sharedLock(): this {
        return this.lock(false);
    }

    /**
     * Register a closure to be invoked before the query is executed.
     */
    public beforeQuery(callback: QueryAbleCallback<BuilderContract>): this {
        this.registry.beforeQueryCallbacks.push(callback);

        return this;
    }

    /**
     * Invoke the "before query" modification callbacks.
     */
    public applyBeforeQueryCallbacks(): void {
        for (const callback of this.registry.beforeQueryCallbacks) {
            callback(this);
        }

        this.registry.beforeQueryCallbacks = [];
    }

    /**
     * Get the SQL representation of the query.
     */
    public toSql(): string {
        this.applyBeforeQueryCallbacks();

        return this.getGrammar().compileSelect(this);
    }

    /**
     * Chunk the results of the query.
     */
    public async chunk<T>(
        count: number,
        callback: (items: Collection<T>, page: number) => Promise<false | void> | false | void
    ): Promise<boolean> {
        this.enforceOrderBy();

        let page = 1;
        let countResults = 0;

        do {
            // We'll execute the query for the given page and get the results. If there are
            // no results we can just break and return from here. When there are results
            // we will call the callback with the current chunk of these results here.
            const results = await this.forPage(page, count).get<T>();

            countResults = results.count();

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
    public async chunkMap<T>(callback: (item: T) => Promise<T> | T, count = 1000): Promise<Collection<T>> {
        const collection = new Collection<T>();

        this.chunk<T>(count, async items => {
            for (const item of items.all()) {
                collection.push(await callback(item));
            }
        });

        return collection;
    }

    /**
     * Execute a callback over each item while chunking.
     */
    public async each<T>(
        callback: (item: T, index: number) => Promise<false | void> | false | void,
        count = 1000
    ): Promise<boolean> {
        return this.chunk<T>(count, async (items, page) => {
            const results = items.all();
            for (let x = 0; x < results.length; x++) {
                if ((await callback(results[x], (page - 1) * count + x)) === false) {
                    return false;
                }
            }
            return;
        });
    }

    /**
     * Chunk the results of a query by comparing IDs.
     */
    public async chunkById<T>(
        count: number,
        callback: (items: Collection<T>, page: number) => Promise<false | void> | false | void,
        column: Stringable | null = null,
        alias: Stringable | null = null
    ): Promise<boolean> {
        column = column === null ? this.defaultKeyName() : column;
        alias = this.getGrammar()
            .getValue(alias === null ? column : alias)
            .toString();

        let lastId: number | null | undefined;
        let page = 1;
        let countResults = 0;

        do {
            const clone = this.clone();

            // We'll execute the query for the given page and get the results. If there are
            // no results we can just break and return from here. When there are results
            // we will call the callback with the current chunk of these results here.
            const results = await clone.forPageAfterId(count, lastId, column).get<T>();

            countResults = results.count();

            if (countResults === 0) {
                break;
            }

            // On each chunk result set, we will pass them to the callback and then let the
            // developer take care of everything within the callback, which allows us to
            // keep the memory low for spinning through large result sets for working.
            if ((await callback(results, page)) === false) {
                return false;
            }

            lastId = results.last()[alias as keyof T] as number | null | undefined;

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
    public async eachById<T>(
        callback: (item: T, index: number) => Promise<false | void> | false | void,
        count = 1000,
        column: Stringable | null = null,
        alias: Stringable | null = null
    ): Promise<boolean> {
        return this.chunkById<T>(
            count,
            async (items, page) => {
                const results = items.all();
                for (let x = 0; x < results.length; x++) {
                    if ((await callback(results[x], (page - 1) * count + x)) === false) {
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
    public lazy<T>(chunkSize = 1000): LazyCollection<T> {
        if (chunkSize < 1) {
            throw new Error('The chunk size should be at least 1');
        }

        this.enforceOrderBy();

        return new LazyCollection<T>(
            async function* (this: BuilderContract) {
                let page = 1;

                while (true) {
                    const results = await this.forPage(page++, chunkSize).get<T>();

                    for (const result of results.all()) {
                        yield result;
                    }

                    if (results.count() < chunkSize) {
                        return;
                    }
                }
            }.bind(this)
        );
    }

    /**
     * Query lazily, by chunking the results of a query by comparing IDs.
     */
    public lazyById<T>(
        chunkSize = 1000,
        column: Stringable | null = null,
        alias: string | null = null
    ): LazyCollection<T> {
        return this.orderedLazyById<T>(chunkSize, column, alias);
    }

    /**
     * Query lazily, by chunking the results of a query by comparing IDs in descending order.
     */
    public lazyByIdDesc<T>(
        chunkSize = 1000,
        column: Stringable | null = null,
        alias: string | null = null
    ): LazyCollection<T> {
        return this.orderedLazyById<T>(chunkSize, column, alias, true);
    }

    /**
     * Query lazily, by chunking the results of a query by comparing IDs in a given order.
     */
    protected orderedLazyById<T>(
        chunkSize = 1000,
        column: Stringable | null = null,
        alias: Stringable | null = null,
        descending = false
    ): LazyCollection<T> {
        if (chunkSize < 1) {
            throw new Error('The chunk size should be at least 1');
        }

        column = column === null ? this.defaultKeyName() : column;
        alias = this.getGrammar()
            .getValue(alias === null ? column : alias)
            .toString();

        return new LazyCollection<T>(
            async function* (this: BuilderContract) {
                let lastId: number | null | undefined;

                while (true) {
                    const clone = this.clone();

                    const results = (
                        descending
                            ? await clone.forPageBeforeId(chunkSize, lastId, column as Stringable).get()
                            : await clone.forPageAfterId(chunkSize, lastId, column as Stringable).get()
                    ) as Collection<T>;

                    for (const result of results.all()) {
                        yield result;
                    }

                    if (results.count() < chunkSize) {
                        return;
                    }

                    lastId = results.last()[alias as keyof T] as number | null;

                    if (lastId == null) {
                        throw new Error(
                            `The lazyById operation was aborted because the [${alias}] column is not present in the query result.`
                        );
                    }
                }
            }.bind(this)
        );
    }

    /**
     * Execute the query and get the first result.
     */
    public async first<T>(columns: Stringable | Stringable[] = ['*']): Promise<T | null> {
        return (await this.take(1).get<T>(columns)).first();
    }

    /**
     * Execute the query and get the first result if it's the sole matching record.
     */
    public async sole<T>(columns: Stringable | Stringable[] = ['*']): Promise<T> {
        const result = await this.take(2).get<T>(columns);

        const count = result.count();

        if (count === 0) {
            throw new Error(`no records were found.`);
        }

        if (count > 1) {
            throw new Error(`${count} records were found.`);
        }

        return result.first();
    }

    /**
     * Execute a query for a single record by ID.
     */
    public async find<T>(id: string | number | bigint, columns: Stringable | Stringable[] = ['*']): Promise<T | null> {
        return this.where('id', '=', id).first<T>(columns);
    }

    /**
     * Execute a query for a single record by ID or call a callback.
     */
    public async findOr<T>(id: number | string | bigint): Promise<T | null>;
    public async findOr<T, U>(id: number | string | bigint, callback: () => U): Promise<T | U>;
    public async findOr<T, U>(id: number | string | bigint, columns: Stringable | Stringable[]): Promise<T | U>;
    public async findOr<T, U>(
        id: number | string | bigint,
        columnsCallback?: Stringable | Stringable[] | (() => U),
        callback?: (() => U) | null
    ): Promise<T | U | null>;
    public async findOr<T, U>(
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
    public async get<T>(columns: Stringable | Stringable[] = ['*']): Promise<Collection<T>> {
        return new Collection<T>(
            await this.onceWithColumns<T>(Array.isArray(columns) ? columns : [columns], async () => {
                return this.getProcessor().processSelect<T>(this, await this.runSelect<T>());
            })
        );
    }

    /**
     * Run the query as a "select" statement against the connection.
     */
    protected async runSelect<T = Dictionary>(): Promise<T[]> {
        return this.getConnection().select<T>(this.toSql(), this.getBindings(), !this.registry.useWritePdo);
    }

    /**
     * Get a lazy collection for the given query.
     */
    public cursor<T>(): LazyCollection<T> {
        if (this.registry.columns === null) {
            this.registry.columns = ['*'];
        }

        return new LazyCollection<T>(
            async function* (this: BuilderContract) {
                yield* await this.getConnection().cursor<T>(
                    this.toSql(),
                    this.getBindings(),
                    !this.getRegistry().useWritePdo
                );
            }.bind(this)
        );
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
     * Get a collection instance containing the values of a given column.
     */
    public async pluck<T>(column: Stringable, key: Stringable | null = null): Promise<Collection<T>> {
        // First, we will need to select the results of the query accounting for the
        // given columns / key. Once we have the results, we will be able to take
        // the results and get the exact data that was requested for the query.
        const queryResult = await this.onceWithColumns(key === null ? [column] : [column, key], async () => {
            return this.getProcessor().processSelect(this, await this.runSelect());
        });

        if (queryResult.length === 0) {
            return new Collection<T>();
        }

        // If the columns are qualified with a table or have an alias, we cannot use
        // those directly in the "pluck" operations since the results from the DB
        // are only keyed by the column itself. We'll strip the table out here.
        column = this.stripTableForPluck(column);

        if (key === null) {
            return new Collection<T>(queryResult.map(item => item[column as keyof Dictionary]));
        } else {
            key = this.stripTableForPluck(key);
            return new Collection<T>(
                queryResult.reduce((carry, item) => {
                    const newKey = item[key as keyof Dictionary];
                    if (Array.isArray(newKey) || Buffer.isBuffer(newKey)) {
                        throw new Error('key value is not stringable');
                    }
                    carry[newKey === null ? 'null' : newKey.toString()] = item[column as keyof Dictionary];
                    return carry;
                }, {})
            );
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
        return (await this.pluck<T>(column)).implode(glue);
    }

    /**
     * Determine if any rows exist for the current query.
     */
    public async exists(): Promise<boolean> {
        this.applyBeforeQueryCallbacks();

        const results = await this.getConnection().select(
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
        return !this.exists();
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
        return res === null
            ? 0
            : BigInt(res) > Number.MAX_SAFE_INTEGER || BigInt(res) < Number.MIN_SAFE_INTEGER
            ? BigInt(res)
            : Number(res);
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
        const results = await this.cloneWithout(
            this.registry.unions.length > 0 || this.registry.havings.length > 0 ? [] : ['columns']
        )
            .cloneWithoutBindings(this.registry.unions.length > 0 || this.registry.havings.length > 0 ? [] : ['select'])
            .setAggregate(fnName, columns)
            .get<{ aggregate: string | number | bigint | null }>(columns);

        if (!results.isEmpty()) {
            return results.first().aggregate;
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
        return !result.includes('.')
            ? BigInt(result) > Number.MAX_SAFE_INTEGER || BigInt(result) < Number.MIN_SAFE_INTEGER
                ? BigInt(result)
                : Number(result)
            : parseFloat(result);
    }

    /**
     * Set the aggregate property without running the query.
     */
    public setAggregate(fnName: string, columns: Stringable[]): this {
        this.registry.aggregate = { fnName, columns };

        if (this.registry.groups.length === 0) {
            this.registry.orders = [];
            this.registry.bindings.order = [];
        }

        return this;
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

        if (!Array.isArray(values)) {
            values = [values];
        }

        // Here, we will sort the insert keys for every record so that each insert is
        // in the same order for the record. We need to make sure this is the case
        // so there are not any errors or problems when inserting these records.
        else {
            values = values.map(value => {
                return Object.keys(value)
                    .sort()
                    .reduce(
                        (acc: RowValues, key) => ({
                            ...acc,
                            [key]: value[key]
                        }),
                        {}
                    );
            });
        }

        this.applyBeforeQueryCallbacks();

        // Finally, we will run this query against the database connection and return
        // the results. We will need to also flatten these bindings before running
        // the query so they are all in one huge, flattened array for execution.
        return this.getConnection().insert(
            this.getGrammar().compileInsert(this, values as RowValues[]),
            this.cleanBindings(values.map(value => Object.values(value)).flat(1))
        );
    }

    /**
     * Insert new records into the database while ignoring errors.
     */
    public async insertOrIgnore(values: RowValues | RowValues[]): Promise<number> {
        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            return 0;
        }

        if (!Array.isArray(values)) {
            values = [values];
        } else {
            values = values.map(value => {
                return Object.keys(value)
                    .sort()
                    .reduce(
                        (acc: RowValues, key) => ({
                            ...acc,
                            [key]: value[key]
                        }),
                        {}
                    );
            });
        }

        this.applyBeforeQueryCallbacks();

        return await this.getConnection().affectingStatement(
            this.getGrammar().compileInsertOrIgnore(this, values as RowValues[]),
            this.cleanBindings(values.map(value => Object.values(value)).flat(1))
        );
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
    public async insertUsing(columns: Stringable[], query: QueryAble): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const [sql, bindings] = this.createSub(query);

        return await this.getConnection().affectingStatement(
            this.getGrammar().compileInsertUsing(this, columns, sql),
            this.cleanBindings(bindings)
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
            this.cleanBindings(this.getGrammar().prepareBindingsForUpdate(this.registry.bindings, values))
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
            this.cleanBindings(this.getGrammar().prepareBindingsForUpdateFrom(this.registry.bindings, values))
        );
    }

    /**
     * Insert or update a record matching the attributes, and fill it with values.
     */
    public async updateOrInsert(attributes: RowValues, values: RowValues = {}): Promise<boolean> {
        if (!(await this.where(attributes).exists())) {
            return this.insert(Object.assign(attributes, values));
        }

        if (values.length === 0) {
            return true;
        }

        return Boolean(this.limit(1).update(values));
    }

    /**
     * Insert new records or update the existing ones.
     */
    public async upsert(
        values: RowValues[] | RowValues,
        uniqueBy: string | string[],
        update: string[] | RowValues | null = null
    ): Promise<number> {
        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            return 0;
        } else if (
            update !== null &&
            ((Array.isArray(update) && update.length === 0) || Object.keys(update).length === 0)
        ) {
            return Number(this.insert(values));
        }

        if (!Array.isArray(values)) {
            values = [values];
        } else {
            values = values.map(value => {
                return Object.keys(value)
                    .sort()
                    .reduce(
                        (acc: RowValues, key) => ({
                            ...acc,
                            [key]: value[key]
                        }),
                        {}
                    );
            });
        }

        if (update === null) {
            update = Object.keys(values[0]);
        }

        this.applyBeforeQueryCallbacks();

        const bindings = this.cleanBindings(
            values
                .map(value => Object.values(value))
                .flat(1)
                .concat(Array.isArray(update) ? [] : Object.values(update))
        );

        return this.getConnection().affectingStatement(
            this.getGrammar().compileUpsert(this, values, Array.isArray(uniqueBy) ? uniqueBy : [uniqueBy], update),
            bindings
        );
    }

    /**
     * Increment a column's value by a given amount.
     */
    public async increment(column: string, amount = 1, extra: RowValues = {}): Promise<number> {
        if ((typeof amount !== 'number' || typeof amount !== 'bigint') && isNaN(Number(amount))) {
            throw new TypeError('Non-numeric value passed to increment method.');
        }

        return this.incrementEach({ [column]: Number(amount) }, extra);
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

        return this.update(Object.assign(processed, extra));
    }

    /**
     * Decrement a column's value by a given amount.
     */
    public async decrement(column: string, amount = 1, extra: RowValues = {}): Promise<number> {
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

        return this.update(Object.assign(processed, extra));
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
    public async explain(): Promise<Collection<string>> {
        const sql = this.toSql();
        const bindings = this.getBindings();

        const explanation = await this.getConnection().select<string>(`EXPLAIN ${sql}`, bindings);

        return new Collection(explanation);
    }

    /**
     * Pass the query to a given callback.
     */
    public tap(callback: QueryAbleCallback<this>): this {
        callback(this);

        return this;
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    public when<T = boolean>(
        value: BooleanCallback<T, this> | T,
        callback: (query: this, value: T) => void | this,
        defaultCallback: null | ((query: this, value: T) => void | this) = null
    ): this {
        value = this.isBooleanCallback(value) ? value(this) : value;

        if (Boolean(value)) {
            return callback(this, value) ?? this;
        } else if (defaultCallback !== null) {
            return defaultCallback(this, value) ?? this;
        }

        return this;
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     */
    public unless<T = boolean>(
        value: BooleanCallback<T, this> | T,
        callback: (query: this, value: T) => void | this,
        defaultCallback: null | ((query: this, value: T) => void | this) = null
    ): this {
        value = this.isBooleanCallback(value) ? value(this) : value;

        if (!Boolean(value)) {
            return callback(this, value) ?? this;
        } else if (defaultCallback !== null) {
            return defaultCallback(this, value) ?? this;
        }

        return this;
    }

    /**
     * Get a new instance of the query builder.
     */
    public abstract newQuery(): BuilderContract;

    /**
     * Create a new query instance for a sub-query.
     */
    protected forSubQuery(): BuilderContract {
        return this.newQuery();
    }

    /**
     * Get all of the query builder's columns in a text-only array with all expressions evaluated.
     */
    public getColumns(): string[] {
        const columns = this.getRegistry().columns;
        return columns !== null ? columns.map(column => this.getGrammar().getValue(column).toString()) : [];
    }

    /**
     * Create a raw database expression.
     */
    public raw(value: string | number | bigint): ExpressionContract {
        return raw(value);
    }

    /**
     * Get the current query value bindings in a flattened array.
     */
    public getBindings(): Binding[] {
        return Object.values(this.registry.bindings).flat(Infinity);
    }

    /**
     * Get the raw array of bindings.
     */
    public getRawBindings(): BindingTypes {
        return this.registry.bindings;
    }

    /**
     * Set the bindings on the query builder.
     */
    public setBindings(bindings: Binding[], type: keyof BindingTypes = 'where'): this {
        if (!(type in this.registry.bindings)) {
            throw new Error(`Invalid binding type: ${type}.`);
        }

        this.registry.bindings[type] = bindings.map(binding => this.castBinding(binding));

        return this;
    }

    /**
     * Add a binding to the query.
     */
    public addBinding(value: Binding | Binding[], type: keyof BindingTypes = 'where'): this {
        if (!(type in this.registry.bindings)) {
            throw new Error(`Invalid binding type: ${type}.`);
        }

        value = Array.isArray(value) ? value : [value];

        this.registry.bindings[type].push(...value.map(binding => this.castBinding(binding)));

        return this;
    }

    /**
     * Cast the given binding value.
     */
    public castBinding(value: Binding): Binding {
        return value;
    }

    /**
     * Merge an array of bindings into our bindings.
     */
    public mergeBindings(query: BuilderContract): this {
        this.registry.bindings = deepmerge(this.registry.bindings, query.getRegistry().bindings);

        return this;
    }

    /**
     * Remove all of the expressions from a list of bindings.
     */
    public cleanBindings(bindings: Binding[]): NotExpressionBinding[] {
        return bindings
            .filter((binding: Binding) => !this.isExpression(binding))
            .map((binding: Binding) => this.castBinding(binding)) as NotExpressionBinding[];
    }

    /**
     * Get a scalar type value from an unknown type of input.
     */
    protected flattenValue<T extends Binding>(value: T | T[]): T {
        return Array.isArray(value) ? (value.flat(Infinity)[0] as T) : value;
    }

    /**
     * Get the default key name of the table.
     */
    protected defaultKeyName(): string {
        return 'id';
    }

    /**
     * Use the "write" PDO connection when executing the query.
     */
    public useWritePdo(): this {
        this.registry.useWritePdo = true;

        return this;
    }

    /**
     * Get the database connection instance.
     */
    public getConnection(): ConnectionSessionI {
        return this.connection;
    }

    /**
     * Get the database query processor instance.
     */
    public getProcessor(): ProcessorI {
        return this.processor ?? this.connection.getPostProcessor();
    }

    /**
     * Get the query grammar instance.
     */
    public getGrammar(): GrammarI {
        return this.grammar ?? this.connection.getQueryGrammar();
    }

    /**
     * Determine if the value is a query builder instance or a Closure.
     */
    protected isQueryable<T extends BuilderContract = this>(
        value: any
    ): value is BuilderContract | QueryAbleCallback<T> {
        return this.isQueryableCallback<T>(value) || this.isBuilderContract(value);
    }

    /**
     * Determine if the value is a query builder instance.
     */
    protected isBuilderContract(value: any): value is BuilderContract {
        return typeof value === 'object' && value instanceof BuilderContract;
    }

    /**
     * Determine if the value is instance or a Closure.
     */
    protected isQueryableCallback<T extends BuilderContract = this>(value: any): value is QueryAbleCallback<T> {
        return typeof value === 'function';
    }

    /**
     * Determine if the value is instance or a Closure.
     */
    protected isBooleanCallback<T, U extends BuilderContract = this>(value: any): value is BooleanCallback<T, U> {
        return typeof value === 'function';
    }

    /**
     * Determine if the value is Arrayable.
     */
    protected isArrayable(value: any): value is Arrayable {
        return typeof value === 'object' && 'toArray' in value && typeof value.toArray === 'function';
    }

    /**
     * Determine if the value is Stringable
     */
    protected isStringable(parameter: any): parameter is Stringable {
        return typeof parameter === 'string' || this.isExpression(parameter);
    }

    /**
     * Determine if the value is Expression
     */
    protected isExpression(parameter: any): parameter is ExpressionContract {
        return typeof parameter === 'object' && parameter instanceof ExpressionContract;
    }

    /**
     * Determine if the value is a Where Object
     */
    protected isWhereObject(parameter: any): parameter is WhereObject {
        return typeof parameter === 'object' && !this.isBuilderContract(parameter) && !this.isExpression(parameter);
    }

    public abstract clone(): BuilderContract;

    public abstract cloneWithout(properties: (keyof Registry)[]): BuilderContract;

    public abstract cloneWithoutBindings(except: (keyof BindingTypes)[]): BuilderContract;
}

export default BaseBuilder;
