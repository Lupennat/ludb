import { ConnectionSessionI } from '..';
import Blueprint from '../../schema/blueprint';
import { Stringable } from '../query/builder';
import BlueprintI from './blueprint';
import GrammarI from './grammar';

export type MorphKeyType = 'int' | 'ulid' | 'uuid';

export type BlueprintCallback = (blueprint: Blueprint) => void;

export type BlueprintResolver = (
    table: string,
    grammar: GrammarI,
    callback?: BlueprintCallback,
    prefix?: string
) => BlueprintI;

export default interface Builder {
    /**
     * Create a database in the schema.
     */
    createDatabase(_name: string): Promise<boolean>;
    /**
     * Drop all tables from the database.
     */
    dropAllTables(): Promise<void>;
    /**
     * Drop all types from the database.
     */
    dropAllTypes(): Promise<void>;
    /**
     * Drop all views from the database.
     */
    dropAllViews(): Promise<void>;
    /**
     * Drop a database from the schema if the database exists.
     */
    dropDatabaseIfExists(_name: string): Promise<boolean>;
    /**
     * Get all of the table names for the database.
     */
    getAllTables(): Promise<string[]>;
    /**
     * Get all of the view names for the database.
     */
    getAllViews(): Promise<string[]>;
    /**
     * Get all of the type names for the database.
     */
    getAllTypes(): Promise<string[]>;
    /**
     * Determine if the given table exists.
     */
    hasTable(table: string): Promise<boolean>;
    /**
     * Determine if the given table has a given column.
     */
    hasColumn(table: string, column: string): Promise<boolean>;
    /**
     * Determine if the given table has given columns.
     */
    hasColumns(table: string, columns: string[]): Promise<boolean>;
    /**
     * Execute a table builder callback if the given table has a given column.
     */
    whenTableHasColumn(table: string, column: string, callback: BlueprintCallback): Promise<void>;
    /**
     * Execute a table builder callback if the given table doesn't have a given column.
     */
    whenTableDoesntHaveColumn(table: string, column: string, callback: BlueprintCallback): Promise<void>;
    /**
     * Get the data type for the given column name.
     */
    getColumnType(_table: string, _column: string): Promise<string>;
    /**
     * Get the column listing for a given table.
     */
    getColumnListing(_table: string): Promise<string[]>;
    /**
     * Modify a table on the schema.
     */
    table(table: string, callback: BlueprintCallback): Promise<void>;
    /**
     * Create a new table on the schema.
     */
    create(table: string, callback: BlueprintCallback): Promise<void>;
    /**
     * Drop a table from the schema.
     */
    drop(table: string): Promise<void>;
    /**
     * Drop a table from the schema if it exists.
     */
    dropIfExists(table: string): Promise<void>;
    /**
     * Drop columns from a table schema.
     */
    dropColumns(table: string, columns: Stringable | Stringable[]): Promise<void>;
    /**
     * Rename a table on the schema.
     */
    rename(from: string, to: Stringable): Promise<void>;
    /**
     * Enable foreign key constraints.
     */
    enableForeignKeyConstraints(): Promise<boolean>;
    /**
     * Disable foreign key constraints.
     */
    disableForeignKeyConstraints(): Promise<boolean>;
    /**
     * Disable foreign key constraints during the execution of a callback.
     */
    withoutForeignKeyConstraints<T>(callback: () => T): Promise<T | void>;
    /**
     * Get the database connection instance.
     */
    getConnection(): ConnectionSessionI;
    /**
     * Set the database connection instance.
     */
    setConnection(connection: ConnectionSessionI): this;
}
