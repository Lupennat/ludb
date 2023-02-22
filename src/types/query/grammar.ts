import BuilderContract from '../../query/builder-contract';
import BaseGrammarI from '../base-grammar';
import { Binding, RowValues, Stringable } from './builder';
import { BindingTypes } from './registry';

export default interface GrammarI extends BaseGrammarI {
    /**
     * Compile a select query into SQL.
     */
    compileSelect(query: BuilderContract): string;

    /**
     * Compile the "where" portions of the query.
     */
    compileWheres(query: BuilderContract): string;

    /**
     * Prepare the binding for a "JSON contains" statement.
     */
    prepareBindingForJsonContains(binding: Binding | Binding[]): Binding | Binding[];

    /**
     * Compile a "JSON value cast" statement into SQL.
     */
    compileJsonValueCast(value: string): string;

    /**
     * Compile the random statement into SQL.
     */
    compileRandom(seed: string | number): string;

    /**
     * Compile an exists statement into SQL.
     */
    compileExists(query: BuilderContract): string;

    /**
     * Compile an insert statement into SQL.
     */
    compileInsert(query: BuilderContract, values: RowValues[] | RowValues): string;

    /**
     * Compile an insert ignore statement into SQL.
     */
    compileInsertOrIgnore(query: BuilderContract, values: RowValues[] | RowValues): string;

    /**
     * Compile an insert and get ID statement into SQL.
     */
    compileInsertGetId(query: BuilderContract, values: RowValues, sequence?: string | null): string;

    /**
     * Compile an insert statement using a subquery into SQL.
     */
    compileInsertUsing(query: BuilderContract, columns: Stringable[], sql: string): string;

    /**
     * Compile an update statement into SQL.
     */
    compileUpdate(query: BuilderContract, values: RowValues): string;

    /**
     * Compile an update from statement into SQL.
     */
    compileUpdateFrom(query: BuilderContract, values: RowValues): string;

    /**
     * Compile an "upsert" statement into SQL.
     */
    compileUpsert(
        query: BuilderContract,
        values: RowValues[] | RowValues,
        uniqueBy: string[],
        update: Array<string | RowValues>
    ): string;

    /**
     * Prepare the bindings for an update statement.
     */
    prepareBindingsForUpdate(bindings: BindingTypes, values: RowValues): Binding[];

    /**
     * Prepare the bindings for an update statement.
     */
    prepareBindingsForUpdateFrom(bindings: BindingTypes, values: RowValues): Binding[];

    /**
     * Compile a delete statement into SQL.
     */
    compileDelete(query: BuilderContract): string;

    /**
     * Prepare the bindings for a delete statement.
     */
    prepareBindingsForDelete(bindings: BindingTypes): Binding[];

    /**
     * Compile a truncate table statement into SQL.
     */
    compileTruncate(query: BuilderContract): { [key: string]: Binding[] };

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
     * Get the grammar specific operators.
     */
    getOperators(): string[];

    /**
     * Get the grammar specific bitwise operators.
     */
    getBitwiseOperators(): string[];
}
