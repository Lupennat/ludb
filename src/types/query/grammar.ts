import ExpressionContract from '../../query/expression-contract';
import BaseGrammarI from '../base-grammar';
import { Binding, BindingExclude, BindingExcludeObject, Stringable } from '../generics';
import QueryBuilderI, { RowValues } from './query-builder';
import { BindingTypes } from './registry';

export default interface GrammarI extends BaseGrammarI {
    /**
     * Compile a select query into SQL.
     */
    compileSelect(query: QueryBuilderI): string;

    /**
     * Compile the "where" portions of the query.
     */
    compileWheres(query: QueryBuilderI): string;

    /**
     * Prepare the binding for a "JSON contains" statement.
     */
    prepareBindingForJsonContains(binding: Binding | Binding[]): Binding | Binding[];

    /**
     * Compile the random statement into SQL.
     */
    compileRandom(seed: string | number): string;

    /**
     * Compile an exists statement into SQL.
     */
    compileExists(query: QueryBuilderI): string;

    /**
     * Compile an insert statement into SQL.
     */
    compileInsert(query: QueryBuilderI, values: RowValues[] | RowValues): string;

    /**
     * Compile an insert ignore statement into SQL.
     */
    compileInsertOrIgnore(query: QueryBuilderI, values: RowValues[] | RowValues): string;

    /**
     * Compile an insert and get ID statement into SQL.
     */
    compileInsertGetId(query: QueryBuilderI, values: RowValues, sequence: string | null): string;

    /**
     * Compile an insert statement using a subquery into SQL.
     */
    compileInsertUsing(query: QueryBuilderI, columns: Stringable[], sql: string): string;

    /**
     * Compile an update statement into SQL.
     */
    compileUpdate(query: QueryBuilderI, values: RowValues): string;

    /**
     * Compile an update from statement into SQL.
     */
    compileUpdateFrom(query: QueryBuilderI, values: RowValues): string;

    /**
     * Compile an "upsert" statement into SQL.
     */
    compileUpsert(
        query: QueryBuilderI,
        values: RowValues[],
        uniqueBy: string[],
        update: Array<string | RowValues>
    ): string;

    /**
     * Prepare the bindings for an update statement.
     */
    prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): any[];

    /**
     * Prepare the bindings for an update statement.
     */
    prepareBindingsForUpdateFrom(bindings: BindingTypes, values: RowValues): any[];

    /**
     * Compile a delete statement into SQL.
     */
    compileDelete(query: QueryBuilderI): string;

    /**
     * Prepare the bindings for a delete statement.
     */
    prepareBindingsForDelete(bindings: BindingTypes): Binding[];

    /**
     * Compile a truncate table statement into SQL.
     */
    compileTruncate(query: QueryBuilderI): { [key: string]: Binding[] };

    /**
     * Determine if the grammar supports savepoints.
     */
    supportsSavepoints(): boolean;

    /**
     * Compile the SQL statement to define a savepoint.
     */
    compileSavepoint(name: string): string;

    /**
     * Compile the SQL statement to execute a savepoint rollback.
     */
    compileSavepointRollBack(name: string): string;

    /**
     * Substitute the given bindings into the given raw SQL query.
     */
    substituteBindingsIntoRawSql(
        sql: string,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): string;

    /**
     * Get the grammar specific operators.
     */
    getOperators(): string[];

    /**
     * Get the grammar specific bitwise operators.
     */
    getBitwiseOperators(): string[];

    /**
     * Escapes a value for safe SQL embedding.
     */
    escape(value: Binding): string;
}
