import { Binding, Stringable } from '../../types/generics';
import GrammarBuilderI, { RowValues } from '../../types/query/grammar-builder';
import { BindingTypes, HavingBasic, WhereBasic, WhereDateTime, whereFulltext } from '../../types/query/registry';
import { beforeLast, escapeQuoteForSql, stringifyReplacer } from '../../utils';
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
    protected compileWhereBasic(query: GrammarBuilderI, where: WhereBasic): string {
        if (where.operator.toLowerCase().includes('like')) {
            return `${this.wrap(where.column)}::text ${where.operator} ${this.parameter(where.value)}`;
        }

        return super.compileWhereBasic(query, where);
    }

    /**
     * Compile a bitwise operator where clause.
     */
    protected compileWhereBitwise(_query: GrammarBuilderI, where: WhereBasic): string {
        const value = this.parameter(where.value);
        const operator = where.operator.replace(/\?/g, '??');

        return `(${this.wrap(where.column)} ${operator} ${value})::bool`;
    }

    /**
     * Compile a "where date" clause.
     */
    protected compileWhereDate(_query: GrammarBuilderI, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `${this.wrap(where.column)}::date ${where.operator} ${value}`;
    }

    /**
     * Compile a "where time" clause.
     */
    protected compileWhereTime(_query: GrammarBuilderI, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `${this.wrap(where.column)}::time ${where.operator} ${value}`;
    }

    /**
     * Compile a date based where clause.
     */
    protected dateBasedWhere(type: string, _query: GrammarBuilderI, where: WhereDateTime): string {
        const value = this.parameter(where.value);

        return `extract(${type} from ${this.wrap(where.column)}) ${where.operator} ${value}`;
    }

    /**
     * Compile a "fulltext" statement into SQL.
     */
    public compileFulltext(_query: GrammarBuilderI, where: whereFulltext): string {
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
    protected compileColumns(query: GrammarBuilderI, columns: Stringable[]): string {
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
        column = this.convertJsonArrowPathToJsonBracePath(column);
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
    protected compileHavingBitwise(_query: GrammarBuilderI, having: HavingBasic): string {
        const column = this.wrap(having.column);
        const parameter = this.parameter(having.value);

        return `(${column} ${having.operator} ${parameter})::bool`;
    }

    /**
     * Compile the lock into SQL.
     */
    protected compileLock(_query: GrammarBuilderI, value: boolean | string): string {
        if (typeof value !== 'string') {
            return value ? 'for update' : 'for share';
        }

        return value;
    }

    /**
     * Compile an insert ignore statement into SQL.
     */
    public compileInsertOrIgnore(query: GrammarBuilderI, values: RowValues[] | RowValues): string {
        return `${this.compileInsert(query, values)} on conflict do nothing`;
    }

    /**
     * Compile an insert and get ID statement into SQL.
     */
    public compileInsertGetId(query: GrammarBuilderI, values: RowValues, sequence: string | null): string {
        return `${this.compileInsert(query, values)} returning ${this.wrap(sequence || 'id')}`;
    }

    /**
     * Compile an update statement into SQL.
     */
    public compileUpdate(query: GrammarBuilderI, values: RowValues): string {
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
    protected compileUpdateColumns(_query: GrammarBuilderI, values: RowValues): string {
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
        query: GrammarBuilderI,
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
            sql = `jsonb_set(${sql === '' ? this.wrap(column) + '::jsonb' : sql}, ${path}, ${value})`;
        }
        return sql;
    }

    /**
     * Compile an update from statement into SQL.
     */
    public compileUpdateFrom(query: GrammarBuilderI, values: RowValues): string {
        const expressions = query.getRegistry().expressions;

        const expressionsSql = expressions.length > 0 ? this.compileExpressions(query, expressions) + ' ' : '';

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

        return `${expressionsSql}update ${table} set ${columns}${from} ${where}`.trim();
    }

    /**
     * Compile the additional where clauses for updates with joins.
     */
    protected compileUpdateWheres(query: GrammarBuilderI): string {
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
    protected compileUpdateJoinWheres(query: GrammarBuilderI): string {
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
    protected compileUpdateWithJoinsOrLimit(query: GrammarBuilderI, values: RowValues): string {
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
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdateFrom(query: GrammarBuilderI, bindings: BindingTypes, values: RowValues): any[] {
        const cleanBindings = Object.keys(bindings)
            .filter(key => !['select', 'where', 'expressions'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);

        return this.mergeBindingsAndValue(
            cleanBindings,
            bindings.expressions.concat(this.prepareValuesForMerge(query, values), bindings.where)
        );
    }

    /**
     * Prepare the bindings for an update statement.
     */
    public prepareBindingsForUpdate(query: GrammarBuilderI, bindings: BindingTypes, values: RowValues): any[] {
        if (query.getRegistry().joins.length || query.getRegistry().limit) {
            return this.mergeBindingsAndValue(
                this.prepareBindingsForMerge(query, bindings),
                this.prepareValuesForMerge(query, values)
            );
        }

        return this.mergeBindingsAndValue(
            this.prepareBindingsForMerge(query, bindings),
            bindings.expressions.concat(this.prepareValuesForMerge(query, values))
        );
    }

    /**
     * Prepare Bindings for merge
     */
    protected prepareBindingsForMerge(query: GrammarBuilderI, bindings: BindingTypes): Binding[][] {
        if (query.getRegistry().joins.length || query.getRegistry().limit) {
            return Object.keys(bindings)
                .filter(key => !['select'].includes(key))
                .map(key => bindings[key as keyof BindingTypes]);
        }

        return Object.keys(bindings)
            .filter(key => !['select', 'expressions'].includes(key))
            .map(key => bindings[key as keyof BindingTypes]);
    }

    /**
     * Prepare values for merge
     */
    protected prepareValuesForMerge(_query: GrammarBuilderI, values: RowValues): any[] {
        const [combinedValues, jsonKeys] = this.combineJsonValues(values);

        return Object.keys(combinedValues).reduce((acc: any[], key: string) => {
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
                        typeof value === 'bigint' ? value.toString() : JSON.stringify(value, stringifyReplacer(this))
                    );
                }
            }

            return acc;
        }, []);
    }

    /**
     * Compile a delete statement into SQL.
     */
    public compileDelete(query: GrammarBuilderI): string {
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
    protected compileDeleteWithJoinsOrLimit(query: GrammarBuilderI): string {
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
    public compileTruncate(query: GrammarBuilderI): { [key: string]: Binding[] } {
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

    /**
     * Escape a binary value for safe SQL embedding.
     */
    protected escapeBinary(value: Buffer): string {
        return `x'${value.toString('hex')}'::bytea`;
    }

    /**
     * Escape a bool value for safe SQL embedding.
     */
    protected escapeBool(value: boolean): string {
        return value ? 'true' : 'false';
    }
}

export default PostgresGrammar;
