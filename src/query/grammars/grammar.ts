/* eslint-disable @typescript-eslint/no-unused-vars */

import set from 'set-value';
import BaseGrammar from '../../grammar';
import { Binding, BindingExclude, BindingExcludeObject, RowValues, Stringable } from '../../types/query/builder';
import GrammarI from '../../types/query/grammar';
import JoinClauseI from '../../types/query/join-clause';
import {
    Aggregate,
    BindingTypes,
    Having,
    HavingBasic,
    HavingBetween,
    HavingNested,
    HavingNull,
    HavingRaw,
    Order,
    Union,
    Where,
    WhereBasic,
    WhereBetween,
    WhereBetweenColumns,
    WhereBoolean,
    WhereColumn,
    WhereContains,
    WhereDateTime,
    WhereExists,
    WhereIn,
    WhereInRaw,
    WhereKeyContains,
    WhereLength,
    WhereMultiColumn,
    WhereNested,
    WhereNull,
    WhereRaw,
    WhereSub,
    whereFulltext
} from '../../types/query/registry';
import {
    escapeQuoteForSql,
    hasInvalidUTF8Characters,
    hasNullBytesCharacters,
    isTypedBinding,
    isValidBinding,
    merge,
    stringifyReplacer
} from '../../utils';
import BuilderContract from '../builder-contract';
import ExpressionContract from '../expression-contract';
import IndexHint from '../index-hint';
import JoinClause from '../join-clause';

class Grammar extends BaseGrammar implements GrammarI {
    /**
     * The grammar specific operators.
     */
    protected operators: string[] = [];

    /**
     * The grammar specific bitwise operators.
     */
    protected bitwiseOperators: string[] = [];

    /**
     * The components that make up a select clause.
     */
    protected selectComponents: string[] = [
        'aggregate',
        'columns',
        'from',
        'indexHint',
        'joins',
        'wheres',
        'groups',
        'havings',
        'orders',
        'limit',
        'offset',
        'lock'
    ];

    /**
     * Compile a select query into SQL.
     */
    public compileSelect(query: BuilderContract): string {
        const registry = query.getRegistry();
        if ((registry.unions.length > 0 || registry.havings.length > 0) && registry.aggregate !== null) {
            return this.compileUnionAggregate(query);
        }

        // If the query does not have any columns set, we'll set the columns to the
        // * character to just get all of the columns from the database. Then we
        // can build the query and concatenate all the pieces together as one.
        const original = registry.columns;

        if (registry.columns === null) {
            registry.columns = ['*'];
            query.setRegistry(registry);
        }

        // To compile the query, we'll spin through each component of the query and
        // see if that component exists. If it does we'll just call the compiler
        // function for the component which is responsible for making the SQL.
        let sql = this.concatenate(this.compileComponents(query)).trim();

        if (registry.unions.length > 0) {
            sql = `${this.wrapUnion(sql)} ${this.compileUnions(query)}`;
        }

        registry.columns = original;
        query.setRegistry(registry);

        return sql;
    }

    /**
     * Compile the components necessary for a select clause.
     */
    protected compileComponents(query: BuilderContract): string[] {
        const sqls: string[] = [];

        const registry = query.getRegistry();

        for (const key of this.selectComponents) {
            switch (key) {
                case 'aggregate':
                    if (registry.aggregate !== null) {
                        sqls.push(this.compileAggregate(query, registry.aggregate));
                    }
                    break;
                case 'columns':
                    if (registry.columns !== null && registry.columns.length > 0) {
                        sqls.push(this.compileColumns(query, registry.columns));
                    }
                    break;
                case 'from':
                    if (registry.from !== '') {
                        sqls.push(this.compileFrom(query, registry.from));
                    }
                    break;
                case 'indexHint':
                    if (registry.indexHint !== null) {
                        sqls.push(this.compileIndexHint(query, registry.indexHint));
                    }
                    break;
                case 'joins':
                    if (registry.joins.length > 0) {
                        sqls.push(this.compileJoins(query, registry.joins));
                    }
                    break;
                case 'wheres':
                    if (registry.wheres.length > 0) {
                        sqls.push(this.compileWheres(query));
                    }
                    break;
                case 'groups':
                    if (registry.groups.length > 0) {
                        sqls.push(this.compileGroups(query, registry.groups));
                    }
                    break;
                case 'havings':
                    if (registry.havings.length > 0) {
                        sqls.push(this.compileHavings(query));
                    }
                    break;
                case 'orders':
                    if (registry.orders.length > 0) {
                        sqls.push(this.compileOrders(query, registry.orders));
                    }
                    break;
                case 'limit':
                    if (registry.limit !== null) {
                        sqls.push(this.compileLimit(query, registry.limit));
                    }
                    break;
                case 'offset':
                    if (registry.offset !== null) {
                        sqls.push(this.compileOffset(query, registry.offset));
                    }
                    break;
                case 'lock':
                    if (registry.lock !== null) {
                        sqls.push(this.compileLock(query, registry.lock));
                    }
                    break;
            }
        }

        return sqls.filter(Boolean);
    }

