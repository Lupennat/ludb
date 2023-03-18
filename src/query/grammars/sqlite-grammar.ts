import { Binding, RowValues, Stringable } from '../../types/query/builder';
import { BindingTypes, WhereDateTime } from '../../types/query/registry';
import { merge, stringifyReplacer } from '../../utils';
import BuilderContract from '../builder-contract';
import IndexHint from '../index-hint';
import Grammar from './grammar';

class SQLiteGrammar extends Grammar {
    /**
     * All of the available clause operators.
     */
    protected operators: string[] = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '<>',
        '!=',
        'like',
        'not like',
        'ilike',
        '&',
        '|',
        '<<',
        '>>'
    ];

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
        return `select * from (${sql})`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected compileWhereDate(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('%Y-%m-%d', query, where);
    }

    /**
     * Compile a "where day" clause.
     */
    protected compileWhereDay(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('%d', query, where);
    }

    /**
     * Compile a "where month" clause.
     */
    protected compileWhereMonth(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('%m', query, where);
    }

    /**
     * Compile a "where year" clause.
     */
    protected compileWhereYear(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('%Y', query, where);
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(query: BuilderContract, where: WhereDateTime): string {
        return this.dateBasedWhere('%H:%M:%S', query, where);
    }

    /**
     * Compile a date based where clause.
     */
    protected dateBasedWhere(type: string, _query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `strftime('${type}', ${this.wrap(where.column)}) ${where.operator} cast(${value} as text)`;
    }

    /**
     * Compile the index hints for the query.
     */
    protected compileIndexHint(_query: BuilderContract, indexHint: IndexHint): string {
        return indexHint.type === 'force' ? `indexed by ${indexHint.index}` : '';
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected compileJsonLength(column: Stringable, operator: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_array_length(${field}${path}) ${operator} ${value}`;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected compileJsonContainsKey(column: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_type(${field}${path}) is not null`;
    }

    /**
     * Compile an update statement into SQL.
     */
    public compileUpdate(query: BuilderContract, values: RowValues): string {
        const joins = query.getRegistry().joins;
        const limit = query.getRegistry().limit;
        if (joins.length || limit) {
            return this.compileUpdateWithJoinsOrLimit(query, values);
        }

        return super.compileUpdate(query, values);
    }

    /**
     * Compile an insert ignore statement into SQL.
     */
    public compileInsertOrIgnore(query: BuilderContract, values: RowValues[] | RowValues): string {
        return this.compileInsert(query, values).replace('insert', 'insert or ignore');
    }

    /**
     * Compile the columns for an update statement.
     */
    protected compileUpdateColumns(_query: BuilderContract, values: RowValues): string {
        this.validateJsonColumnsForUpdate(values);
        const groups = this.groupJsonColumnsForUpdate(values);

        const notJsonValues = Object.keys(values)
            .filter(key => !this.isJsonSelector(key))
            .reduce(
                (acc: RowValues, key) => ({
                    ...acc,
                    [key]: values[key]
                }),
                {}
            );

        values = merge(notJsonValues, groups);

        return Object.keys(values)
            .map(key => {
                const column = key.split('.').pop() as string;
                const value =
                    column in groups ? this.compileJsonUpdateColumn(column, values[key]) : this.parameter(values[key]);

                return `${this.wrap(column)} = ${value}`;
            })
            .join(', ');
    }

    /**
     * Compile an "upsert" statement into SQL.
     */
    public compileUpsert(
        query: BuilderContract,
        values: RowValues[],
        uniqueBy: string[],
        update: Array<string | RowValues>
    ): string {
        let sql = this.compileInsert(query, values);

        sql += ` on conflict (${this.columnize(uniqueBy)}) do update set `;

        const stringUpdate = update.filter(binding => typeof binding === 'string') as string[];
        const rowValues = update.filter(binding => typeof binding !== 'string') as RowValues[];

        const columns = stringUpdate
            .map(item => {
                return `${this.wrap(item)} = ${this.wrapValue('excluded')}.${this.wrap(item)}`;
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
     * Compile a "JSON" patch statement into SQL.
     */
    protected compileJsonUpdateColumn(column: string, values: RowValues): string {
        let sql = '';
        for (const key in values) {
            const path = this.wrapJsonPath(key, '->');
            const value = values[key];
            let stringValue = '';
            if (typeof value === 'boolean') {
                stringValue = `json(${value ? "'true'" : "'false'"})`;
            } else if (this.mustBeJsonStringified(value)) {
                stringValue = `json(?)`;
            } else {
                stringValue = this.parameter(value);
            }

            sql = `json_set(${sql === '' ? column : sql}, ${path}, ${stringValue})`;
        }

        return sql;
    }

    /**
     * Compile an update statement with joins or limit into SQL.
     */
    protected compileUpdateWithJoinsOrLimit(query: BuilderContract, values: RowValues): string {
        const table = this.wrapTable(query.getRegistry().from);
        const columns = this.compileUpdateColumns(query, values);
        const alias = this.getValue(query.getRegistry().from)
            .toString()
            .split(new RegExp(/\s+as\s+/, 'gmi'))
            .pop() as string;
        const selectSql = this.compileSelect(query.select(`${alias}.rowid`));

        return `update ${table} set ${columns} where ${this.wrap('rowid')} in (${selectSql})`;
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): any[] {
        const groups = this.groupJsonColumnsForUpdate(values);

        const filteredGroups = Object.keys(groups).reduce((acc: RowValues, key) => {
            acc[key] = Object.keys(groups[key])
                .filter(subkey => typeof groups[key][subkey] !== 'boolean')
                .reduce(
                    (acc: RowValues, subkey) => ({
                        ...acc,
                        [subkey]: groups[key][subkey]
                    }),
                    {}
                );

            return acc;
        }, {});

        const notJsonValues = Object.keys(values)
            .filter(key => !this.isJsonSelector(key))
            .reduce(
                (acc: RowValues, key) => ({
                    ...acc,
                    [key]: values[key]
                }),
                {}
            );

        values = merge(notJsonValues, filteredGroups);

        const valuesOfValues = Object.keys(values)
            .map(key => {
                const column = key.split('.').pop() as string;
                if (column in filteredGroups) {
                    const values = [];
                    for (const key in filteredGroups[column]) {
                        const value = filteredGroups[column][key];
                        values.push(
                            this.mustBeJsonStringified(value) ? JSON.stringify(value, stringifyReplacer(this)) : value
                        );
                    }
                    return values;
                } else {
                    return this.mustBeJsonStringified(values[key])
                        ? JSON.stringify(values[key], stringifyReplacer(this))
                        : values[key];
                }
            })
            .flat(1);

        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return valuesOfValues.concat(cleanBindings.flat(Infinity) as Binding[]);
    }

    /**
     * Compile a delete statement into SQL.
     */
    public compileDelete(query: BuilderContract): string {
        const joins = query.getRegistry().joins;
        const limit = query.getRegistry().limit;
        if (joins.length || limit) {
            return this.compileDeleteWithJoinsOrLimit(query);
        }

        return super.compileDelete(query);
    }

    /**
     * Compile a delete statement with joins or limit into SQL.
     */
    protected compileDeleteWithJoinsOrLimit(query: BuilderContract): string {
        const table = this.wrapTable(query.getRegistry().from);
        const alias = this.getValue(query.getRegistry().from)
            .toString()
            .split(new RegExp(/\s+as\s+/, 'gmi'))
            .pop() as string;
        const selectSql = this.compileSelect(query.select(`${alias}.rowid`));

        return `delete from ${table} where ${this.wrap('rowid')} in (${selectSql})`;
    }

    /**
     * Compile a truncate table statement into SQL.
     */
    public compileTruncate(query: BuilderContract): { [key: string]: Binding[] } {
        return {
            [`delete from sqlite_sequence where name = ?`]: [query.getRegistry().from],
            [`delete from ${this.wrapTable(query.getRegistry().from)}`]: []
        };
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(value: Stringable): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);

        return `json_extract(${field}${path})`;
    }
}

export default SQLiteGrammar;
