import { Binding, RowValues, Stringable } from '../../types/query/builder';
import { BindingTypes, HavingBasic, WhereBasic, WhereDateTime } from '../../types/query/registry';
import { stringifyReplacer } from '../../utils';
import BuilderContract from '../builder-contract';
import Expression from '../expression';
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
    public compileSelect(query: BuilderContract): string {
        const registry = query.getRegistry();
        // An order by clause is required for SQL Server offset to function...
        if (registry.offset !== null && registry.orders.length === 0) {
            registry.orders.push({ type: 'Raw', sql: '(SELECT 0)' });
        }

        return super.compileSelect(query);
    }

    /**
     * Compile the "select *" portion of the query.
     */
    protected compileColumns(query: BuilderContract, columns: Stringable[]): string {
        if (query.getRegistry().aggregate === null) {
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
    protected compileFrom(query: BuilderContract, table: Stringable): string {
        const from = super.compileFrom(query, table);
        const lock = query.getRegistry().lock;

        if (typeof lock === 'string') {
            return `${from} ${query.lock}`;
        }

        if (lock !== null) {
            return `${from} with(rowlock, ${lock ? 'updlock,' : ''}holdlock)`;
        }

        return from;
    }

    /**
     * Compile a bitwise operator where clause.
     */
    protected compileWhereBitwise(_query: BuilderContract, where: WhereBasic): string {
        const value = this.parameter(where.value);
        const operator = where.operator.replace(/?/g, '??');
        return `(${this.wrap(where.column)} ${operator} ${value}) != 0`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected compileWhereDate(_query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `cast(${this.wrap(where.column)} as date) ${where.operator} ${value}`;
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(_query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `cast(${this.wrap(where.column)} as time) ${where.operator} ${value}`;
    }
    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected compileJsonContains(column: Stringable, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `${value} in (select [value] from openjson(${field}, ${value}${path}))`;
    }

    /**
     * Prepare the binding for a "JSON contains" statement.
     */
    public prepareBindingForJsonContains(binding: Binding | Binding[]): Binding | Binding[] {
        return typeof binding === 'boolean' ? JSON.stringify(binding, stringifyReplacer) : binding;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected compileJsonContainsKey(column: Stringable): string {
        const segments = column.split('->');
        const lastSegment = segments.pop() as string;
        const matches = lastSegment.match(/\[([0-9]+)\]$/);
        let key = '';

        if (matches !== null) {
            const index = lastSegment.indexOf(matches[0]);
            if (index > 0) {
                segments.push(lastSegment.slice(0, index));
            }

            key = matches[1];
        } else {
            key = `'${lastSegment.replace(/'/g, "''")}'`;
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
     * Compile a "JSON value cast" statement into SQL.
     */
    public compileJsonValueCast(value: string): string {
        return `json_query(${value})`;
    }

    /**
     * Compile a having clause involving a bitwise operator.
     */
    protected compileHavingBitwise(_query: BuilderContract, having: HavingBasic): string {
        const column = this.wrap(having.column);
        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter}) != 0`;
    }

    /**
     * Compile a delete statement without joins into SQL.
     */
    protected compileDeleteWithoutJoins(query: BuilderContract, table: string, where: string): string {
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
    protected compileLimit(query: BuilderContract, limit: number): string {
        if (limit && Number(query.getRegistry().offset) > 0) {
            return `fetch next ${limit} rows only`;
        }

        return '';
    }

    /**
     * Compile the "offset" portions of the query.
     */
    protected compileOffset(_query: BuilderContract, offset: number): string {
        if (offset > 0) {
            return `offset ${offset} rowa`;
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
    public compileExists(query: BuilderContract): string {
        const existsQuery = query.clone();
        const registry = existsQuery.getRegistry();
        registry.columns = [];
        existsQuery.setRegistry(registry);

        return `${this.compileSelect(existsQuery.selectRaw('1 [exists]').limit(1))}`;
    }

    /**
     * Compile an update statement with joins into SQL.
     */
    protected compileUpdateWithJoins(query: BuilderContract, table: string, columns: string, where: string): string {
        const alias = table.split(' as ').pop() as string;
        const joins = this.compileJoins(query, query.getRegistry().joins);

        return `update ${alias} set ${columns} from ${table} ${joins} ${where}`;
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public compileUpsert(
        query: BuilderContract,
        values: RowValues[] | RowValues,
        uniqueBy: string[],
        update: string[] | RowValues
    ): string {
        const columns = Object.keys(Array.isArray(values) ? values[0] : values);

        let sql = `merge ${this.wrapTable(query.getRegistry().from)} `;

        const parameters = (Array.isArray(values) ? values : [values])
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

        const updateString = (
            Array.isArray(update)
                ? update.map(value => {
                      return `${this.wrap(value)} = ${this.wrap('laravel_source.' + value)}`;
                  })
                : Object.keys(update).map(key => {
                      return `${this.wrap(key)} = ${this.parameter(update[key])}`;
                  })
        ).join(', ');

        sql += `when matched then update set ${updateString} `;

        sql += `when not matched then insert (${columns}) values (${columns})`;

        return sql;
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): Binding[] {
        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return Object.values(values).concat(cleanBindings.flat(Infinity) as Binding[]);
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
     * Get the format for database stored dates.
     */
    public getDateFormat(): string {
        return 'Y-m-d H:i:s.v';
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
        return `'${value.toString()}'`;
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    public wrapTable(table: Stringable): string {
        if (!this.isExpression(table)) {
            return this.wrapTableValuedFunction(super.wrapTable(table));
        }

        return this.getValue(table as Expression);
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
}

export default SqlServerGrammar;