import { ConnectionSessionI } from '../..';
import Blueprint from '../../../schema/blueprint';
import CommandViewDefinition from '../../../schema/definitions/commands/command-view-definition';
import { Stringable } from '../../generics';
import BlueprintI from '../blueprint';
import {
    ColumnDictionary,
    ForeignKeyDictionary,
    IndexDictionary,
    TableDictionary,
    TypeDictionary,
    ViewDictionary
} from '../generics';
import GrammarI from '../grammar';
import { ViewRegistryI } from '../registry';

export type MorphKeyType = 'int' | 'ulid' | 'uuid';

export type BlueprintCallback = (blueprint: Blueprint) => void;

export type ViewCallback = (definition: CommandViewDefinition<ViewRegistryI>) => CommandViewDefinition<ViewRegistryI>;

export type BlueprintResolver = (
    table: string,
    grammar: GrammarI,
    callback?: BlueprintCallback,
    prefix?: string
) => BlueprintI;

export default interface SchemaBuilder {
    /**
     * Create a database in the schema.
     */
    createDatabase(name: string): Promise<boolean>;

    /**
     * Drop all tables from the database.
     */
    dropTables(): Promise<void>;
    /**
     * Drop all types from the database.
     */
    dropTypes(): Promise<void>;
    /**
     * Drop all views from the database.
     */
    dropViews(): Promise<void>;
    /**
     * Drop a database from the schema if the database exists.
     */
    dropDatabaseIfExists(name: string): Promise<boolean>;
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<TableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<ViewDictionary[]>;
    /**
     * Get the user-defined types that belong to the database.
     */
    getTypes(): Promise<TypeDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<ColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<IndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<ForeignKeyDictionary[]>;
    /**
     * Determine if the given table exists.
     */
    hasTable(table: string): Promise<boolean>;
    /**
     * Determine if the given view exists.
     */
    hasView(view: string): Promise<boolean>;
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
    getColumnType(table: string, column: string, fullDefinition?: boolean): Promise<string>;
    /**
     * Modify a table on the schema.
     */
    table(table: string, callback: BlueprintCallback): Promise<void>;
    /**
     * Create a new table on the schema.
     */
    create(table: string, callback: BlueprintCallback): Promise<void>;
    /**
     * Create a new table on the schema.
     */
    createView(view: Stringable, callback: ViewCallback): Promise<boolean>;
    /**
     * Drop a table from the schema.
     */
    drop(table: string): Promise<void>;
    /**
     * Drop a table from the schema if it exists.
     */
    dropTableIfExists(table: string): Promise<void>;
    /**
     * Drop a view from the schema if it exists.
     */
    dropViewIfExists(view: string): Promise<boolean>;
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
