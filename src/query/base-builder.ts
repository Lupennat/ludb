import { Collection } from 'collect.js';
import deepmerge from 'deepmerge';
import { snakeCase } from 'snake-case';
import LazyCollection from '../collections/lazy-collection';
import { ConnectionSessionI } from '../types/connection';
import ProcessorI from '../types/processor';
import {
    Arrayable,
    BetweenTuple,
    Binding,
    BooleanCallback,
    ConditionBoolean,
    FullTextOptions,
    JoinCallback,
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
    WhereMethod,
    WhereTuple
} from '../types/query/builder';
import GrammarI from '../types/query/grammar';
import JoinClauseI from '../types/query/join-clause';

import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Registry, { BindingTypes, Order, Where } from '../types/query/registry';
import { raw } from '../utils';
import BuilderContract from './builder-contract';
import Expression from './expression';
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

    public getRegistry(): Registry {
        return this.registry;
    }

    public setRegistry(registry: Registry): this {
        this.registry = registry;

        return this;
    }

    public select(columns: SelectColumn | SelectColumn[] = ['*'], ...otherColumns: SelectColumn[]): this {
        this.registry.columns = [];
        this.registry.bindings.select = [];

        columns = (Array.isArray(columns) ? columns : [columns]).concat(otherColumns);

        for (const column of columns) {
            if (typeof column === 'string' || column instanceof Expression) {
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

    public selectSub(query: SubQuery, as: Stringable): this {
        const [queryString, bindings] = this.createSub(query);

        return this.selectRaw(`(${queryString}) as ${this.getGrammar().wrap(as)}`, bindings);
    }

    public selectRaw(expression: string, bindings: Binding[] = []): this {
        this.addSelect(new Expression(expression));

        if (bindings) {
            this.addBinding(bindings, 'select');
        }

        return this;
    }

    public fromSub(query: SubQuery, as: Stringable): this {
        const [queryString, bindings] = this.createSub(query);

        return this.fromRaw(`(${queryString}) as ${this.getGrammar().wrapTable(as)}`, bindings);
    }

    public fromRaw(expression: string, bindings: Binding[] = []): this {
        this.registry.from = new Expression(expression);

        this.addBinding(bindings, 'from');

        return this;
    }

    /**
     * Creates a subquery and parse it.
     */
    protected createSub(query: SubQuery): [string, Binding[]] {
        // If the given query is a Closure, we will execute it while passing in a new
        // query instance to the Closure. This will give the developer a chance to
        // format and work with the query before we cast it to a raw SQL string.
        if (typeof query === 'function') {
            const callback = query;
            query = this.forSubQuery();
            callback(query);
        }

        return this.parseSub(query);
    }

    /**
     * Parse the subquery into SQL and bindings.
     */
    protected parseSub(query: QueryAble): [string, Binding[]] {
        if (typeof query === 'string' || query instanceof Expression) {
            return [query.toString(), []];
        }

        query = this.prependDatabaseNameIfCrossDatabaseQuery(query);

        return [query.toSql(), query.getBindings()];
    }

    /**
     * Prepend the database name if the given query is on another database.
     */
    protected prependDatabaseNameIfCrossDatabaseQuery(query: BuilderContract): BuilderContract {
        if (query.getConnection().getDatabaseName() !== this.getConnection().getDatabaseName()) {
            const databaseName = query.getConnection().getDatabaseName();

            if (query.getRegistry().from.startsWith(databaseName) && !query.getRegistry().from.includes('.')) {
                query.getRegistry().from = `${databaseName}.${query.getRegistry().from}`;
            }
        }

        return query;
    }

    public addSelect(columns: SelectColumn | SelectColumn[], ...otherColumns: SelectColumn[]): this {
        columns = (Array.isArray(columns) ? columns : [columns]).concat(otherColumns);

        for (const column of columns) {
            if (typeof column === 'string' || column instanceof Expression) {
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

    public distinct(column?: boolean | Stringable, ...columns: Stringable[]): this {
        if (column != null) {
            this.registry.distinct = typeof column === 'boolean' ? column : [column].concat(columns);
        } else {
            this.registry.distinct = true;
        }

        return this;
    }

    public from(table: SubQuery, as = ''): this {
        if (this.isQueryable(table)) {
            return this.fromSub(table, as);
        }

        this.registry.from = (as ? `${table} as ${as}` : table) as string;

        return this;
    }

    public join(table: Stringable, first: JoinCallback, operator: null, second: null, type: string, where: false): this;
    public join(
        table: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback,
        operator: null,
        second: null,
        type: string,
        where: false
    ): this;
    public join(
        table: Stringable,
        first: Stringable,
        operator: Stringable,
        second: null,
        type: string,
        where: false
    ): this;
    public join(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable,
        type: string,
        where: false
    ): this;
    public join(
        table: Stringable,
        first: JoinCallback | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string,
        where?: false
    ): this;
    public join(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract | WhereTuple[],
        operator: null,
        second: null,
        type: string,
        where: true
    ): this;
    public join(table: Stringable, first: Stringable, operator: Binding, second: null, type: string, where: true): this;
    public join(
        table: Stringable,
        first: Stringable,
        operator: string,
        second: Binding,
        type: string,
        where: true
    ): this;
    public join(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond?: string | Binding,
        second?: Binding,
        type?: string,
        where?: true
    ): this;
    public join(
        table: Stringable,
        first: JoinCallback | WhereColumnTuple[] | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond?: Stringable | Binding,
        second?: Stringable | Binding,
        type?: string,
        where?: boolean
    ): this;
    public join(
        table: Stringable,
        first: JoinCallback | WhereColumnTuple[] | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond: Stringable | Binding = null,
        second: Stringable | Binding = null,
        type = 'inner',
        where = false
    ): this {
        const join = this.newJoinClause(this, type, table);

        // If the first "column" of the join is really a Closure instance the developer
        // is trying to build a join with a complex "on" clause containing more than
        // one condition, so we'll add the join and call a Closure with the query.
        if (typeof first === 'function') {
            first(join);

            this.registry.joins.push(join);

            this.addBinding(join.getBindings(), 'join');
        }

        // If the column is simply a string, we can assume the join simply has a basic
        // "on" clause with a single condition. So we will just build the join with
        // this simple join clauses attached to it. There is not a join callback.
        else {
            const method = where ? 'where' : 'on';

            if (method === 'on') {
                join.on(
                    first as Stringable | WhereColumnTuple[],
                    operatorOrSecond as Stringable | null,
                    second as Stringable | null
                );
            } else {
                join.where(
                    first as WhereColumnTuple[] | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
                    operatorOrSecond as string | Binding,
                    second as Binding
                );
            }

            this.registry.joins.push(join);

            this.addBinding(join.getBindings(), 'join');
        }

        return this;
    }

    public joinWhere(table: Stringable, first: JoinCallback | QueryAbleCallback | WhereTuple[]): this;
    public joinWhere(table: Stringable, first: Stringable, second: Binding): this;
    public joinWhere(table: Stringable, first: QueryAbleCallback | BuilderContract, second: NotNullableBinding): this;
    public joinWhere(table: Stringable, first: Stringable, operator: string, second: Binding): this;
    public joinWhere(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract,
        operator: string,
        second: NotNullableBinding
    ): this;
    public joinWhere(
        table: Stringable,
        first: JoinCallback | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond?: string | Binding,
        second?: Binding,
        type?: string
    ): this;
    public joinWhere(
        table: Stringable,
        first: JoinCallback | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond: string | Binding = null,
        second: Binding = null,
        type = 'inner'
    ): this {
        return this.join(table, first, operatorOrSecond, second, type, true);
    }

    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback,
        operator: null,
        second: null,
        type: string,
        where: false
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: WhereColumnTuple[] | QueryAbleCallback,
        operator: null,
        second: null,
        type: string,
        where: false
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: Stringable,
        operator: Stringable,
        second: null,
        type: string,
        where: false
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Stringable,
        type: string,
        where: false
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback | WhereColumnTuple[] | Stringable,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        type?: string,
        where?: false
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback | QueryAbleCallback | WhereTuple[],
        operator: null,
        second: null,
        type: string,
        where: true
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: Stringable,
        operator: Binding,
        second: null,
        type: string,
        where: true
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: QueryAbleCallback | BuilderContract,
        operator: NotNullableBinding,
        second: null,
        type: string,
        where: true
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: Stringable,
        operator: string,
        second: Binding,
        type: string,
        where: true
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: QueryAbleCallback | BuilderContract,
        operator: string,
        second: NotNullableBinding,
        type: string,
        where: true
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond?: string | Binding,
        second?: Binding,
        type?: string,
        where?: true
    ): this;
    public joinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback | WhereColumnTuple[] | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond: Stringable | Binding = null,
        second: Stringable | Binding = null,
        type = 'inner',
        where = false
    ): this {
        const [queryString, bindings] = this.createSub(query);

        const expression = `(${queryString}) as ${this.getGrammar().wrapTable(as)}`;

        this.addBinding(bindings, 'join');

        return this.join(new Expression(expression), first, operatorOrSecond, second, type, where);
    }

    public leftJoin(table: Stringable, first: JoinCallback): this;
    public leftJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback): this;
    public leftJoin(table: Stringable, first: Stringable, second: Stringable): this;
    public leftJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public leftJoin(
        table: Stringable,
        first: JoinCallback | Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.join(table, first, operatorOrSecond, second, 'left');
    }

    public leftJoinWhere(table: Stringable, first: JoinCallback | QueryAbleCallback | WhereTuple[]): this;
    public leftJoinWhere(table: Stringable, first: Stringable, second: Binding): this;
    public leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract,
        second: NotNullableBinding
    ): this;
    public leftJoinWhere(table: Stringable, first: Stringable, operator: string, second: Binding): this;
    public leftJoinWhere(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract,
        operator: string,
        second: NotNullableBinding
    ): this;
    public leftJoinWhere(
        table: Stringable,
        first: JoinCallback | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond: string | Binding = null,
        second: Binding = null
    ): this {
        return this.joinWhere(table, first, operatorOrSecond, second, 'left');
    }

    public leftJoinSub(query: SubQuery, as: Stringable, first: JoinCallback): this;
    public leftJoinSub(query: SubQuery, as: Stringable, first: WhereColumnTuple[] | QueryAbleCallback): this;
    public leftJoinSub(query: SubQuery, as: Stringable, first: Stringable, second: Stringable): this;
    public leftJoinSub(query: SubQuery, as: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public leftJoinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback | Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.joinSub(query, as, first, operatorOrSecond, second, 'left');
    }

    public rightJoin(table: Stringable, first: JoinCallback): this;
    public rightJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback): this;
    public rightJoin(table: Stringable, first: Stringable, second: Stringable): this;
    public rightJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public rightJoin(
        table: Stringable,
        first: JoinCallback | Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.join(table, first, operatorOrSecond, second, 'right');
    }

    public rightJoinWhere(table: Stringable, first: JoinCallback | QueryAbleCallback | WhereTuple[]): this;
    public rightJoinWhere(table: Stringable, first: Stringable, second: Binding): this;
    public rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract,
        second: NotNullableBinding
    ): this;
    public rightJoinWhere(table: Stringable, first: Stringable, operator: string, second: Binding): this;
    public rightJoinWhere(
        table: Stringable,
        first: QueryAbleCallback | BuilderContract,
        operator: string,
        second: NotNullableBinding
    ): this;
    public rightJoinWhere(
        table: Stringable,
        first: JoinCallback | QueryAbleCallback | BuilderContract | WhereTuple[] | Stringable,
        operatorOrSecond: string | Binding = null,
        second: Binding = null
    ): this {
        return this.joinWhere(table, first, operatorOrSecond, second, 'right');
    }

    public rightJoinSub(query: SubQuery, as: Stringable, first: JoinCallback): this;
    public rightJoinSub(query: SubQuery, as: Stringable, first: WhereColumnTuple[] | QueryAbleCallback): this;
    public rightJoinSub(query: SubQuery, as: Stringable, first: Stringable, second: Stringable): this;
    public rightJoinSub(query: SubQuery, as: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public rightJoinSub(
        query: SubQuery,
        as: Stringable,
        first: JoinCallback | Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.joinSub(query, as, first, operatorOrSecond, second, 'right');
    }

    public crossJoin(table: Stringable): this;
    public crossJoin(table: Stringable, first: JoinCallback): this;
    public crossJoin(table: Stringable, first: WhereColumnTuple[] | QueryAbleCallback): this;
    public crossJoin(table: Stringable, first: Stringable, second: Stringable): this;
    public crossJoin(table: Stringable, first: Stringable, operator: string, second: Stringable): this;
    public crossJoin(
        table: Stringable,
        first: JoinCallback | Stringable | WhereColumnTuple[] | QueryAbleCallback | null = null,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        if (first !== null) {
            return this.join(table, first, operatorOrSecond, second, 'cross');
        }

        this.registry.joins.push(this.newJoinClause(this, 'cross', table));

        return this;
    }

    public crossJoinSub(query: SubQuery, as: Stringable): this {
        const [queryString, bindings] = this.createSub(query);

        const expression = `(${queryString}) as ${this.getGrammar().wrapTable(as)}`;

        this.addBinding(bindings, 'join');

        this.registry.joins.push(this.newJoinClause(this, 'cross', new Expression(expression)));

        return this;
    }

    /**
     * Get a new join clause.
     */
    protected abstract newJoinClause(parentQuery: BuilderContract, type: string, table: Stringable): JoinClauseI;

    public mergeWheres(wheres: Where[], bindings: Binding[]): this {
        this.registry.wheres = this.registry.wheres.concat(wheres);

        this.registry.bindings.where = this.registry.bindings.where.concat(bindings);

        return this;
    }

    public where(column: QueryAbleCallback | WhereTuple[]): this;
    public where(column: Stringable, value: Binding): this;
    public where(column: QueryAbleCallback | BuilderContract, value: NotNullableBinding): this;
    public where(column: Stringable, operator: string, value: Binding): this;
    public where(column: QueryAbleCallback | BuilderContract, operator: string, value: NotNullableBinding): this;
    public where(
        column: Stringable | QueryAbleCallback | BuilderContract | WhereTuple[],
        operatorOrValue?: string | Binding,
        value?: Binding,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;

    public where(
        column: Stringable | QueryAbleCallback | BuilderContract | WhereTuple[],
        operatorOrValue: string | Binding = null,
        value: Binding = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        // If the column is an array, we will assume it is an array of key-value pairs
        // and can add them each as a where clause. We will maintain the boolean we
        // received when the method was called and pass it into the nested where.
        if (Array.isArray(column)) {
            return this.addArrayOfWheres(column, boolean, 'where', not);
        }

        // Here we will make some assumptions about the operator. If only 2 values are
        // passed to the method, we will assume that the operator is an equals sign
        // and keep going. Otherwise, we'll require the operator to be passed in.
        let [val, operator] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        // If the column is actually a Closure instance, we will assume the developer
        // wants to begin a nested where statement which is wrapped in parentheses.
        // We will add that Closure to the query and return back out immediately.
        if (typeof column === 'function' && operator === null) {
            return this.whereNested(column, boolean, not);
        }

        // If the column is a Closure instance and there is an operator value, we will
        // assume the developer wants to run a subquery and then compare the result
        // of that subquery with the given value that was provided to the method.
        if (this.isQueryable(column) && operator !== null) {
            const [sub, bindings] = this.createSub(column);

            return this.addBinding(bindings, 'where').where(new Expression(`(${sub})`), operator, val, boolean);
        }

        if (typeof column !== 'string' && !(column instanceof Expression)) {
            throw new TypeError('Value Cannot be null when column is instance of Query Builder.');
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (this.invalidOperator(operator)) {
            [val, operator] = [operator, '='];
        }

        // If the value is a Closure, it means the developer is performing an entire
        // sub-select within the query and we will need to compile the sub-select
        // within the where clause to get the appropriate query record results.
        if (typeof val === 'function') {
            return this.whereSub(column, operator, val, boolean, not);
        }

        // If the value is "null", we will just assume the developer wants to add a
        // where null clause to the query. So, we will allow a short-cut here to
        // that method for convenience so the developer doesn't have to check.
        if (val === null) {
            return this.whereNull(column, boolean, operator !== '=');
        }

        let type: 'Basic' | 'Bitwise' | 'JsonBoolean' = 'Basic';

        // If the column is making a JSON reference we'll check to see if the value
        // is a boolean. If it is, we'll add the raw boolean string as an actual
        // value to the query to ensure this is properly handled by the query.
        if (typeof column === 'string' && column.toString().includes('->') && typeof val === 'boolean') {
            val = new Expression(val ? 'true' : 'false');
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

        if (!(val instanceof Expression)) {
            this.addBinding(this.flattenValue(val), 'where');
        }

        return this;
    }

    /**
     * Add an array of where clauses to the query.

     */
    protected addArrayOfWheres(
        column: Array<WhereTuple | WhereColumnTuple>,
        boolean: ConditionBoolean,
        method: WhereMethod,
        not: boolean
    ): this {
        return this.whereNested(
            (query: BuilderContract): void => {
                for (const values of column) {
                    if (method === 'where') {
                        query.where(...(values as WhereTuple));
                    } else {
                        query.whereColumn(...(values as WhereColumnTuple));
                    }
                }
            },
            boolean,
            not
        );
    }

    public prepareValueAndOperator<T extends Binding>(value: T, operator: string | T, useDefault = false): [T, string] {
        if (useDefault) {
            return [operator as T, '='];
        } else if (this.invalidOperatorAndValue(operator, value)) {
            throw new TypeError('Illegal operator and value combination.');
        }

        return [value as T, operator as string];
    }

    /**
     * Determine if the given operator and value combination is legal.
     *
     * Prevents using Null values with invalid operators.
     */
    protected invalidOperatorAndValue(operator: string | Binding, value: Binding): boolean {
        return (
            value == null &&
            typeof operator === 'string' &&
            this.operators.indexOf(operator) > -1 &&
            ['=', '<>', '!='].indexOf(operator) === -1
        );
    }

    /**
     * Determine if the given operator is supported.
     */
    protected invalidOperator(operator: Stringable | Binding): boolean {
        return (
            typeof operator !== 'string' ||
            (this.operators.indexOf(operator.toLowerCase()) === -1 &&
                this.getGrammar().getOperators().indexOf(operator.toLowerCase()) === -1)
        );
    }

    /**
     * Determine if the operator is a bitwise operator.
     */
    protected isBitwiseOperator(operator: Stringable | Binding): boolean {
        return (
            typeof operator === 'string' &&
            (this.bitwiseOperators.indexOf(operator.toLowerCase()) > -1 ||
                this.getGrammar().getBitwiseOperators().indexOf(operator.toLowerCase()) > -1)
        );
    }

    /**
     * Add an "or where" clause to the query.
     */
    public orWhere(column: QueryAbleCallback | WhereTuple[]): this;
    public orWhere(column: Stringable, value: Binding): this;
    public orWhere(column: QueryAbleCallback | BuilderContract, value: NotNullableBinding): this;
    public orWhere(column: Stringable, operator: string, value: Binding): this;
    public orWhere(column: QueryAbleCallback | BuilderContract, operator: string, value: NotNullableBinding): this;
    public orWhere(
        column: Stringable | QueryAbleCallback | BuilderContract | WhereTuple[],
        operatorOrValue: string | Binding = null,
        value: Binding = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);

        return this.where(column, operatorOrValue, value, 'or');
    }

    /**
     * Add a basic "where not" clause to the query.
     */
    public whereNot(column: QueryAbleCallback | WhereTuple[]): this;
    public whereNot(column: Stringable, value: Binding): this;
    public whereNot(column: QueryAbleCallback | BuilderContract, value: NotNullableBinding): this;
    public whereNot(column: Stringable, operator: string, value: Binding): this;
    public whereNot(column: QueryAbleCallback | BuilderContract, operator: string, value: NotNullableBinding): this;
    public whereNot(
        column: Stringable | QueryAbleCallback | BuilderContract | WhereTuple[],
        operatorOrValue?: string | Binding,
        value?: Binding,
        boolean?: ConditionBoolean
    ): this;
    public whereNot(
        column: Stringable | QueryAbleCallback | BuilderContract | WhereTuple[],
        operatorOrValue: string | Binding = null,
        value: Binding = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.where(column, operatorOrValue, value, boolean, true);
    }

    /**
     * Add an "or where not" clause to the query.
     */
    public orWhereNot(column: QueryAbleCallback | WhereTuple[]): this;
    public orWhereNot(column: Stringable, value: Binding): this;
    public orWhereNot(column: QueryAbleCallback | BuilderContract, value: NotNullableBinding): this;
    public orWhereNot(column: Stringable, operator: string, value: Binding): this;
    public orWhereNot(column: QueryAbleCallback | BuilderContract, operator: string, value: NotNullableBinding): this;
    public orWhereNot(
        column: Stringable | QueryAbleCallback | BuilderContract | WhereTuple[],
        operatorOrValue: string | Binding = null,
        value: Binding = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.whereNot(column, operatorOrValue, value, 'or');
    }

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
            return this.addArrayOfWheres(first, boolean, 'whereColumn', not);
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (this.invalidOperator(operatorOrSecond)) {
            [second, operatorOrSecond] = [operatorOrSecond, '='];
        }

        // Finally, we will add this where clause into this array of clauses that we
        // are building for the query. All of them will be compiled via a grammar
        // once the query is about to be executed and run against the database.
        const type = 'Column';

        this.registry.wheres.push({
            type,
            first,
            operator: operatorOrSecond as string,
            second: second as Stringable,
            boolean,
            not
        });

        return this;
    }

    public orWhereColumn(first: WhereColumnTuple[]): this;
    public orWhereColumn(first: Stringable, second: Stringable): this;
    public orWhereColumn(first: Stringable, operator: string, second: Stringable): this;
    public orWhereColumn(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.whereColumn(first, operatorOrSecond, second, 'or');
    }

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

    public orWhereColumnNot(first: WhereColumnTuple[]): this;
    public orWhereColumnNot(first: Stringable, second: Stringable): this;
    public orWhereColumnNot(first: Stringable, operator: string, second: Stringable): this;
    public orWhereColumnNot(
        first: Stringable | WhereColumnTuple[],
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.whereColumnNot(first, operatorOrSecond, second, 'or');
    }

    public whereRaw(sql: string, bindings: Binding[] = [], boolean: ConditionBoolean = 'and'): this {
        const type = 'Raw';

        this.registry.wheres.push({ type, sql: sql, boolean: boolean });

        this.addBinding(bindings, 'where');

        return this;
    }

    public orWhereRaw(sql: string, bindings: Binding[] = []): this {
        return this.whereRaw(sql, bindings, 'or');
    }

    public whereIn(
        column: Stringable,
        values: SubQuery | Arrayable | Binding[],
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'In';

        // If the value is a query builder instance we will assume the developer wants to
        // look for any values that exist within this given query. So, we will add the
        // query accordingly so that this query is properly executed when it is run.
        if (this.isQueryable(values)) {
            const [query, bindings] = this.createSub(values as SubQuery);

            values = [new Expression(query)];

            this.addBinding(bindings, 'where');
        }

        // Next, if the value is Arrayable we need to cast it to its raw array form so we
        // have the underlying array value instead of an Arrayable object which is not
        // able to be added as a binding, etc. We will then add to the wheres array.
        if (typeof values === 'object' && 'toArray' in values && typeof values.toArray === 'function') {
            values = values.toArray();
        }

        this.registry.wheres.push({ type, column: column as Stringable, values: values as Binding[], boolean, not });

        if ((values as Binding[]).length !== (values as Binding[]).flat(1).length) {
            throw new TypeError('Nested arrays may not be passed to whereIn method.');
        }

        // Finally, we'll add a binding for each value unless that value is an expression
        // in which case we will just skip over it since it will be the query as a raw
        // string and not as a parameterized place-holder to be replaced by the PDO.
        this.addBinding(this.cleanBindings(values as Binding[]), 'where');

        return this;
    }
    public orWhereIn(column: Stringable, values: SubQuery | Arrayable | Binding[]): this {
        return this.whereIn(column, values, 'or');
    }

    public whereNotIn(
        column: Stringable,
        values: SubQuery | Arrayable | Binding[],
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereIn(column, values, boolean, true);
    }

    public orWhereNotIn(column: Stringable, values: SubQuery | Arrayable | Binding[]): this {
        return this.whereNotIn(column, values, 'or');
    }

    public whereIntegerInRaw(
        column: Stringable,
        values: Arrayable | Binding[],
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'InRaw';

        if (typeof values === 'object' && 'toArray' in values && typeof values.toArray === 'function') {
            values = values.toArray();
        }

        values = (values as Binding[]).flat(Infinity).map((value: any) => Number(value));

        this.registry.wheres.push({ type, column, values: values as number[], boolean, not });

        return this;
    }

    public orWhereIntegerInRaw(column: Stringable, values: Arrayable | Binding[]): this {
        return this.whereIntegerInRaw(column, values, 'or');
    }

    public whereIntegerNotInRaw(
        column: Stringable,
        values: Arrayable | Binding[],
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereIntegerInRaw(column, values, boolean, true);
    }

    public orWhereIntegerNotInRaw(column: Stringable, values: Arrayable | Binding[]): this {
        return this.whereIntegerNotInRaw(column, values, 'or');
    }

    public whereNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'Null';
        columns = Array.isArray(columns) ? columns : [columns];
        for (const column of columns) {
            this.registry.wheres.push({ type, column, boolean, not });
        }

        return this;
    }

    public orWhereNull(columns: Stringable | Stringable[]): this {
        return this.whereNull(columns, 'or');
    }

    public whereNotNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and'): this {
        return this.whereNull(columns, boolean, true);
    }

    public orWhereNotNull(columns: Stringable | Stringable[]): this {
        return this.whereNotNull(columns, 'or');
    }

    public whereBetween(
        column: Stringable,
        values: BetweenTuple,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'Between';

        this.registry.wheres.push({ type, column, values, boolean, not });

        this.addBinding(this.cleanBindings(values.flat(Infinity)).slice(0, 2), 'where');

        return this;
    }

    public whereBetweenColumns(
        column: Stringable,
        values: BetweenTuple,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'BetweenColumns';

        this.registry.wheres.push({ type, column, values, boolean, not });

        return this;
    }

    public orWhereBetween(column: Stringable, values: BetweenTuple): this {
        return this.whereBetween(column, values, 'or');
    }

    public orWhereBetweenColumns(column: Stringable, values: BetweenTuple): this {
        return this.whereBetweenColumns(column, values, 'or');
    }

    public whereNotBetween(column: Stringable, values: BetweenTuple, boolean: ConditionBoolean = 'and'): this {
        return this.whereBetween(column, values, boolean, true);
    }

    public whereNotBetweenColumns(column: Stringable, values: BetweenTuple, boolean: ConditionBoolean = 'and'): this {
        return this.whereBetweenColumns(column, values, boolean, true);
    }

    public orWhereNotBetween(column: Stringable, values: BetweenTuple): this {
        return this.whereNotBetween(column, values, 'or');
    }

    public orWhereNotBetweenColumns(column: Stringable, values: BetweenTuple): this {
        return this.whereNotBetweenColumns(column, values, 'or');
    }

    public whereDate(
        column: Stringable,
        operator: string,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = `${value.getFullYear().toString().padStart(4, '0')}-${(value.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')}`;
        }

        return this.addDateBasedWhere('Date', column, operator, value, boolean, not);
    }

    public orWhereDate(column: Stringable, operator: string, value: Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDate(column, operator, value, 'or');
    }

    public whereDateNot(
        column: Stringable,
        operator: string,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDate(column, operator, value, boolean, true);
    }

    public orWhereDateNot(column: Stringable, operator: string, value: Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDateNot(column, operator, value, 'or');
    }

    public whereTime(
        column: Stringable,
        operator: string,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = `${value.getHours().toString().padStart(2, '0')}-${value
                .getMinutes()
                .toString()
                .padStart(2, '0')}-${value.getSeconds().toString().padStart(2, '0')}`;
        }

        return this.addDateBasedWhere('Time', column, operator, value, boolean, not);
    }

    public orWhereTime(column: Stringable, operator: string, value: Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereTime(column, operator, value, 'or');
    }

    public whereTimeNot(
        column: Stringable,
        operator: string,
        value: Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereTime(column, operator, value, boolean, true);
    }

    public orWhereTimeNot(column: Stringable, operator: string, value: Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereTimeNot(column, operator, value, 'or');
    }

    public whereDay(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.getDate();
        }

        if (!(value instanceof Expression)) {
            value = isNaN(Number(value)) ? '00' : Number(value).toString().padStart(2, '0');
        }

        return this.addDateBasedWhere('Day', column, operator, value, boolean, not);
    }

    public orWhereDay(column: Stringable, operator: string, value: number | Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDay(column, operator, value, 'or');
    }

    public whereDayNot(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDay(column, operator, value, boolean, true);
    }

    public orWhereDayNot(column: Stringable, operator: string, value: number | Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereDayNot(column, operator, value, 'or');
    }

    public whereMonth(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.getMonth() + 1;
        }

        if (!(value instanceof Expression)) {
            value = isNaN(Number(value)) ? '00' : Number(value).toString().padStart(2, '0');
        }

        return this.addDateBasedWhere('Month', column, operator, value, boolean, not);
    }

    public orWhereMonth(column: Stringable, operator: string, value: number | Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereMonth(column, operator, value, 'or');
    }

    public whereMonthNot(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereMonth(column, operator, value, boolean, true);
    }

    public orWhereMonthNot(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereMonthNot(column, operator, value, 'or');
    }

    public whereYear(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        value = this.flattenValue(value);

        if (value instanceof Date) {
            value = value.getFullYear();
        }

        if (!(value instanceof Expression)) {
            value = isNaN(Number(value)) ? '0000' : Number(value).toString().padStart(4, '0');
        }

        return this.addDateBasedWhere('Year', column, operator, value, boolean, not);
    }

    public orWhereYear(column: Stringable, operator: string, value: number | Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereYear(column, operator, value, 'or');
    }

    public whereYearNot(
        column: Stringable,
        operator: string,
        value: number | Stringable | Date | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereYear(column, operator, value, boolean, true);
    }

    public orWhereYearNot(column: Stringable, operator: string, value: number | Stringable | Date | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereYearNot(column, operator, value, 'or');
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

        if (!(value instanceof Expression)) {
            this.addBinding(value, 'where');
        }

        return this;
    }

    public whereNested(callback: QueryAbleCallback, boolean: ConditionBoolean = 'and', not = false): this {
        const query = this.forNestedWhere();
        callback(query);

        return this.addNestedWhereQuery(query, boolean, not);
    }

    public forNestedWhere(): BuilderContract {
        return this.newQuery().from(this.registry.from);
    }

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
        callback: QueryAbleCallback,
        boolean: ConditionBoolean,
        not: boolean
    ): this {
        const type = 'Sub';

        // Once we have the query instance we can simply execute it so it can add all
        // of the sub-select's conditions to itself, and then we can cache it off
        // in the array of where clauses for the "main" parent query instance.
        const query = this.forSubQuery();
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

    public whereExists(
        callback: BuilderContract | QueryAbleCallback,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        let query: BuilderContract;
        if (typeof callback === 'function') {
            query = this.forSubQuery();

            // Similar to the sub-select clause, we will create a new query instance so
            // the developer may cleanly specify the entire exists query and we will
            // compile the whole thing in the grammar and insert it into the SQL.
            callback(query);
        } else {
            query = callback;
        }

        return this.addWhereExistsQuery(query, boolean, not);
    }

    public orWhereExists(callback: BuilderContract | QueryAbleCallback, not = false): this {
        return this.whereExists(callback, 'or', not);
    }

    public whereNotExists(callback: BuilderContract | QueryAbleCallback, boolean: ConditionBoolean = 'and'): this {
        return this.whereExists(callback, boolean, true);
    }

    public orWhereNotExists(callback: BuilderContract | QueryAbleCallback): this {
        return this.orWhereExists(callback, true);
    }

    public addWhereExistsQuery(query: BuilderContract, boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'Exists';

        this.registry.wheres.push({ type, query, boolean, not });

        this.addBinding(query.getBindings(), 'where');

        return this;
    }

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

    public orWhereRowValues(columns: Stringable[], operator: string, values: Binding[]): this {
        return this.whereRowValues(columns, operator, values, 'or');
    }

    public whereJsonContains(
        column: Stringable,
        value: Binding[] | Binding,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'JsonContains';

        this.registry.wheres.push({ type, column, value: value, boolean, not });

        if (!(value instanceof Expression)) {
            this.addBinding(this.getGrammar().prepareBindingForJsonContains(value));
        }

        return this;
    }

    public orWhereJsonContains(column: Stringable, value: Binding[] | Binding): this {
        return this.whereJsonContains(column, value, 'or');
    }

    public whereJsonDoesntContain(column: Stringable, value: Binding[] | Binding, boolean: ConditionBoolean): this {
        return this.whereJsonContains(column, value, boolean, true);
    }

    public orWhereJsonDoesntContain(column: Stringable, value: Binding[] | Binding): this {
        return this.whereJsonDoesntContain(column, value, 'or');
    }

    public whereJsonContainsKey(column: Stringable, boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'JsonContainsKey';

        this.registry.wheres.push({ type, column, boolean, not });

        return this;
    }

    public orWhereJsonContainsKey(column: Stringable): this {
        return this.whereJsonContainsKey(column, 'or');
    }

    public whereJsonDoesntContainKey(column: Stringable, boolean: ConditionBoolean = 'and'): this {
        return this.whereJsonContainsKey(column, boolean, true);
    }

    public orWhereJsonDoesntContainKey(column: Stringable): this {
        return this.whereJsonDoesntContainKey(column, 'or');
    }

    public whereJsonLength(
        column: Stringable,
        operator: string,
        value: number | Expression | null = null,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'JsonLength';

        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        this.registry.wheres.push({ type, column, operator, value, boolean, not });

        if (!(value instanceof Expression)) {
            this.addBinding(Number(this.flattenValue(value)));
        }

        return this;
    }

    public orWhereJsonLength(column: Stringable, operator: string, value: number | Expression | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLength(column, operator, value, 'or');
    }

    public whereJsonLengthNot(
        column: Stringable,
        operator: string,
        value: number | Expression | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLength(column, operator, value, boolean, true);
    }

    public orWhereJsonLengthNot(column: Stringable, operator: string, value: number | Expression | null = null): this {
        [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

        return this.whereJsonLengthNot(column, operator, value, 'or');
    }

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

    public whereFullText(
        columns: Stringable | Stringable[],
        value: string,
        options: FullTextOptions = {},
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'Fulltext';

        columns = Array.isArray(columns) ? columns : [columns];

        this.registry.wheres.push({ type, columns, value, options, boolean, not });

        this.addBinding(value);

        return this;
    }

    public orWhereFullText(columns: Stringable | Stringable[], value: string, options: FullTextOptions = {}): this {
        return this.whereFullText(columns, value, options, 'or');
    }

    public whereFullTextNot(
        columns: Stringable | Stringable[],
        value: string,
        options: FullTextOptions = {},
        boolean: ConditionBoolean = 'and'
    ): this {
        return this.whereFullText(columns, value, options, boolean, true);
    }

    public orWhereFullTextNot(columns: Stringable | Stringable[], value: string, options: FullTextOptions = {}): this {
        return this.whereFullTextNot(columns, value, options, 'or');
    }

    public groupBy(...groups: Stringable[][] | Stringable[]): this {
        for (const group of groups) {
            this.registry.groups.push(...(Array.isArray(group) ? group : [group]));
        }

        return this;
    }

    public groupByRaw(sql: string, bindings: Binding[] = []): this {
        this.registry.groups.push(new Expression(sql));

        this.addBinding(bindings, 'groupBy');

        return this;
    }

    public having(column: Stringable | QueryAbleCallback): this;
    public having(column: Stringable | QueryAbleCallback, value: number | Stringable): this;
    public having(column: Stringable | QueryAbleCallback, operator: string, value: number | Stringable): this;
    public having(
        column: Stringable | QueryAbleCallback,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean,
        not?: boolean
    ): this;
    public having(
        column: Stringable | QueryAbleCallback,
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

        if (typeof column === 'function' && operator === null) {
            return this.havingNested(column, boolean);
        }

        if (typeof column === 'function') {
            throw new TypeError('Value must be null when column is a callback.');
        }

        // If the given operator is not found in the list of valid operators we will
        // assume that the developer is just short-cutting the '=' operators and
        // we will set the operators to '=' and set the values appropriately.
        if (this.invalidOperator(operator)) {
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

        if (!(val instanceof Expression)) {
            this.addBinding(this.flattenValue(val), 'having');
        }

        return this;
    }

    public orHaving(column: Stringable | QueryAbleCallback): this;
    public orHaving(column: Stringable | QueryAbleCallback, value: number | Stringable): this;
    public orHaving(column: Stringable | QueryAbleCallback, operator: string, value: number | Stringable): this;
    public orHaving(
        column: Stringable | QueryAbleCallback,
        operatorOrValue: number | Stringable | null = null,
        value: number | Stringable | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.having(column, operatorOrValue, value, 'or');
    }

    public havingNot(column: Stringable | QueryAbleCallback): this;
    public havingNot(column: Stringable | QueryAbleCallback, value: number | Stringable): this;
    public havingNot(column: Stringable | QueryAbleCallback, operator: string, value: number | Stringable): this;
    public havingNot(
        column: Stringable | QueryAbleCallback,
        operatorOrValue?: Stringable | number | null,
        value?: Stringable | number | null,
        boolean?: ConditionBoolean
    ): this;
    public havingNot(
        column: Stringable | QueryAbleCallback,
        operatorOrValue: Stringable | number | null = null,
        value: Stringable | number | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.having(column, operatorOrValue, value, boolean, true);
    }

    public orHavingNot(column: Stringable | QueryAbleCallback): this;
    public orHavingNot(column: Stringable | QueryAbleCallback, value: number | Stringable): this;
    public orHavingNot(column: Stringable | QueryAbleCallback, operator: string, value: number | Stringable): this;
    public orHavingNot(
        column: Stringable | QueryAbleCallback,
        operatorOrValue: number | Stringable | null = null,
        value: number | Stringable | null = null
    ): this {
        [value, operatorOrValue] = this.prepareValueAndOperator(value, operatorOrValue, arguments.length === 2);
        return this.havingNot(column, operatorOrValue, value, 'or');
    }

    public havingNested(callback: QueryAbleCallback, boolean: ConditionBoolean = 'and', not = false): this {
        const query = this.forNestedWhere();
        callback(query);

        return this.addNestedHavingQuery(query, boolean, not);
    }

    public addNestedHavingQuery(query: BuilderContract, boolean: ConditionBoolean = 'and', not = false): this {
        if (query.getRegistry().havings.length > 0) {
            const type = 'Nested';

            this.registry.havings.push({ type, query, boolean, not });

            this.addBinding(query.getRawBindings().having, 'having');
        }

        return this;
    }

    public havingNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and', not = false): this {
        const type = 'Null';
        columns = Array.isArray(columns) ? columns : [columns];

        for (const column of columns) {
            this.registry.havings.push({ type, column, boolean, not });
        }

        return this;
    }

    public orHavingNull(columns: Stringable | Stringable[]): this {
        return this.havingNull(columns, 'or');
    }

    public havingNotNull(columns: Stringable | Stringable[], boolean: ConditionBoolean = 'and'): this {
        return this.havingNull(columns, boolean, true);
    }

    public orHavingNotNull(columns: Stringable | Stringable[]): this {
        return this.havingNotNull(columns, 'or');
    }

    public havingBetween(
        column: Stringable,
        values: BetweenTuple,
        boolean: ConditionBoolean = 'and',
        not = false
    ): this {
        const type = 'Between';

        this.registry.havings.push({ type, column, values, boolean, not });

        this.addBinding(this.cleanBindings(values.flat(Infinity)).slice(0, 2), 'having');

        return this;
    }

    public orHavingBetween(column: Stringable, values: BetweenTuple): this {
        return this.whereBetween(column, values, 'or');
    }

    public havingBetweenNot(column: Stringable, values: BetweenTuple, boolean: ConditionBoolean = 'and'): this {
        return this.whereBetween(column, values, boolean, true);
    }

    public orHavingBetweenNot(column: Stringable, values: BetweenTuple): this {
        return this.havingBetweenNot(column, values, 'or');
    }

    public havingRaw(sql: string, bindings: Binding[] = [], boolean: ConditionBoolean = 'and'): this {
        const type = 'Raw';

        this.registry.havings.push({ type, sql, boolean });

        this.addBinding(bindings, 'having');

        return this;
    }

    public orHavingRaw(sql: string, bindings: Binding[] = []): this {
        return this.havingRaw(sql, bindings, 'or');
    }

    public orderBy(column: SubQuery, direction: OrderDirection = 'asc'): this {
        if (this.isQueryable(column)) {
            const [query, bindings] = this.createSub(column);

            column = new Expression(`(${query})`);

            this.addBinding(bindings, this.registry.unions.length > 0 ? 'unionOrder' : 'order');
        }

        direction = direction.toLowerCase() as Lowercase<OrderDirection>;

        if (!['desc', 'asc'].includes(direction)) {
            throw new TypeError('Order direction must be "asc" or "desc".');
        }

        this.registry[this.registry.unions.length > 0 ? 'unionOrders' : 'orders'].push({
            column: column as Stringable,
            direction: direction
        });

        return this;
    }

    public orderByDesc(column: SubQuery): this {
        return this.orderBy(column, 'desc');
    }

    public latest(column: SubQuery = 'created_at'): this {
        return this.orderBy(column, 'desc');
    }

    public oldest(column: SubQuery = 'created_at'): this {
        return this.orderBy(column, 'asc');
    }

    public inRandomOrder(seed: string | number = ''): this {
        return this.orderByRaw(this.getGrammar().compileRandom(seed));
    }

    public orderByRaw(sql: string, bindings: Binding[] = []): this {
        const type = 'Raw';

        this.registry[this.registry.unions.length > 0 ? 'unionOrders' : 'orders'].push({ type, sql });

        this.addBinding(bindings, this.registry.unions.length > 0 ? 'unionOrder' : 'order');

        return this;
    }

    public skip(value: number): this {
        return this.offset(value);
    }

    public offset(value: number): this {
        this.registry[this.registry.unions.length > 0 ? 'unionOffset' : 'offset'] = Math.max(0, value);

        return this;
    }

    public take(value: number): this {
        return this.limit(value);
    }

    public limit(value: number): this {
        this.registry[this.registry.unions.length > 0 ? 'unionLimit' : 'limit'] = value;

        return this;
    }

    public forPage(page: number, perPage = 15): this {
        return this.offset((page - 1) * perPage).limit(perPage);
    }

    public forPageBeforeId(perPage = 15, lastId: number | null = null, column: Stringable = 'id'): this {
        this.registry.orders = this.removeExistingOrdersFor(column);

        if (lastId !== null) {
            this.where(column, '<', lastId);
        }

        return this.orderBy(column, 'desc').limit(perPage);
    }

    public forPageAfterId(perPage = 15, lastId: number | null = null, column: Stringable = 'id'): this {
        this.registry.orders = this.removeExistingOrdersFor(column);

        if (lastId !== null) {
            this.where(column, '>', lastId);
        }

        return this.orderBy(column, 'asc').limit(perPage);
    }

    public reorder(column: SubQuery | null = null, direction: OrderDirection = 'asc'): this {
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
                return order.column.toString() !== column.toString();
            }
            return true;
        });
    }

    public union(query: BuilderContract | QueryAbleCallback, all = false): this {
        if (typeof query === 'function') {
            const callback = query;
            query = this.newQuery();
            callback(query);
        }

        this.registry.unions.push({ query, all });

        this.addBinding(query.getBindings(), 'union');

        return this;
    }

    public unionAll(query: BuilderContract | QueryAbleCallback): this {
        return this.union(query, true);
    }

    public lock(value: string | boolean = true): this {
        this.registry.lock = value;

        if (this.registry.lock !== null) {
            this.useWritePdo();
        }

        return this;
    }

    public lockForUpdate(): this {
        return this.lock(true);
    }

    public sharedLock(): this {
        return this.lock(false);
    }

    public beforeQuery(callback: QueryAbleCallback): this {
        this.registry.beforeQueryCallbacks.push(callback);

        return this;
    }

    public applyBeforeQueryCallbacks(): void {
        for (const callback of this.registry.beforeQueryCallbacks) {
            callback(this);
        }

        this.registry.beforeQueryCallbacks = [];
    }

    public toSql(): string {
        this.applyBeforeQueryCallbacks();

        return this.getGrammar().compileSelect(this);
    }

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

    public async chunkMap<T>(callback: (item: T) => Promise<T> | T, count = 1000): Promise<Collection<T>> {
        const collection = new Collection<T>();

        this.chunk<T>(count, async items => {
            for (const item of items.all()) {
                collection.push(await callback(item));
            }
        });

        return collection;
    }

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
    public async chunkById<T>(
        count: number,
        callback: (items: Collection<T>, page: number) => Promise<false | void> | false | void,
        column: Stringable | null = null,
        alias: Stringable | null = null
    ): Promise<boolean> {
        column = column === null ? this.defaultKeyName() : column;
        alias = (alias === null ? column : alias).toString();

        let lastId: number | null = null;
        let page = 1;
        let countResults = 0;

        do {
            const clone = this.clone();

            // We'll execute the query for the given page and get the results. If there are
            // no results we can just break and return from here. When there are results
            // we will call the callback with the current chunk of these results here.
            const results = (await clone.forPageAfterId(count, lastId, column).get()) as Collection<T>;

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

            lastId = (results.last() as any)[alias] as number | null;

            if (lastId === null) {
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

    public lazyById<T>(
        chunkSize = 1000,
        column: Stringable | null = null,
        alias: string | null = null
    ): LazyCollection<T> {
        return this.orderedLazyById<T>(chunkSize, column, alias);
    }

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
        alias = (alias === null ? column : alias).toString();

        return new LazyCollection<T>(
            async function* (this: BuilderContract) {
                let lastId: number | null = null;

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

                    lastId = (results.last() as any)[alias as string] as number | null;
                }
            }.bind(this)
        );
    }

    public async first<T>(columns: Stringable | Stringable[] = ['*']): Promise<T | null> {
        return (await this.take(1).get<T>(columns)).first();
    }

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

    public async find<T>(id: string | number | bigint, columns: Stringable | Stringable[] = ['*']): Promise<T | null> {
        return this.where('id', '=', id).first<T>(columns);
    }

    public async findOr<T>(id: string | number | bigint): Promise<T | null>;
    public async findOr<T, U>(id: string | number | bigint, callback: () => U): Promise<T | U>;
    public async findOr<T, U>(id: string | number | bigint, columns: Stringable | Stringable[]): Promise<T | U>;
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

    public async value<T>(column: Stringable): Promise<T | null> {
        const result = await this.first<{ [key: string]: T }>([column]);

        return result !== null && Object.keys(result).length > 0 ? result[Object.keys(result)[0]] : null;
    }

    public async rawValue<T>(expression: string, bindings: Binding[] = []): Promise<T | null> {
        const result = await this.selectRaw(expression, bindings).first<{ [key: string]: T }>();

        return result !== null && Object.keys(result).length > 0 ? result[Object.keys(result)[0]] : null;
    }

    public async soleValue<T>(column: Stringable): Promise<T> {
        const result = await this.sole<{ [key: string]: T }>([column]);

        return result[Object.keys(result)[0]];
    }

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
        const separator = column.toString().toLowerCase().includes(' as ') ? ' as ' : '\\.';
        const regex = new RegExp(separator, 'gi');

        return column.toString().split(regex).pop() as string;
    }

    public async implode<T>(column: Stringable, glue = ''): Promise<string> {
        return (await this.pluck<T>(column)).implode(glue);
    }

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

    public async doesntExist(): Promise<boolean> {
        return !this.exists();
    }

    public async existsOr<T>(callback: () => T): Promise<true | T> {
        return (await this.exists()) ? true : callback();
    }

    public async doesntExistOr<T>(callback: () => T): Promise<true | T> {
        return (await this.doesntExist()) ? true : callback();
    }

    public async count(columns: Stringable | Stringable[] = '*'): Promise<number | bigint> {
        const res = await this.aggregate('count', Array.isArray(columns) ? columns : [columns]);
        return res === null
            ? 0
            : BigInt(res) > Number.MAX_SAFE_INTEGER || BigInt(res) < Number.MIN_SAFE_INTEGER
            ? BigInt(res)
            : Number(res);
    }

    public async min(column: Stringable): Promise<string | number | bigint | null> {
        return this.aggregate('min', [column]);
    }

    public async max(column: Stringable): Promise<string | number | bigint | null> {
        return this.aggregate('max', [column]);
    }

    public async sum(column: Stringable): Promise<string | number | bigint> {
        const res = await this.aggregate('sum', [column]);
        return res === null ? 0 : res;
    }

    public async avg(column: Stringable): Promise<string | number | bigint | null> {
        return this.aggregate('avg', [column]);
    }

    public async average(column: Stringable): Promise<string | number | bigint | null> {
        return this.avg(column);
    }

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

    public async insertGetId<T extends number | bigint | string>(
        values: RowValues,
        sequence: Stringable | null = null
    ): Promise<T | null> {
        this.applyBeforeQueryCallbacks();

        return this.getConnection().insertGetId(
            this.getGrammar().compileInsertGetId(this, values, sequence),
            this.cleanBindings(Object.values(values)),
            sequence
        );
    }

    public async insertUsing(columns: Stringable[], query: QueryAble): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const [sql, bindings] = this.createSub(query);

        return await this.getConnection().affectingStatement(
            this.getGrammar().compileInsertUsing(this, columns, sql),
            this.cleanBindings(bindings)
        );
    }

    public async update(values: RowValues): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const sql = this.getGrammar().compileUpdate(this, values);

        return await this.getConnection().update(
            sql,
            this.cleanBindings(this.getGrammar().prepareBindingsForUpdate(this.registry.bindings, values))
        );
    }

    public async updateFrom(values: RowValues): Promise<number> {
        this.applyBeforeQueryCallbacks();

        const sql = this.getGrammar().compileUpdateFrom(this, values);

        return await this.getConnection().update(
            sql,
            this.cleanBindings(this.getGrammar().prepareBindingsForUpdateFrom(this.registry.bindings, values))
        );
    }

    public async updateOrInsert(attributes: RowValues, values: RowValues = {}): Promise<boolean> {
        if (
            !this.where(Object.keys(attributes).map((key: keyof RowValues & string) => [key, attributes[key]])).exists()
        ) {
            return this.insert(Object.assign(attributes, values));
        }

        if (values.length === 0) {
            return true;
        }

        return Boolean(this.limit(1).update(values));
    }

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

    public async increment(column: string, amount = 1, extra: RowValues = {}): Promise<number> {
        return this.incrementEach({ [column]: amount }, extra);
    }

    public async incrementEach(columns: NumericValues, extra: RowValues = {}): Promise<number> {
        const processed: { [key: string]: Stringable } = {};
        for (const column in columns) {
            processed[column] = this.raw(`${this.getGrammar().wrap(column)} + ${columns[column].toString()}`);
        }

        return this.update(Object.assign(processed, extra));
    }

    public async decrement(column: string, amount = 1, extra: RowValues = {}): Promise<number> {
        return this.decrementEach({ [column]: amount }, extra);
    }

    public async decrementEach(columns: NumericValues, extra: RowValues = {}): Promise<number> {
        const processed: { [key: string]: Stringable } = {};
        for (const column in columns) {
            processed[column] = this.raw(`${this.getGrammar().wrap(column)} - ${columns[column].toString()}`);
        }

        return this.update(Object.assign(processed, extra));
    }

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

    public async truncate(): Promise<void> {
        this.applyBeforeQueryCallbacks();

        const truncates = this.getGrammar().compileTruncate(this);

        for (const sql in truncates) {
            this.getConnection().statement(sql, truncates[sql]);
        }
    }

    public async explain(): Promise<Collection<string>> {
        const sql = this.toSql();
        const bindings = this.getBindings();

        const explanation = await this.getConnection().select<string>(`EXPLAIN ${sql}`, bindings);

        return new Collection(explanation);
    }

    public tap(callback: QueryAbleCallback): this {
        callback(this);

        return this;
    }

    public when<T = boolean>(
        value: BooleanCallback | T,
        callback: (query: BuilderContract, value: T) => void | this,
        defaultCallback: null | ((query: BuilderContract, value: T) => void | this) = null
    ): this {
        value = (typeof value === 'function' ? (value as BooleanCallback)(this) : value) as T;

        if (Boolean(value)) {
            return callback(this, value) ?? this;
        } else if (defaultCallback !== null) {
            return defaultCallback(this, value) ?? this;
        }

        return this;
    }

    public unless<T = boolean>(
        value: BooleanCallback | T,
        callback: (query: BuilderContract, value: T) => void | this,
        defaultCallback: null | ((query: BuilderContract, value: T) => void | this) = null
    ): this {
        value = (typeof value === 'function' ? (value as BooleanCallback)(this) : value) as T;

        if (!Boolean(value)) {
            return callback(this, value) ?? this;
        } else if (defaultCallback !== null) {
            return defaultCallback(this, value) ?? this;
        }

        return this;
    }

    public abstract newQuery(): BuilderContract;

    /**
     * Create a new query instance for a sub-query.
     */
    protected forSubQuery(): BuilderContract {
        return this.newQuery();
    }

    public raw(value: string): Expression {
        return raw(value);
    }

    public getBindings(): Binding[] {
        return Object.values(this.registry.bindings).flat(Infinity);
    }

    public getRawBindings(): BindingTypes {
        return this.registry.bindings;
    }

    public setBindings(bindings: Binding[], type: keyof BindingTypes = 'where'): this {
        if (!(type in this.registry.bindings)) {
            throw new Error(`Invalid binding type: ${type}.`);
        }

        this.registry.bindings[type] = bindings.map(binding => this.castBinding(binding));

        return this;
    }

    public addBinding(value: Binding | Binding[], type: keyof BindingTypes = 'where'): this {
        if (!(type in this.registry.bindings)) {
            throw new Error(`Invalid binding type: ${type}.`);
        }

        value = Array.isArray(value) ? value : [value];

        this.registry.bindings[type].push(...value.map(binding => this.castBinding(binding)));

        return this;
    }

    public castBinding(value: Binding): Binding {
        return value;
    }

    public mergeBindings(query: BuilderContract): this {
        this.registry.bindings = deepmerge(this.registry.bindings, query.getRegistry().bindings);

        return this;
    }

    public cleanBindings(bindings: Binding[]): NotExpressionBinding[] {
        return bindings
            .filter((binding: Binding) => typeof binding !== 'object' || !(binding instanceof Expression))
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

    public getConnection(): ConnectionSessionI {
        return this.connection;
    }

    public getProcessor(): ProcessorI {
        return this.processor ?? this.connection.getPostProcessor();
    }

    public getGrammar(): GrammarI {
        return this.grammar ?? this.connection.getQueryGrammar();
    }

    public useWritePdo(): this {
        this.registry.useWritePdo = true;

        return this;
    }

    /**
     * Determine if the value is a query builder instance or a Closure.
     */
    protected isQueryable(value: any): boolean {
        return value instanceof BuilderContract || typeof value === 'function';
    }

    public abstract clone(): BuilderContract;

    public abstract cloneWithout(properties: (keyof Registry)[]): BuilderContract;

    public abstract cloneWithoutBindings(except: (keyof BindingTypes)[]): BuilderContract;
}

export default BaseBuilder;
