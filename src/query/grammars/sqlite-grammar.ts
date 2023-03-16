import set from 'set-value';
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
        const [groupKeys, patchedValues] = this.groupJsonColumnsForUpdate(values);

        return Object.keys(patchedValues)
            .map(key => {
                const column = key.split('.').pop() as string;
                const value = groupKeys.includes(key)
                    ? this.compileJsonPatch(column, patchedValues[key])
                    : this.parameter(patchedValues[key]);

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
     * Group the nested JSON columns.
     */
    protected groupJsonColumnsForUpdate(values: RowValues): [string[], RowValues] {
        const groups: RowValues = {};
        const groupKeys: RowValues = {};

        for (const key in values) {
            let newKey = key;
            if (this.isJsonSelector(key)) {
                const exploded = key.split('.');
                if (exploded.length > 1) {
                    exploded.shift();
                }
                newKey = exploded.join('.').replace(/->/g, '.');
                set(groupKeys, newKey, values[key]);
                continue;
            }

            set(groups, newKey, values[key]);
        }

        for (const key in groupKeys) {
            let value = groupKeys[key];
            if (key in groups) {
                value = merge(value, groups[key]);
                delete groups[key];
            }

            set(groups, key, value);
        }

        return [Object.keys(groupKeys), groups];
    }

    /**
     * Compile a "JSON" patch statement into SQL.
     */
    protected compileJsonPatch(column: string, value: Binding | Binding[]): string {
        return `json_patch(ifnull(${this.wrap(column)}, json('{}')), json(${this.parameter(value)}))`;
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
        const [, patchedValues] = this.groupJsonColumnsForUpdate(values);
        const valuesOfValues = Object.keys(patchedValues).map(key => {
            return this.mustBeJsonStringified(patchedValues[key])
                ? JSON.stringify(patchedValues[key], stringifyReplacer(this))
                : patchedValues[key];
        });

        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return Object.values(valuesOfValues).concat(cleanBindings.flat(Infinity) as Binding[]);
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
