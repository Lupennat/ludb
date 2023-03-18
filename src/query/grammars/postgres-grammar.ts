import { Binding, RowValues, Stringable } from '../../types/query/builder';
import { BindingTypes, HavingBasic, WhereBasic, WhereDateTime, whereFulltext } from '../../types/query/registry';
import { beforeLast, escapeQuoteForSql, merge, stringifyReplacer } from '../../utils';
import BuilderContract from '../builder-contract';
import Grammar from './grammar';

class PostgresGrammar extends Grammar {
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
        'between',
        'ilike',
        'not ilike',
        '~',
        '&',
        '|',
        '#',
        '<<',
        '>>',
        '<<=',
        '>>=',
        '&&',
        '@>',
        '<@',
        '?',
        '?|',
        '?&',
        '||',
        '-',
        '@?',
        '@@',
        '#-',
        'is distinct from',
        'is not distinct from'
    ];

    /**
     * The grammar specific bitwise operators.
     */
    protected bitwiseOperators: string[] = ['~', '&', '|', '#', '<<', '>>', '<<=', '>>='];

    /**
     * Compile a basic where clause.
     */
    protected compileWhereBasic(query: BuilderContract, where: WhereBasic): string {
        if (where.operator.toLowerCase().includes('like')) {
            return `${this.wrap(where.column)}::text ${where.operator} ${this.parameter(where.value)}`;
        }

        return super.compileWhereBasic(query, where);
    }

    /**
     * Compile a bitwise operator where clause.
     */
    protected compileWhereBitwise(_query: BuilderContract, where: WhereBasic): string {
        const value = this.parameter(where.value);
        const operator = where.operator.replace(/\?/g, '??');

        return `(${this.wrap(where.column)} ${operator} ${value})::bool`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected compileWhereDate(_query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `${this.wrap(where.column)}::date ${where.operator} ${value}`;
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(_query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `${this.wrap(where.column)}::time ${where.operator} ${value}`;
    }

    /**
     * Compile a date based where clause.
     */
    protected dateBasedWhere(type: string, _query: BuilderContract, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `extract(${type} from ${this.wrap(where.column)}) ${where.operator} ${value}`;
    }

    /**
     * Compile a "fulltext" statement into SQL.
     */
    public compileFulltext(_query: BuilderContract, where: whereFulltext): string {
        let language = where.options.language ?? 'english';

        if (!this.validFulltextLanguages().includes(language)) {
            language = 'english';
        }

        const columns = where.columns
            .map(column => {
                return `to_tsvector('${language}', ${this.wrap(column)})`;
            })
            .join(' || ');

        let mode = 'plainto_tsquery';

        if (where.options.mode === 'phrase') {
            mode = 'phraseto_tsquery';
        }

        if (where.options.mode === 'websearch') {
            mode = 'websearch_to_tsquery';
        }

        return `(${columns}) @@ ${mode}('${language}', ${this.parameter(where.value)})`;
    }

    /**
     * Get an array of valid full text languages.
     */
    protected validFulltextLanguages(): string[] {
        return [
            'simple',
            'arabic',
            'danish',
            'dutch',
            'english',
            'finnish',
            'french',
            'german',
            'hungarian',
            'indonesian',
            'irish',
            'italian',
            'lithuanian',
            'nepali',
            'norwegian',
            'portuguese',
            'romanian',
            'russian',
            'spanish',
            'swedish',
            'tamil',
            'turkish'
        ];
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

        const distinct = query.getRegistry().distinct;
        let select = '';

        if (Array.isArray(distinct)) {
            select = `select distinct on (${this.columnize(distinct)})`;
        } else if (distinct) {
            select = `select distinct`;
        } else {
            select = `select`;
        }

        return `${select} ${this.columnize(columns)}`;
    }

    /**
     * Compile a "JSON contains" statement into SQL.
     */
    protected compileJsonContains(column: Stringable, value: string): string {
        column = this.wrap(column).replace(/->>/g, '->');

        return `(${column})::jsonb @> ${value}`;
    }

    /**
     * Compile a "JSON contains key" statement into SQL.
     */
    protected compileJsonContainsKey(column: Stringable): string {
        const segments = this.getValue(column).toString().split('->');

        const lastSegment = segments.pop() as string;

        let index: null | number = null;
        const matches = lastSegment.match(/\[(-?[0-9]+)\]$/);

        if (matches !== null) {
            segments.push(beforeLast(lastSegment, matches[0]));
            index = Number(matches[1]);
        }

        column = this.wrap(segments.join('->')).replace(/->>/g, '->');

        if (index !== null) {
            return `case when jsonb_typeof((${column})::jsonb) = 'array' then jsonb_array_length((${column})::jsonb) >= ${
                index < 0 ? Math.abs(index) : index + 1
            } else false end`;
        }

        const key = `'${escapeQuoteForSql(lastSegment)}'`;

        return `coalesce((${column})::jsonb ?? ${key}, false)`;
    }

    /**
     * Compile a "JSON length" statement into SQL.
     */
    protected compileJsonLength(column: Stringable, operator: string, value: string): string {
        column = this.wrap(column).replace(/->>/g, '->');

        return `jsonb_array_length((${column})::jsonb) ${operator} ${value}`;
    }

    /**
     * Compile a having clause involving a bitwise operator.
     */
    protected compileHavingBitwise(_query: BuilderContract, having: HavingBasic): string {
        const column = this.wrap(having.column);
        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter})::bool`;
    }

    /**
     * Compile the lock into SQL.
     */
    protected compileLock(_query: BuilderContract, value: boolean | string): string {
        if (typeof value !== 'string') {
            return value ? 'for update' : 'for share';
        }

        return value;
    }

    /**
     * Compile an insert ignore statement into SQL.
     */
    public compileInsertOrIgnore(query: BuilderContract, values: RowValues[] | RowValues): string {
        return `${this.compileInsert(query, values)} on conflict do nothing`;
    }

    /**
     * Compile an insert and get ID statement into SQL.
     */
    public compileInsertGetId(query: BuilderContract, values: RowValues, sequence: string | null): string {
        return `${this.compileInsert(query, values)} returning ${this.wrap(sequence || 'id')}`;
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
            const path = `'{${this.wrapJsonPathAttributes(key.split('->'), '"').join(',')}}'`;
            const value = this.isExpression(values[key]) ? `'${this.parameter(values[key])}'` : '?::jsonb';
            sql = `jsonb_set(${sql === '' ? column + '::jsonb' : sql}, ${path}, ${value})`;
        }
        return sql;
    }

    /**
     * Compile an update from statement into SQL.
     */
    public compileUpdateFrom(query: BuilderContract, values: RowValues): string {
        const table = this.wrapTable(query.getRegistry().from);

        // Each one of the columns in the update statements needs to be wrapped in the
        // keyword identifiers, also a place-holder needs to be created for each of
        // the values in the list of bindings so we can make the sets statements.
        const columns = this.compileUpdateColumns(query, values);

        let from = '';

        const joins = query.getRegistry().joins;

        if (joins.length > 0) {
            // When using Postgres, updates with joins list the joined tables in the from
            // clause, which is different than other systems like MySQL. Here, we will
            // compile out the tables that are joined and add them to a from clause.
            from =
                ' from ' +
                joins
                    .map(join => {
                        return this.wrapTable(join.table);
                    })
                    .join(', ');
        }

        const where = this.compileUpdateWheres(query);

        return `update ${table} set ${columns}${from} ${where}`.trim();
    }

    /**
     * Compile the additional where clauses for updates with joins.
     */
    protected compileUpdateWheres(query: BuilderContract): string {
        const baseWheres = this.compileWheres(query);

        if (query.getRegistry().joins.length === 0) {
            return baseWheres;
        }

        // Once we compile the join constraints, we will either use them as the where
        // clause or append them to the existing base where clauses. If we need to
        // strip the leading boolean we will do so when using as the only where.
        const joinWheres = this.compileUpdateJoinWheres(query);

        if (baseWheres.trim() === '') {
            return `where ${this.removeLeadingBoolean(joinWheres)}`;
        }

        return `${baseWheres} ${joinWheres}`;
    }

    /**
     * Compile the "join" clause where clauses for an update.
     */
    protected compileUpdateJoinWheres(query: BuilderContract): string {
        const joinWheres = [];

        // Here we will just loop through all of the join constraints and compile them
        // all out then implode them. This should give us "where" like syntax after
        // everything has been built and then we will join it to the real wheres.
        for (const join of query.getRegistry().joins) {
            for (const where of join.getRegistry().wheres) {
                joinWheres.push(`${where.boolean} ${this.compileWhere(query, where)}`);
            }
        }

        return joinWheres.join(' ');
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

        const selectSql = this.compileSelect(query.select(`${alias}.ctid`));

        return `update ${table} set ${columns} where ${this.wrap('ctid')} in (${selectSql})`;
    }

    /**
     * Prepare Values For Update
     */
    protected prepareValuesForUpdate(values: RowValues): any[] {
        const groups = this.groupJsonColumnsForUpdate(values);
        const filteredGroups = Object.keys(groups).reduce((acc: RowValues, key) => {
            acc[key] = Object.keys(groups[key])
                .filter(subkey => !this.isExpression(groups[key][subkey]))
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

        return Object.keys(values)
            .map(key => {
                const column = key.split('.').pop() as string;
                if (column in filteredGroups) {
                    const values = [];
                    for (const key in filteredGroups[column]) {
                        const value = filteredGroups[column][key];
                        values.push(
                            typeof value === 'bigint'
                                ? value.toString()
                                : JSON.stringify(value, stringifyReplacer(this))
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
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdateFrom(bindings: BindingTypes, values: RowValues): any[] {
        const bindingsWithoutWhere = Object.keys(bindings)
            .filter(key => !['select', 'where'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return this.prepareValuesForUpdate(values).concat(
            bindings.where,
            bindingsWithoutWhere.flat(Infinity) as Binding[]
        );
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): any[] {
        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return this.prepareValuesForUpdate(values).concat(cleanBindings.flat(Infinity) as Binding[]);
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
        const selectSql = this.compileSelect(query.select(`${alias}.ctid`));

        return `delete from ${table} where ${this.wrap('ctid')} in (${selectSql})`;
    }

    /**
     * Compile a truncate table statement into SQL.
     */
    public compileTruncate(query: BuilderContract): { [key: string]: Binding[] } {
        return { [`truncate ${this.wrapTable(query.getRegistry().from)} restart identity cascade`]: [] };
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(value: Stringable): string {
        const path = this.getValue(value).toString().split('->');

        const field = this.wrapSegments((path.shift() as string).split('.'));

        const wrappedPath = this.wrapJsonPathAttributes(path);
        const attribute = wrappedPath.pop();

        if (wrappedPath.length > 0) {
            return `${field}->${wrappedPath.join('->')}->>${attribute}`;
        }

        return `${field}->>${attribute}`;
    }

    /**
     * Wrap the given JSON selector for boolean values.
     */
    protected wrapJsonBooleanSelector(value: Stringable): string {
        const selector = this.wrapJsonSelector(value).replace(/->>/g, '->');

        return `(${selector})::jsonb`;
    }

    /**
     * Wrap the given JSON boolean value.
     */
    protected wrapJsonBooleanValue(value: Stringable): string {
        return `'${this.getValue(value).toString()}'::jsonb`;
    }

    /**
     * Wrap the attributes of the given JSON path.
     */
    protected wrapJsonPathAttributes(path: string[], quote = "'"): string[] {
        return path
            .map(attribute => this.parseJsonPathArrayKeys(attribute))
            .reduce((carry, item) => {
                return carry.concat(item);
            }, [] as string[])
            .map(item => {
                return Number.isInteger(Number(item)) ? item : `${quote}${item}${quote}`;
            });
    }

    /**
     * Parse the given JSON path attribute for array keys.
     */
    protected parseJsonPathArrayKeys(attribute: string): string[] {
        const regex = new RegExp(/(\[[^\]]+\])+$/, 'g');
        const parts = attribute.match(regex);

        if (parts !== null) {
            const key = beforeLast(attribute, parts[0]);
            const keyRegex = new RegExp(/\[([^\]]+)\]/, 'g');
            const keys = [...parts[0].matchAll(keyRegex)];
            return (key !== '' ? [key] : []).concat(keys.map(key => key[1]));
        }

        return [attribute];
    }
}

export default PostgresGrammar;
