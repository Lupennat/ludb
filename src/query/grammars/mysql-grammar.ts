import { Binding, RowValues, Stringable } from '../../types/query/builder';
import { BindingTypes, WhereNull, whereFulltext } from '../../types/query/registry';
import { isPrimitiveBinding, stringifyReplacer } from '../../utils';
import BuilderContract from '../builder-contract';
import IndexHint from '../index-hint';
import Grammar from './grammar';

class MySqlGrammar extends Grammar {
    /**
     * The grammar specific operators.
     */
    protected operators: string[] = ['sounds like'];

    /**
     * Add a "where null" clause to the query.
     */
    protected compileWhereNull(query: BuilderContract, where: WhereNull): string {
        if (this.isJsonSelector(where.column)) {
            const [field, path] = this.wrapJsonFieldAndPath(where.column);
            const isNullCondition = where.not ? 'is not null AND' : 'is null OR';
            const operator = where.not ? '!=' : '=';
            return `(json_extract(${field}${path}) ${isNullCondition} json_type(json_extract(${field}${path})) ${operator} 'NULL')`;
        }

        return super.compileWhereNull(query, where);
    }

    /**
     * Compile a "fulltext" statement into SQL.
     */
    public compileFulltext(_query: BuilderContract, where: whereFulltext): string {
        const columns = this.columnize(where.columns);

        const value = this.parameter(where.value);

        const mode = where.options.mode === 'boolean' ? ' in boolean mode' : ' in natural language mode';

        const expanded = where.options.expanded && where.options.mode !== 'boolean' ? ' with query expansion' : '';

        return `match (${columns}) against (${value}${mode}${expanded})`;
    }

    /**
     * Compile the index hints for the query.
     */
    protected compileIndexHint(_query: BuilderContract, indexHint: IndexHint): string {
        switch (indexHint.type) {
            case 'hint':
                return `use index (${indexHint.index})`;
            case 'force':
                return `force index (${indexHint.index})`;
            default:
                return `ignore index (${indexHint.index})`;
        }
    }

    /**
     * Compile an insert ignore statement into SQL.
     */
    public compileInsertOrIgnore(query: BuilderContract, values: RowValues[] | RowValues): string {
        return this.compileInsert(query, values).replace('insert', 'insert ignore');
    }

    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected compileJsonContains(column: Stringable, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_contains(${field}, ${value}${path})`;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected compileJsonContainsKey(column: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `ifnull(json_contains_path(${field}, 'one'${path}), 0)`;
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected compileJsonLength(column: Stringable, operator: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_length(${field}${path}) ${operator} ${value}`;
    }

    /**
     * Compile a "JSON value cast" statement into SQL.
     */
    public compileJsonValueCast(value: string): string {
        return `cast(${super.compileJsonValueCast(value)} as json)`;
    }

    /**
     * Compile the random statement into SQL.
     */
    public compileRandom(seed: string | number): string {
        return `RAND(${seed})`;
    }

    /**
     * Compile the lock into SQL.
     */
    protected compileLock(_query: BuilderContract, value: boolean | string): string {
        if (typeof value !== 'string') {
            return value ? 'for update' : 'lock in share mode';
        }

        return value;
    }

    /**
     * Compile an insert statement into SQL.
     */
    public compileInsert(query: BuilderContract, values: RowValues[] | RowValues): string {
        if ((Array.isArray(values) && values.length === 0) || Object.keys(values).length === 0) {
            values = [{}];
        }

        return super.compileInsert(query, values);
    }

    /**
     * Compile the columns for an update statement.
     */
    protected compileUpdateColumns(_query: BuilderContract, values: RowValues): string {
        return Object.keys(values)
            .map((key: keyof RowValues & Stringable) => {
                if (this.isJsonSelector(key)) {
                    return this.compileJsonUpdateColumn(key, values[key]);
                }
                return `${this.wrap(key)} = ${this.parameter(values[key])}`;
            })
            .join(', ');
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public compileUpsert(
        query: BuilderContract,
        values: RowValues[],
        _uniqueBy: string[],
        update: Array<string | RowValues>
    ): string {
        const useUpsertAlias = query.getConnection().getConfig<boolean>('use_upsert_alias', false);

        let sql = this.compileInsert(query, values);

        if (useUpsertAlias) {
            sql += ' as laravel_upsert_alias';
        }

        sql += ' on duplicate key update ';

        const stringUpdate = update.filter(binding => isPrimitiveBinding(binding)) as string[];
        const rowValues = update.filter(binding => !isPrimitiveBinding(binding)) as RowValues[];

        const columns = stringUpdate
            .map(item => {
                return useUpsertAlias
                    ? `${this.wrap(item)} = ${this.wrap('laravel_upsert_alias')}.${this.wrap(item)}`
                    : `${this.wrap(item)} = values(${this.wrap(item)})`;
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

        return `${sql}${columns}`;
    }

    /**
     * Prepare a JSON column being updated using the JSON_SET function.
     */
    protected compileJsonUpdateColumn(key: Stringable, value: Binding): string {
        if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';
        } else if (this.mustBeJsonStringified(value)) {
            value = 'cast(? as json)';
        } else {
            value = this.parameter(value);
        }

        const [field, path] = this.wrapJsonFieldAndPath(key);

        return `${field} = json_set(${field}${path}, ${value})`;
    }

    /**
     * Compile an update statement without joins into SQL.
     */
    protected compileUpdateWithoutJoins(query: BuilderContract, table: string, columns: string, where: string): string {
        let sql = super.compileUpdateWithoutJoins(query, table, columns, where);

        if (query.getRegistry().orders.length) {
            sql += ` ${this.compileOrders(query, query.getRegistry().orders)}`;
        }

        const limit = query.getRegistry().limit;

        if (limit !== null && limit > 0) {
            sql += ` ${this.compileLimit(query, limit)}`;
        }

        return sql;
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): Binding[] {
        values = Object.keys(values)
            .filter(key => !this.isJsonSelector(key) || typeof values[key] !== 'boolean')
            .reduce(
                (acc: RowValues, key) => ({
                    ...acc,
                    [key]: this.mustBeJsonStringified(values[key])
                        ? JSON.stringify(values[key], stringifyReplacer(this))
                        : values[key]
                }),
                {}
            );

        return super.prepareBindingsForUpdate(bindings, values);
    }

    /**
     * Compile a delete query that does not use joins.
     */
    protected compileDeleteWithoutJoins(query: BuilderContract, table: string, where: string): string {
        let sql = super.compileDeleteWithoutJoins(query, table, where);

        // When using MySQL, delete statements may contain order by statements and limits
        // so we will compile both of those here. Once we have finished compiling this
        // we will return the completed SQL statement so it will be executed for us.
        if (query.getRegistry().orders.length) {
            sql += ` ${this.compileOrders(query, query.getRegistry().orders)}`;
        }

        const limit = query.getRegistry().limit;

        if (limit !== null && limit > 0) {
            sql += ` ${this.compileLimit(query, limit)}`;
        }

        return sql;
    }

    /**
     * Wrap a single string in keyword identifiers.
     */
    protected wrapValue(value: string): string {
        return value === '*' ? value : '`' + value.replace(/`/g, '``') + '`';
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(value: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_unquote(json_extract(${field}${path}))`;
    }

    /**
     * Wrap the given JSON selector for boolean values.
     */
    protected wrapJsonBooleanSelector(value: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_extract(${field}${path})`;
    }
}

export default MySqlGrammar;