    /**
     * Compile an aggregated select clause.
     */
    protected compileAggregate(query: BuilderContract, aggregate: Aggregate): string {
        let column = this.columnize(aggregate.columns);
        const distinct = query.getRegistry().distinct;

        // If the query has a "distinct" constraint and we're not asking for all columns
        // we need to prepend "distinct" onto the column name so that the query takes
        // it into account when it performs the aggregating operations on the data.
        if (Array.isArray(distinct)) {
            column = `distinct ${this.columnize(distinct)}`;
        } else if (distinct && column !== '*') {
            column = `distinct ${column}`;
        }

        return `select ${aggregate.fnName}(${column}) as aggregate`;
    }

    /**
     * Compile the "select *" portion of the query.
     */
    protected compileColumns(query: BuilderContract, columns: Stringable[]): string {
        // If the query is actually performing an aggregating select, we will let that
        // compiler handle the building of the select clauses, as it will need some
        // more syntax that is best handled by that function to keep things neat.
        if (query.getRegistry().aggregate !== null) {
            return '';
        }

        const select = query.getRegistry().distinct !== false ? 'select distinct' : 'select';

        return `${select} ${this.columnize(columns)}`;
    }

    /**
     * Compile the "from" portion of the query.
     */
    protected compileFrom(_query: BuilderContract, table: Stringable): string {
        return `from ${this.wrapTable(table)}`;
    }

    /**
     * Compile the index hints for the query.
     */
    protected compileIndexHint(_query: BuilderContract, _indexHint: IndexHint): string {
        throw new Error('This database engine does not support index hints.');
    }

    /**
     * Compile the "join" portions of the query.
     */
    protected compileJoins(query: BuilderContract, joins: JoinClauseI[]): string {
        return joins
            .map((join: JoinClauseI) => {
                const table = this.wrapTable(join.table);
                const nestedJoins =
                    join.getRegistry().joins.length === 0
                        ? ''
                        : ` ${this.compileJoins(query, join.getRegistry().joins)}`;
                const tableAndNestedJoins = join.getRegistry().joins.length === 0 ? table : `(${table}${nestedJoins})`;
                return `${join.type} join ${tableAndNestedJoins} ${this.compileWheres(join)}`.trim();
            })
            .join(' ');
    }

    /**
     * Compile the "where" portions of the query.
     */
    public compileWheres(query: BuilderContract): string {
        // Each type of where clause has its own compiler function, which is responsible
        // for actually creating the where clauses SQL. This helps keep the code nice
        // and maintainable since each clause has a very small method that it uses.
        if (query.getRegistry().wheres.length === 0) {
            return '';
        }

        // If we actually have some where clauses, we will strip off the first boolean
        // operator, which is added by the query builders for convenience so we can
        // avoid checking for the first clauses in each of the compilers methods.
        const sqls = this.compileWheresToArray(query);

        return this.concatenateWhereClauses(query, sqls);
    }

    /**
     * Get an array of all the where clauses for the query.
     */
    protected compileWheresToArray(query: BuilderContract): string[] {
        return query.getRegistry().wheres.map((where: Where) => {
            return `${where.boolean} ${this.compileWhere(query, where)}`;
        });
    }

