import { Binding, Stringable } from '../../types/generics';
import QueryBuilderI, { RowValues } from '../../types/query/query-builder';
import { BindingTypes, WhereDateTime } from '../../types/query/registry';
import { stringifyReplacer } from '../../utils';
import IndexHint from '../index-hint';
import Grammar from './grammar';

class SqliteGrammar extends Grammar {
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
    protected compileWhereDate(query: QueryBuilderI, where: WhereDateTime): string {
        return this.dateBasedWhere('%Y-%m-%d', query, where);
    }

    /**
     * Compile a "where day" clause.
     */
    protected compileWhereDay(query: QueryBuilderI, where: WhereDateTime): string {
        return this.dateBasedWhere('%d', query, where);
    }

    /**
     * Compile a "where month" clause.
     */
    protected compileWhereMonth(query: QueryBuilderI, where: WhereDateTime): string {
        return this.dateBasedWhere('%m', query, where);
    }

    /**
     * Compile a "where year" clause.
     */
    protected compileWhereYear(query: QueryBuilderI, where: WhereDateTime): string {
        return this.dateBasedWhere('%Y', query, where);
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(query: QueryBuilderI, where: WhereDateTime): string {
        return this.dateBasedWhere('%H:%M:%S', query, where);
    }

    /**
     * Compile a date based where clause.
     */
    protected dateBasedWhere(type: string, _query: QueryBuilderI, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `strftime('${type}', ${this.wrap(where.column)}) ${where.operator} cast(${value} as text)`;
    }

    /**
     * Compile the index hints for the query.
     */
    protected compileIndexHint(_query: QueryBuilderI, indexHint: IndexHint): string {
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
        column = this.convertJsonArrowPathToJsonBracePath(column);

        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_type(${field}${path}) is not null`;
    }

    /**
     * Compile an update statement into SQL.
     */
    public compileUpdate(query: QueryBuilderI, values: RowValues): string {
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
    public compileInsertOrIgnore(query: QueryBuilderI, values: RowValues[] | RowValues): string {
        return this.compileInsert(query, values).replace('insert', 'insert or ignore');
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
     * Compile an "upsert" statement into SQL.
     */
    public compileUpsert(
        query: QueryBuilderI,
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
     * Compile a "JSON set" statement into SQL.
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

            sql = `json_set(${sql === '' ? this.wrap(column) : sql}, ${path}, ${stringValue})`;
        }

        return sql;
    }

    /**
     * Compile an update statement with joins or limit into SQL.
     */
    protected compileUpdateWithJoinsOrLimit(query: QueryBuilderI, values: RowValues): string {
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
                    if (this.isExpression(value) || typeof value === 'boolean') {
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
     * Compile a delete statement into SQL.
     */
    public compileDelete(query: QueryBuilderI): string {
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
    protected compileDeleteWithJoinsOrLimit(query: QueryBuilderI): string {
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
    public compileTruncate(query: QueryBuilderI): { [key: string]: Binding[] } {
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

    /**
     * Escape a binary value for safe SQL embedding.
     */
    protected escapeBinary(value: Buffer): string {
        return `x'${value.toString('hex')}'`;
    }
}

export default SqliteGrammar;
