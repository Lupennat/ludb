import { Binding, Stringable } from '../../types/generics';
import QueryBuilderI, { RowValues } from '../../types/query/query-builder';
import { BindingTypes, HavingBasic, WhereBasic, WhereDateTime } from '../../types/query/registry';
import { beforeLast, escapeQuoteForSql, stringifyReplacer } from '../../utils';
import Expression from '../expression';
import IndexHint from '../index-hint';
import Grammar from './grammar';

class SqlServerGrammar extends Grammar {
    /**
     * All of the available clause operators.
     */
    protected operators: string[] = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '!<',
        '!>',
        '<>',
        '!=',
        'like',
        'not like',
        'ilike',
        '&',
        '&=',
        '|',
        '|=',
        '^',
        '^='
    ];

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
        'offset',
        'limit',
        'lock'
    ];

    /**
     * Compile a select query into SQL.
     */
    public compileSelect(query: QueryBuilderI): string {
        const registry = query.getRegistry();
        // An order by clause is required for SQL Server offset to function...
        if (registry.offset && registry.orders.length === 0) {
            registry.orders.push({ type: 'Raw', sql: '(SELECT 0)' });
        }

        return super.compileSelect(query);
    }

    /**
     * Compile the "select *" portion of the query.
     */
    protected compileColumns(query: QueryBuilderI, columns: Stringable[]): string {
        if (query.getRegistry().aggregate !== null) {
            return '';
        }

        let select = query.getRegistry().distinct !== false ? 'select distinct' : 'select';

        // If there is a limit on the query, but not an offset, we will add the top
        // clause to the query, which serves as a "limit" type clause within the
        // SQL Server system similar to the limit keywords available in MySQL.
        const limit = query.getRegistry().limit;
        const offset = query.getRegistry().offset;
        if (limit !== null && limit > 0 && Number(offset) <= 0) {
            select += ` top ${limit}`;
        }

        return `${select} ${this.columnize(columns)}`;
    }

    /**
     * Compile the "from" portion of the query.
     */
    protected compileFrom(query: QueryBuilderI, table: Stringable): string {
        const from = super.compileFrom(query, table);
        const lock = query.getRegistry().lock;

        if (typeof lock === 'string') {
            return `${from} ${lock}`;
        }

        if (lock !== null) {
            return `${from} with(rowlock,${lock ? 'updlock,' : ''}holdlock)`;
        }

        return from;
    }

    /**
     * Compile the index hints for the query.
     */
    protected compileIndexHint(_query: QueryBuilderI, indexHint: IndexHint): string {
        return indexHint.type === 'force' ? `with (index(${indexHint.index}))` : '';
    }

    /**
     * Compile a bitwise operator where clause.
     */
    protected compileWhereBitwise(_query: QueryBuilderI, where: WhereBasic): string {
        const value = this.parameter(where.value);
        const operator = where.operator.replace(/\?/g, '??');

        return `(${this.wrap(where.column)} ${operator} ${value}) != 0`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected compileWhereDate(_query: QueryBuilderI, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `cast(${this.wrap(where.column)} as date) ${where.operator} ${value}`;
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(_query: QueryBuilderI, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `cast(${this.wrap(where.column)} as time) ${where.operator} ${value}`;
    }
    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected compileJsonContains(column: Stringable, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `${value} in (select [value] from openjson(${field}${path}))`;
    }

    /**
     * Prepare the binding for a "JSON contains" statement.
     */
    public prepareBindingForJsonContains(binding: Binding | Binding[]): Binding | Binding[] {
        return typeof binding === 'boolean' ? JSON.stringify(binding, stringifyReplacer(this)) : binding;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected compileJsonContainsKey(column: Stringable): string {
        column = this.convertJsonArrowPathToJsonBracePath(column);
        const segments = this.getValue(column).toString().split('->');
        const lastSegment = segments.pop() as string;
        const matches = lastSegment.match(/\[([0-9]+)\]$/);
        let key = '';

        if (matches !== null) {
            segments.push(beforeLast(lastSegment, matches[0]));
            key = matches[1];
        } else {
            key = `'${escapeQuoteForSql(lastSegment)}'`;
        }

        const [field, path] = this.wrapJsonFieldAndPath(segments.join('->'));

        return `${key} in (select [key] from openjson(${field}${path}))`;
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected compileJsonLength(column: Stringable, operator: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `(select count(*) from openjson(${field}${path})) ${operator} ${value}`;
    }

    /**
     * Compile a having clause involving a bitwise operator.
     */
    protected compileHavingBitwise(_query: QueryBuilderI, having: HavingBasic): string {
        const column = this.wrap(having.column);
        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter}) != 0`;
    }

    /**
     * Compile a delete statement without joins into SQL.
     */
    protected compileDeleteWithoutJoins(query: QueryBuilderI, table: string, where: string): string {
        const sql = super.compileDeleteWithoutJoins(query, table, where);
        const limit = query.getRegistry().limit;

        return limit !== null && limit > 0 && Number(query.getRegistry().offset) <= 0
            ? sql.replace('delete', `delete top (${limit})`)
            : sql;
    }

    /**
     * Compile the random statement into SQL.
     */
    public compileRandom(): string {
        return 'NEWID()';
    }

    /**
     * Compile the "limit" portions of the query.
     */
    protected compileLimit(query: QueryBuilderI, limit: number): string {
        if (limit && Number(query.getRegistry().offset) > 0) {
            return `fetch next ${limit} rows only`;
        }

        return '';
    }

    /**
     * Compile the "offset" portions of the query.
     */
    protected compileOffset(_query: QueryBuilderI, offset: number): string {
        if (offset > 0) {
            return `offset ${offset} rows`;
        }

        return '';
    }

    /**
     * Compile the lock into SQL.
     */
    protected compileLock(): string {
        return '';
    }

    /**
     * Wrap a union subquery in parentheses.
     */
    protected wrapUnion(sql: string): string {
        return `select * from (${sql}) as ${this.wrapTable('temp_table')}`;
    }

    /**
     * Compile an exists statement into SQL.
     */
    public compileExists(query: QueryBuilderI): string {
        const existsQuery = query.clone();
        const registry = existsQuery.getRegistry();
        registry.columns = [];
        existsQuery.setRegistry(registry);

        return `${this.compileSelect(existsQuery.selectRaw('1 [exists]').limit(1))}`;
    }

    /**
     * Compile the columns for an update statement.
     */
    protected compileUpdateColumns(_query: QueryBuilderI, values: RowValues): string {
        const [combinedValues, jsonKeys] = this.combineJsonValues(values);
        return Object.keys(combinedValues)
            .map(key => {
                const value = jsonKeys.includes(key)
                    ? this.compileJsonUpdateColumn(key, combinedValues[key])
                    : this.parameter(combinedValues[key]);

                key = this.getColumnKey(key);
                return `${this.wrap(key)} = ${value}`;
            })
            .join(', ');
    }

    /**
     * Compile a "JSON modify" statement into SQL.
     */
    protected compileJsonUpdateColumn(column: string, values: RowValues): string {
        let sql = '';
        for (const key in values) {
            const segments = key.split('->');
            const lastSegment = segments.pop() as string;
            const matches = lastSegment.match(/\[(-?[0-9]+)\]$/);
            if (matches !== null) {
                segments.push(beforeLast(lastSegment, matches[0]));
                sql = this.compileJsonUpdateForArray(
                    column,
                    segments.join('->'),
                    matches[1],
                    sql === '' ? this.wrap(column) : sql,
                    this.wrapJsonPath(key, '->'),
                    values[key]
                );
            } else {
                sql = this.compileJsonUpdateForPath(
                    sql === '' ? this.wrap(column) : sql,
                    this.wrapJsonPath(key, '->'),
                    values[key]
                );
            }
        }
        return sql;
    }

    /**
     * Compile "JSON modify" for array path
     */
    protected compileJsonUpdateForArray(
        column: string,
        before: string,
        position: string,
        expression: string,
        path: string,
        value: any
    ): string {
        const searchPath = before === '' ? "'$'" : this.wrapJsonPath(before, '->');
        const appendPath = searchPath.replace("'", "'append ");
        const condition = `(select count(*) from openjson(${this.wrap(column)}, ${searchPath})) >= ${
            Number(position) + 1
        }`;

        const expressionPath = `case when ${condition} then ${path} else ${appendPath} end`;
        return this.compileJsonNullPatch(this.compileJsonUpdate(expression, expressionPath, value), path, value);
    }

    /**
     * Compile "JSON modify" for  path
     */
    protected compileJsonUpdateForPath(expression: string, path: string, value: any): string {
        return this.compileJsonNullPatch(this.compileJsonUpdate(expression, path, value), path, value);
    }

    /**
     * Compile "JSON modify" patch for null value
     */
    protected compileJsonNullPatch(expression: string, path: string, value: any): string {
        if (value !== null) {
            return expression;
        }

        return this.compileJsonUpdate(expression, path.replace("'", "'strict "), null, true);
    }

    /**
     * Compile "JSON modify" base string
     */
    protected compileJsonUpdate(expression: string, path: string, value: any, validNull = false): string {
        let stringValue = '';
        if (!validNull && value === null) {
            value = new Expression("''");
        }
        if (this.mustBeJsonStringified(value)) {
            stringValue = `json_query(?)`;
        } else {
            stringValue = this.parameter(value);
        }
        return `json_query(json_modify(${expression}, ${path}, ${stringValue}))`;
    }

    /**
     * Compile an update statement with joins into SQL.
     */
    protected compileUpdateWithJoins(query: QueryBuilderI, table: string, columns: string, where: string): string {
        const alias = table.split(' as ').pop() as string;
        const joins = this.compileJoins(query, query.getRegistry().joins);

        return `update ${alias} set ${columns} from ${table} ${joins} ${where}`;
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public compileUpsert(
        query: QueryBuilderI,
        values: RowValues[],
        uniqueBy: string[],
        update: Array<string | RowValues>
    ): string {
        const columns = this.columnize(Object.keys(values[0]));

        let sql = `merge ${this.wrapTable(query.getRegistry().from)} `;

        const parameters = values
            .map(value => {
                return `(${this.parameterize(Object.values(value))})`;
            })
            .join(', ');

        sql += `using (values ${parameters}) ${this.wrapTable('laravel_source')} (${columns}) `;

        const on = uniqueBy
            .map(column => {
                return `${this.wrap('laravel_source.' + column)} = ${this.wrap(
                    query.getRegistry().from + '.' + column
                )}`;
            })
            .join(' and ');

        sql += `on ${on} `;

        const stringUpdate = update.filter(binding => typeof binding === 'string') as string[];
        const rowValues = update.filter(binding => typeof binding !== 'string') as RowValues[];

        const updateString = stringUpdate
            .map(item => {
                return `${this.wrap(item)} = ${this.wrap('laravel_source.' + item)}`;
            })
            .concat(
                rowValues.reduce((carry: string[], item) => {
                    for (const key in item) {
                        carry.push(`${this.wrap(key)} = ${this.parameter(item[key])}`);
                    }
                    return carry;
                }, [])
            )
            .join(', ');

        if (updateString) {
            sql += `when matched then update set ${updateString} `;
        }

        sql += `when not matched then insert (${columns}) values (${columns})`;

        return sql;
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): Binding[] {
        const [combinedValues, jsonKeys] = this.combineJsonValues(values);

        const valuesOfValues = Object.keys(combinedValues).reduce((acc: any[], key: string) => {
            if (!jsonKeys.includes(key)) {
                acc.push(
                    this.mustBeJsonStringified(combinedValues[key])
                        ? JSON.stringify(combinedValues[key], stringifyReplacer(this))
                        : values[key]
                );
            } else {
                for (const subkey in combinedValues[key]) {
                    const value = combinedValues[key][subkey];
                    if (this.isExpression(value)) {
                        continue;
                    }
                    acc.push(
                        this.mustBeJsonStringified(value) ? JSON.stringify(value, stringifyReplacer(this)) : value
                    );
                }
            }

            return acc;
        }, []);

        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return valuesOfValues.concat(cleanBindings.flat(Infinity) as Binding[]);
    }

    /**
     * Compile the SQL statement to define a savepoint.
     */
    public compileSavepoint(name: string): string {
        return `SAVE TRANSACTION ${name}`;
    }

    /**
     * Compile the SQL statement to execute a savepoint rollback.
     */
    public compileSavepointRollBack(name: string): string {
        return `ROLLBACK TRANSACTION ${name}`;
    }

    /**
     * Wrap a single string in keyword identifiers.
     */
    protected wrapValue(value: string): string {
        return value === '*' ? value : `[${value.replace(/]/g, ']]')}]`;
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(value: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_value(${field}${path})`;
    }

    /**
     * Wrap the given JSON boolean value.
     */
    protected wrapJsonBooleanValue(value: Stringable): string {
        return `'${this.getValue(value).toString()}'`;
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    public wrapTable(table: Stringable): string {
        if (!this.isExpression(table)) {
            return this.wrapTableValuedFunction(super.wrapTable(table));
        }

        return this.getValue(table).toString();
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    protected wrapTableValuedFunction(table: string): string {
        const match = table.match(/^(.+?)(\(.*?\))]$/);
        if (match !== null) {
            table = `${match[1]}]${match[2]}`;
        }

        return table;
    }

    /**
     * Escape a binary value for safe SQL embedding.
     */
    protected escapeBinary(value: Buffer): string {
        return `0x${value.toString('hex')}`;
    }
}

export default SqlServerGrammar;