    protected compileWhere(query: BuilderContract, where: Where): string {
        switch (where.type) {
            case 'Raw':
                return this.compileWhereRaw(query, where as WhereRaw);
            case 'Bitwise':
                return this.compileWhereBitwise(query, where as WhereBasic);
            case 'In':
                return this.compileWhereIn(query, where as WhereIn);
            case 'InRaw':
                return this.compileWhereInRaw(query, where as WhereInRaw);
            case 'Null':
                return this.compileWhereNull(query, where as WhereNull);
            case 'Between':
                return this.compileWhereBetween(query, where as WhereBetween);
            case 'BetweenColumns':
                return this.compileWhereBetweenColumns(query, where as WhereBetweenColumns);
            case 'Date':
                return this.compileWhereDate(query, where as WhereDateTime);
            case 'Time':
                return this.compileWhereTime(query, where as WhereDateTime);
            case 'Day':
                return this.compileWhereDay(query, where as WhereDateTime);
            case 'Month':
                return this.compileWhereMonth(query, where as WhereDateTime);
            case 'Year':
                return this.compileWhereYear(query, where as WhereDateTime);
            case 'Column':
                return this.compileWhereColumn(query, where as WhereColumn);
            case 'Nested':
                return this.compileWhereNested(query, where as WhereNested);
            case 'Sub':
                return this.compileWhereSub(query, where as WhereSub);
            case 'Exists':
                return this.compileWhereExists(query, where as WhereExists);
            case 'RowValues':
                return this.compileWhereRowValues(query, where as WhereMultiColumn);
            case 'JsonBoolean':
                return this.compileWhereJsonBoolean(query, where as WhereBoolean);
            case 'JsonContains':
                return this.compileWhereJsonContains(query, where as WhereContains);
            case 'JsonContainsKey':
                return this.compileWhereJsonContainsKey(query, where as WhereKeyContains);
            case 'JsonLength':
                return this.compileWhereJsonLength(query, where as WhereLength);
            case 'Fulltext':
                return this.compilewhereFulltext(query, where as whereFulltext);
            default:
                return this.compileWhereBasic(query, where as WhereBasic);
        }
    }

    /**
     * Format the where clause statements into one string.
     */
    protected concatenateWhereClauses(query: BuilderContract, sqls: string[]): string {
        const conjunction = query instanceof JoinClause ? 'on' : 'where';

        return `${conjunction} ${this.removeLeadingBoolean(sqls.join(' '))}`;
    }

    /**
     * Compile a basic where clause.
     */
    protected compileWhereBasic(_query: BuilderContract, where: WhereBasic): string {
        const value = this.parameter(where.value);
        const not = where.not ? 'not ' : '';

        const operator = where.operator.replace(/\?/g, '??');

        return `${not}${this.wrap(where.column)} ${operator} ${value}`;
    }

    /**
     * Compile a raw where clause.
     */
    protected compileWhereRaw(_query: BuilderContract, where: WhereRaw): string {
        return where.sql;
    }

    /**
     * Compile a bitwise operator where clause.
     */
    protected compileWhereBitwise(query: BuilderContract, where: WhereBasic): string {
        return this.compileWhereBasic(query, where);
    }

    /**
     * Compile a "where in" clause.
     */
    protected compileWhereIn(_query: BuilderContract, where: WhereIn): string {
        if (where.values.length > 0) {
            const not = where.not ? 'not ' : '';
            return `${this.wrap(where.column)} ${not}in (${this.parameterize(where.values)})`;
        }

        return where.not ? '1 = 1' : '0 = 1';
    }

    /**
     * Compile a "where in raw" clause.
     *
     * For safety, whereIntegerInRaw ensures this method is only used with integer values.
     */
    protected compileWhereInRaw(_query: BuilderContract, where: WhereInRaw): string {
        if (where.values.length > 0) {
            const not = where.not ? 'not ' : '';
            return `${this.wrap(where.column)} ${not}in (${where.values.join(', ')})`;
        }

        return where.not ? '1 = 1' : '0 = 1';
    }

    /**
     * Compile a "where null" clause.
     */
    protected compileWhereNull(_query: BuilderContract, where: WhereNull): string {
        const isNull = where.not ? 'is not null' : 'is null';
        return `${this.wrap(where.column)} ${isNull}`;
    }

    /**
     * Compile a "between" where clause.
     */
    protected compileWhereBetween(_query: BuilderContract, where: WhereBetween): string {
        const between = where.not ? 'not between' : 'between';

        const min = this.parameter(where.values[0]);
        const max = this.parameter(where.values[1]);

        return `${this.wrap(where.column)} ${between} ${min} and ${max}`;
    }

    /**
     * Compile a "between" where clause.
     */
    protected compileWhereBetweenColumns(_query: BuilderContract, where: WhereBetweenColumns): string {
        const between = where.not ? 'not between' : 'between';

        const min = this.wrap(where.values[0]);
        const max = this.wrap(where.values[1]);

        return `${this.wrap(where.column)} ${between} ${min} and ${max}`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected compileWhereDate(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('date', query, where);
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('time', query, where);
    }

    /**
     * Compile a "where day" clause.
     */
    protected compileWhereDay(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('day', query, where);
    }

    /**
     * Compile a "where month" clause.
     */
    protected compileWhereMonth(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('month', query, where);
    }

    /**
     * Compile a "where year" clause.
     */
    protected compileWhereYear(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('year', query, where);
    }

    /**
     * Compile a date based where clause.
     */
    protected dateBasedWhere(type: string, _query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);
        const not = where.not ? 'not ' : '';
        return `${not}${type}(${this.wrap(where.column)}) ${where.operator} ${value}`;
    }

    /**
     * Compile a where clause comparing two columns.
     */
    protected compileWhereColumn(_query: BuilderContract, where: WhereColumn): string {
        const not = where.not ? 'not ' : '';
        return `${not}${this.wrap(where.first)} ${where.operator} ${this.wrap(where.second)}`;
    }

    /**
     * Compile a nested where clause.
     */
    protected compileWhereNested(_query: BuilderContract, where: WhereNested): string {
        // Here we will calculate what portion of the string we need to remove. If this
        // is a join clause query, we need to remove the "on" portion of the SQL and
        // if it is a normal query we need to take the leading "where" of queries.
        const offset = where.query instanceof JoinClause ? 3 : 6;
        const wheres = this.compileWheres(where.query);
        const not = where.not ? 'not ' : '';
        return `${not}(${wheres.slice(offset)})`;
    }

    /**
     * Compile a where condition with a sub-select.
     */
    protected compileWhereSub(_query: BuilderContract, where: WhereSub): string {
        const select = this.compileSelect(where.query);
        const not = where.not ? 'not ' : '';
        return `${not}${this.wrap(where.column)} ${where.operator} (${select})`;
    }

    /**
     * Compile a where exists clause.
     */
    protected compileWhereExists(_query: BuilderContract, where: WhereExists): string {
        const not = where.not ? 'not ' : '';
        return `${not}exists (${this.compileSelect(where.query)})`;
    }

    /**
     * Compile a where row values condition.
     */
    protected compileWhereRowValues(_query: BuilderContract, where: WhereMultiColumn): string {
        const columns = this.columnize(where.columns);
        const values = this.parameterize(where.values);
        const not = where.not ? 'not ' : '';

        return `${not}(${columns}) ${where.operator} (${values})`;
    }

    /**
     * Compile a "where JSON boolean" clause.
     */
    protected compileWhereJsonBoolean(_query: BuilderContract, where: WhereBoolean): string {
        const column = this.wrapJsonBooleanSelector(where.column);
        const value = this.wrapJsonBooleanValue(this.parameter(where.value));
        const not = where.not ? 'not ' : '';

        return `${not}${column} ${where.operator} ${value}`;
    }

    /**
     * Compile a "where JSON contains" clause.
     */
    protected compileWhereJsonContains(_query: BuilderContract, where: WhereContains): string {
        const not = where.not ? 'not ' : '';

        return `${not}${this.compileJsonContains(where.column, this.parameter(where.value))}`;
    }

    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected compileJsonContains(_column: Stringable, _value: string): string {
        throw new Error('This database engine does not support JSON contains operations.');
    }

    /**
     * Prepare the binding for a "JSON contains" statement.
     */
    public prepareBindingForJsonContains(binding: Binding | Binding[]): Binding | Binding[] {
        return JSON.stringify(binding, stringifyReplacer(this));
    }

    /**
     * Compile a "where JSON contains key" clause.
     */
    protected compileWhereJsonContainsKey(_query: BuilderContract, where: WhereKeyContains): string {
        const not = where.not ? 'not ' : '';

        return `${not}${this.compileJsonContainsKey(where.column)}`;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected compileJsonContainsKey(_column: Stringable): string {
        throw new Error('This database engine does not support JSON contains key operations.');
    }

    /**
     * Compile a "where JSON length" clause.
     */
    protected compileWhereJsonLength(_query: BuilderContract, where: WhereLength): string {
        const not = where.not ? 'not ' : '';

        return `${not}${this.compileJsonLength(where.column, where.operator, this.parameter(where.value))}`;
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected compileJsonLength(_column: Stringable, _operator: string, _value: string): string {
        throw new Error('This database engine does not support JSON length operations.');
    }

    /**
     * Compile a "where fulltext" clause.
     */
    protected compilewhereFulltext(query: BuilderContract, where: whereFulltext): string {
        const not = where.not ? 'not ' : '';

        return `${not}${this.compileFulltext(query, where)}`;
    }

    /**
     * Compile a "fulltext" statement into SQL.
     */
    protected compileFulltext(_query: BuilderContract, _where: whereFulltext): string {
        throw new Error('This database engine does not support fulltext search operations.');
    }

    /**
     * Compile the "group by" portions of the query.
     */
    protected compileGroups(_query: BuilderContract, groups: Stringable[]): string {
        return `group by ${this.columnize(groups)}`;
    }

    /**
     * Compile the "having" portions of the query.
     */
    protected compileHavings(query: BuilderContract): string {
        return `having ${this.removeLeadingBoolean(
            query
                .getRegistry()
                .havings.map((having: Having) => {
                    return `${having.boolean} ${this.compileHaving(query, having)}`;
                })
                .join(' ')
        )}`;
    }

    /**
     * Compile a single having clause.
     */
    protected compileHaving(query: BuilderContract, having: Having): string {
        // If the having clause is "raw", we can just return the clause straight away
        // without doing any more processing on it. Otherwise, we will compile the
        // clause into SQL based on the components that make it up from builder.
        switch (having.type) {
            case 'Raw':
                return this.compileHavingRaw(query, having);
            case 'Between':
                return this.compileHavingBetween(query, having);
            case 'Null':
                return this.compileHavingNull(query, having);
            case 'Nested':
                return this.compileHavingNested(query, having);
            case 'Bitwise':
                return this.compileHavingBitwise(query, having);
            default:
                return this.compileHavingBasic(query, having);
        }
    }

    /**
     * Compile a basic having clause.
     */
    protected compileHavingBasic(_query: BuilderContract, having: HavingBasic): string {
        const column = this.wrap(having.column);
        const parameter = this.parameter(having.value);
        const not = having.not ? 'not ' : '';

        return `${not}${column} ${having.operator} ${parameter}`;
    }

    /**
     * Compile a having raw clause.
     */
    protected compileHavingRaw(_query: BuilderContract, having: HavingRaw): string {
        return having.sql;
    }

    /**
     * Compile a "between" having clause.
     */
    protected compileHavingBetween(_query: BuilderContract, having: HavingBetween): string {
        const between = having.not ? 'not between' : 'between';
        const column = this.wrap(having.column);
        const min = this.parameter(having.values[0]);
        const max = this.parameter(having.values[1]);

        return `${column} ${between} ${min} and ${max}`;
    }

    /**
     * Compile a having null clause.
     */
    protected compileHavingNull(_query: BuilderContract, having: HavingNull): string {
        const isNull = having.not ? 'is not null' : 'is null';
        const column = this.wrap(having.column);

        return `${column} ${isNull}`;
    }

    /**
     * Compile a nested having clause.
     */
    protected compileHavingNested(_query: BuilderContract, having: HavingNested): string {
        const havings = this.compileHavings(having.query);
        const not = having.not ? 'not ' : '';

        return `${not}(${havings.slice(7)})`;
    }

    /**
     * Compile a having clause involving a bit operator.
     */
    protected compileHavingBitwise(query: BuilderContract, having: HavingBasic): string {
        return this.compileHavingBasic(query, having);
    }

    /**
     * Compile the "order by" portions of the query.
     */
    protected compileOrders(query: BuilderContract, orders: Order[]): string {
        return `order by ${this.compileOrdersToArray(query, orders).join(', ')}`;
    }

    /**
     * Compile the query orders to an array.
     */
    protected compileOrdersToArray(_query: BuilderContract, orders: Order[]): string[] {
        return orders.map((order: Order) => {
            return 'sql' in order ? order.sql : `${this.wrap(order.column)} ${order.direction}`;
        });
    }

    /**
     * Compile the "limit" portions of the query.
     */
    protected compileLimit(_query: BuilderContract, limit: number): string {
        return `limit ${limit}`;
    }

    /**
     * Compile the "offset" portions of the query.
     */
    protected compileOffset(_query: BuilderContract, offset: number): string {
        return `offset ${offset}`;
    }

    /**
     * Compile the lock into SQL.
     */
    protected compileLock(_query: BuilderContract, value: boolean | string): string {
        return typeof value === 'string' ? value : '';
    }

    /**
     * Compile the "union" queries attached to the main query.
     */
    protected compileUnions(query: BuilderContract): string {
        let sql = '';

        const registry = query.getRegistry();

        for (const union of registry.unions) {
            sql += this.compileUnion(union);
        }

        if (registry.unionOrders.length > 0) {
            sql += ` ${this.compileOrders(query, registry.unionOrders)}`;
        }

        if (registry.unionLimit !== null) {
            sql += ` ${this.compileLimit(query, registry.unionLimit)}`;
        }

        if (registry.unionOffset !== null) {
            sql += ` ${this.compileOffset(query, registry.unionOffset)}`;
        }

        return sql.trimStart();
    }

    /**
     * Compile a single union statement.
     */
    protected compileUnion(union: Union): string {
        const conjunction = union.all ? ' union all ' : ' union ';

        return `${conjunction}${this.wrapUnion(union.query.toSql())}`;
    }

    /**
     * Wrap a union subquery in parentheses.
     */
    protected wrapUnion(sql: string): string {
        return `(${sql})`;
    }

    /**
     * Compile a union aggregate query into SQL.
     */
    protected compileUnionAggregate(query: BuilderContract): string {
        const registry = query.getRegistry();

        const sql = this.compileAggregate(query, registry.aggregate as Aggregate);

        registry.aggregate = null;

        query.setRegistry(registry);

        return `${sql} from (${this.compileSelect(query)}) as ${this.wrapTable('temp_table')}`;
    }

    /**
     * Compile the random statement into SQL.
     */
    public compileRandom(_seed: string | number): string {
        return 'RANDOM()';
    }

    /**
     * Compile an exists statement into SQL.
     */
    public compileExists(query: BuilderContract): string {
        const select = this.compileSelect(query);

        return `select exists(${select}) as ${this.wrap('exists')}`;
    }

    /**
     * Compile an insert statement into SQL.
     */
    public compileInsert(query: BuilderContract, values: RowValues[] | RowValues): string {
        // Essentially we will force every insert to be treated as a batch insert which
        // simply makes creating the SQL easier for us since we can utilize the same
        // basic routine regardless of an amount of records given to us to insert.
        const table = this.wrapTable(query.getRegistry().from);

        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            return `insert into ${table} default values`;
        }

        const processed: RowValues[] = !Array.isArray(values) ? [values] : values;

        const columns = this.columnize(Object.keys(processed[0]));

        // We need to build a list of parameter place-holders of values that are bound
        // to the query. Each insert should have the exact same number of parameter
        // bindings so we will loop through the record and parameterize them all.
        const parameters = processed
            .map(value => {
                return `(${this.parameterize(Object.values(value))})`;
            })
            .join(', ');

        return `insert into ${table} (${columns}) values ${parameters}`;
    }

    /**
     * Compile an insert ignore statement into SQL.
     */
    public compileInsertOrIgnore(_query: BuilderContract, _values: RowValues[] | RowValues): string {
        throw new Error('This database engine does not support inserting while ignoring errors.');
    }

    /**
     * Compile an insert and get ID statement into SQL.
     */
    public compileInsertGetId(query: BuilderContract, values: RowValues, _sequence: string | null): string {
        return this.compileInsert(query, values);
    }

    /**
     * Compile an insert statement using a subquery into SQL.
     */
    public compileInsertUsing(query: BuilderContract, columns: Stringable[], sql: string): string {
        const table = this.wrapTable(query.getRegistry().from);

        if (
            columns.length === 0 ||
            columns.filter(column => !['*'].includes(this.getValue(column).toString())).length === 0
        ) {
            return `insert into ${table} ${sql}`;
        }

        return `insert into ${table} (${this.columnize(columns)}) ${sql}`;
    }

    /**
     * Compile an update statement into SQL.
     */
    public compileUpdate(query: BuilderContract, values: RowValues): string {
        const table = this.wrapTable(query.getRegistry().from);

        const columns = this.compileUpdateColumns(query, values);

        const where = this.compileWheres(query);

        return (
            query.getRegistry().joins.length > 0
                ? this.compileUpdateWithJoins(query, table, columns, where)
                : this.compileUpdateWithoutJoins(query, table, columns, where)
        ).trim();
    }

    public compileUpdateFrom(_query: BuilderContract, _values: RowValues): string {
        throw new Error('This database engine does not support the updateFrom method.');
    }

    /**
     * Compile the columns for an update statement.
     */
    protected compileUpdateColumns(_query: BuilderContract, values: RowValues): string {
        return Object.keys(values)
            .map((key: keyof RowValues & string) => {
                return `${this.wrap(key)} = ${this.parameter(values[key])}`;
            })
            .join(', ');
    }

    /**
     * Compile an update statement without joins into SQL.
     */
    protected compileUpdateWithoutJoins(
        _query: BuilderContract,
        table: string,
        columns: string,
        where: string
    ): string {
        return `update ${table} set ${columns} ${where}`;
    }

    /**
     * Compile an update statement with joins into SQL.
     */
    protected compileUpdateWithJoins(query: BuilderContract, table: string, columns: string, where: string): string {
        const joins = this.compileJoins(query, query.getRegistry().joins);

        return `update ${table} ${joins} set ${columns} ${where}`;
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public compileUpsert(
        _query: BuilderContract,
        _values: RowValues[],
        _uniqueBy: string[],
        _update: Array<string | RowValues>
    ): string {
        throw new Error('This database engine does not support upserts.');
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): any[] {
        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select', 'join'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return bindings.join.concat(Object.values(values), cleanBindings.flat(Infinity) as Binding[]);
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdateFrom(_bindings: BindingTypes, _values: RowValues): any[] {
        throw new Error('This database engine does not support the updateFrom method.');
    }

    /**
     * Compile a delete statement into SQL.
     */
    public compileDelete(query: BuilderContract): string {
        const table = this.wrapTable(query.getRegistry().from);

        const where = this.compileWheres(query);

        return (
            query.getRegistry().joins.length > 0
                ? this.compileDeleteWithJoins(query, table, where)
                : this.compileDeleteWithoutJoins(query, table, where)
        ).trim();
    }

    /**
     * Compile a delete statement with joins into SQL.
     */
    protected compileDeleteWithJoins(query: BuilderContract, table: string, where: string): string {
        const exploded = table.split(/ as /g);
        const alias = exploded.pop();

        const joins = this.compileJoins(query, query.getRegistry().joins);

        return `delete ${alias} from ${table} ${joins} ${where}`;
    }

    /**
     * Compile a delete statement without joins into SQL.
     */
    protected compileDeleteWithoutJoins(_query: BuilderContract, table: string, where: string): string {
        return `delete from ${table} ${where}`;
    }

    /**
     * Prepare the bindings for a delete statement.
     */
    public prepareBindingsForDelete(bindings: BindingTypes): Binding[] {
        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return cleanBindings.flat(Infinity) as Binding[];
    }

    /**
     * Compile a truncate table statement into SQL.
     */
    public compileTruncate(query: BuilderContract): { [key: string]: Binding[] } {
        return { [`truncate table ${this.wrapTable(query.getRegistry().from)}`]: [] };
    }

    /**
     * Determine if the grammar supports savepoints.
     */
    public supportsSavepoints(): boolean {
        return true;
    }

    /**
     * Compile the SQL statement to define a savepoint.
     */
    public compileSavepoint(name: string): string {
        return `SAVEPOINT ${name}`;
    }

    /**
     * Compile the SQL statement to execute a savepoint rollback.
     */
    public compileSavepointRollBack(name: string): string {
        return `ROLLBACK TO SAVEPOINT ${name}`;
    }

    /**
     * Remove the leading boolean from a statement.
     */
    protected removeLeadingBoolean(value: string): string {
        return value.replace(/and |or /i, '');
    }

    /**
     * Wrap the given JSON selector for boolean values.
     */
    protected wrapJsonBooleanSelector(value: Stringable): string {
        return this.wrapJsonSelector(value);
    }

    /**
     * Wrap the given JSON boolean value.
     */
    protected wrapJsonBooleanValue(value: Stringable): string {
        return this.getValue(value).toString();
    }

    /**
     * Concatenate an array of segments, removing empties.
     */
    protected concatenate(segments: string[]): string {
        return segments.filter(segment => segment !== '').join(' ');
    }

    /**
     * Substitute the given bindings into the given raw SQL query.
     */
    public substituteBindingsIntoRawSql(
        sql: string,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): string {
        if (Array.isArray(bindings)) {
            bindings = bindings.slice();
            let isStringLiteral = false;
            let query = '';
            for (let i = 0; i < sql.length; i++) {
                const char = sql[i];
                const nextChar = sql[i + 1] ?? null;
                const combinedChar = `${char}${nextChar}`;
                if ([`\\'`, "''", '??'].includes(combinedChar)) {
                    // Single quotes can be escaped as '' according to the SQL standard while
                    // MySQL uses \'. Postgres has operators like ?| that must get encoded
                    // in PHP like ??|. We should skip over the escaped characters here.
                    if (combinedChar === '??' && !isStringLiteral) {
                        query += '?';
                    } else {
                        query += combinedChar;
                    }
                    i += 1;
                } else if (char === "'") {
                    query += char;
                    isStringLiteral = !isStringLiteral;
                } else if (char === '?' && !isStringLiteral) {
                    // Substitutable binding...
                    const binding = bindings.shift();
                    query += binding !== undefined ? this.escape(binding) : '?';
                } else {
                    // Normal character...
                    query += char;
                }
            }
            return query;
        } else {
            const keys = Object.keys(bindings).sort((a, b) => a.length - b.length);
            for (const key of keys) {
                sql = sql.replace(`:${key}`, this.escape(bindings[key]));
            }
            return sql;
        }
    }

    /**
     * Get the grammar specific operators.
     */
    public getOperators(): string[] {
        return this.operators;
    }

    /**
     * Get the grammar specific bitwise operators.
     */
    public getBitwiseOperators(): string[] {
        return this.bitwiseOperators;
    }

    /**
     * Parameter must be converted to String with JSON.stringify
     */
    protected mustBeJsonStringified(value: any): boolean {
        return Array.isArray(value) || !isValidBinding(value);
    }

    /**
     * Combine Json Update Values.
     */
    protected combineJsonValues(values: RowValues): [RowValues, string[]] {
        const jsonGroupedColumns = this.groupJsonColumnsForUpdate(values);

        if (Object.keys(jsonGroupedColumns).length === 0) {
            return [values, []];
        }

        const groups: RowValues = {};

        for (const key in values) {
            if (this.isJsonSelector(key)) {
                continue;
            }
            const keyWithoutTable = this.getColumnKey(key);
            set(groups, keyWithoutTable, values[key]);

            if (keyWithoutTable in jsonGroupedColumns) {
                for (let path in jsonGroupedColumns[keyWithoutTable]) {
                    const value = jsonGroupedColumns[keyWithoutTable][path];
                    delete jsonGroupedColumns[keyWithoutTable][path];
                    if (Object.keys(jsonGroupedColumns[keyWithoutTable]).length === 0) {
                        delete jsonGroupedColumns[keyWithoutTable];
                    }
                    path = path.replace(/\[/g, '.').replace(/\]/g, '').replace(/->\./g, '.').replace(/->/g, '.');
                    set(groups, `${keyWithoutTable}.${path}`, value);
                }
            }
        }

        return [merge(groups, jsonGroupedColumns), Object.keys(jsonGroupedColumns)];
    }

    /**
     * Group the nested JSON columns.
     */
    protected groupJsonColumnsForUpdate(values: RowValues): RowValues {
        const groups: RowValues = {};

        for (const key in values) {
            if (this.isJsonSelector(key)) {
                const exploded = this.getColumnKey(key).split('->');
                const column = exploded.shift() as string;
                if (!(column in groups)) {
                    groups[column] = {};
                }
                groups[column][exploded.join('->')] = values[key];
            }
        }

        return groups;
    }

    /**
     * Remove table name from key
     */
    protected getColumnKey(key: string): string {
        const exploded = key.split('.');
        if (exploded.length > 1) {
            return exploded.pop() as string;
        }
        return key;
    }

    /**
     * Convert Json Arrow Path to Json Brace Path
     */
    protected convertJsonArrowPathToJsonBracePath(column: Stringable): string {
        return this.getValue(column)
            .toString()
            .replace(/->((-)?\d+)->/g, '[$1$2]->')
            .replace(/->((-)?\d+)$/g, '[$1$2]');
    }

    /**
     * Escapes a value for safe SQL embedding.
     */
    public escape(value: Binding): string {
        if (isTypedBinding(value)) {
            value = value.value;
        }

        if (value === null) {
            return 'null';
        }

        if (Buffer.isBuffer(value)) {
            return this.escapeBinary(value);
        }

        if (typeof value === 'boolean') {
            return this.escapeBool(value);
        }

        if (value instanceof ExpressionContract) {
            value = value.getValue(this);
        }

        value = this.escapeString(value);

        if (hasNullBytesCharacters(value)) {
            return '<NullByte>';
        }

        if (hasInvalidUTF8Characters(value)) {
            return '<InvalidUtf8Byte>';
        }

        return value;
    }

    /**
     * Escape a string value for safe SQL embedding.
     */
    protected escapeString(value: number | bigint | string | Date): string {
        return `'${escapeQuoteForSql(value.toString())}'`;
    }

    /**
     * Escape a boolean value for safe SQL embedding.
     */
    protected escapeBool(value: boolean): string {
        return value ? '1' : '0';
    }

    /**
     * Escape a binary value for safe SQL embedding.
     */
    protected escapeBinary(value: Buffer): string {
        return `<Buffer[${Buffer.byteLength(value)}]>`;
    }
}

export default Grammar;
