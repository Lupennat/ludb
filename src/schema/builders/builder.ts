/* eslint-disable @typescript-eslint/no-unused-vars */

import { ConnectionSessionI } from '../../types';
import { Stringable } from '../../types/query/builder';
import BlueprintI from '../../types/schema/blueprint';
import BuilderI, { BlueprintCallback, BlueprintResolver, MorphKeyType } from '../../types/schema/builder';
import Blueprint from '../blueprint';

class Builder implements BuilderI {
    /**
     * The schema grammar instance.
     */
    protected grammar;

    /**
     * The Blueprint resolver callback.
     */
    protected resolver: BlueprintResolver | null = null;

    /**
     * The default string length for migrations.
     */
    public static defaultStringLength = 255;

    /**
     * The default relationship morph key type.
     */
    public static defaultMorphKeyType: MorphKeyType = 'int';

    /**
     * Create a new database Schema manager.
     */
    constructor(protected connection: ConnectionSessionI) {
        this.grammar = connection.getSchemaGrammar();
    }

    /**
     * Set the default string length for migrations.
     */
    public static withDefaultStringLength(length: number): void {
        Builder.defaultStringLength = length;
    }

    /**
     * Set the default morph key type for migrations.
     */
    public static withDefaultMorphKeyType(type: MorphKeyType): void {
        if (!['int', 'uuid', 'ulid'].includes(type)) {
            throw new TypeError("Morph key type must be 'int', 'uuid', or 'ulid'.");
        }

        Builder.defaultMorphKeyType = type;
    }

    /**
     * Set the default morph key type for migrations to UUIDs.
     */
    public static morphUsingUuids(): void {
        Builder.withDefaultMorphKeyType('uuid');
    }

    /**
     * Set the default morph key type for migrations to ULIDs.
     */
    public static morphUsingUlids(): void {
        Builder.withDefaultMorphKeyType('ulid');
    }

    /**
     * Set the default morph key type for migrations to INTs.
     */
    public static morphUsingInts(): void {
        Builder.withDefaultMorphKeyType('int');
    }

    /**
     * Create a database in the schema.
     */
    public async createDatabase(_name: string): Promise<boolean> {
        throw new Error('This database driver does not support creating databases.');
    }

    /**
     * Drop all tables from the database.
     */
    public async dropAllTables(): Promise<void> {
        throw new Error('This database driver does not support dropping tables.');
    }

    /**
     * Drop all types from the database.
     */
    public async dropAllTypes(): Promise<void> {
        throw new Error('This database driver does not support dropping types.');
    }

    /**
     * Drop all views from the database.
     */
    public async dropAllViews(): Promise<void> {
        throw new Error('This database driver does not support dropping views.');
    }

    /**
     * Drop a database from the schema if the database exists.
     */
    public async dropDatabaseIfExists(_name: string): Promise<boolean> {
        throw new Error('This database driver does not support dropping databases.');
    }

    /**
     * Get all of the table names for the database.
     */
    public async getAllTables(): Promise<string[]> {
        throw new Error('This database driver does not support retrieval of table names.');
    }

    /**
     * Get all of the view names for the database.
     */
    public async getAllViews(): Promise<string[]> {
        throw new Error('This database driver does not support retrieval of view names.');
    }

    /**
     * Get all of the type names for the database.
     */
    public async getAllTypes(): Promise<string[]> {
        throw new Error('This database driver does not support retrieval of type names.');
    }

    /**
     * Determine if the given table exists.
     */
    public async hasTable(table: string): Promise<boolean> {
        table = `${this.connection.getTablePrefix()}${table}`;

        return (await this.connection.selectFromWriteConnection(this.grammar.compileTableExists(), [table])).length > 0;
    }

    /**
     * Determine if the given table has a given column.
     */
    public async hasColumn(table: string, column: string): Promise<boolean> {
        return (await this.getColumnListing(table)).map(column => column.toLowerCase()).includes(column.toLowerCase());
    }

    /**
     * Determine if the given table has given columns.
     */
    public async hasColumns(table: string, columns: string[]): Promise<boolean> {
        const tableColumns = (await this.getColumnListing(table)).map(column => column.toLowerCase());

        for (const column of columns) {
            if (!tableColumns.includes(column.toLowerCase())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute a table builder callback if the given table has a given column.
     */
    public async whenTableHasColumn(table: string, column: string, callback: BlueprintCallback): Promise<void> {
        if (await this.hasColumn(table, column)) {
            await this.table(table, blueprint => callback(blueprint));
        }
    }

    /**
     * Execute a table builder callback if the given table doesn't have a given column.
     */
    public async whenTableDoesntHaveColumn(table: string, column: string, callback: BlueprintCallback): Promise<void> {
        if (!(await this.hasColumn(table, column))) {
            await this.table(table, blueprint => callback(blueprint));
        }
    }

    /**
     * Get the data type for the given column name.
     */
    public async getColumnType(_table: string, _column: string): Promise<string> {
        throw new Error('This database driver does not support column type.');
    }

    /**
     * Get the column listing for a given table.
     */
    public async getColumnListing(_table: string): Promise<string[]> {
        throw new Error('This database driver does not support column listing.');
    }

    /**
     * Modify a table on the schema.
     */
    public async table(table: string, callback: BlueprintCallback): Promise<void> {
        await this.build(this.createBlueprint(table, callback));
    }

    /**
     * Create a new table on the schema.
     */
    public async create(table: string, callback: BlueprintCallback): Promise<void> {
        const blueprint = this.createBlueprint(table, blueprint => {
            blueprint.create();
            callback(blueprint);
        });
        await this.build(blueprint);
    }

    /**
     * Drop a table from the schema.
     */
    public async drop(table: string): Promise<void> {
        const blueprint = this.createBlueprint(table, blueprint => {
            blueprint.drop();
        });
        await this.build(blueprint);
    }

    /**
     * Drop a table from the schema if it exists.
     */
    public async dropIfExists(table: string): Promise<void> {
        const blueprint = this.createBlueprint(table, blueprint => {
            blueprint.dropIfExists();
        });
        await this.build(blueprint);
    }

    /**
     * Drop columns from a table schema.
     */
    public async dropColumns(table: string, columns: Stringable | Stringable[]): Promise<void> {
        await this.table(table, blueprint => {
            blueprint.dropColumn(columns);
        });
    }

    /**
     * Rename a table on the schema.
     */
    public async rename(from: string, to: Stringable): Promise<void> {
        const blueprint = this.createBlueprint(from, blueprint => {
            blueprint.rename(to);
        });
        await this.build(blueprint);
    }

    /**
     * Enable foreign key constraints.
     */
    public async enableForeignKeyConstraints(): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileEnableForeignKeyConstraints());
    }

    /**
     * Disable foreign key constraints.
     */
    public async disableForeignKeyConstraints(): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileDisableForeignKeyConstraints());
    }

    /**
     * Disable foreign key constraints during the execution of a callback.
     */
    public async withoutForeignKeyConstraints<T>(callback: () => T): Promise<T> {
        await this.disableForeignKeyConstraints();

        const result = callback();

        await this.enableForeignKeyConstraints();

        return result;
    }

    /**
     * Execute the blueprint to build / modify the table.
     */
    protected async build(blueprint: BlueprintI): Promise<void> {
        await blueprint.build(this.connection);
    }

    /**
     * Create a new command set with a Closure.
     */
    protected createBlueprint(table: string, callback?: BlueprintCallback): BlueprintI {
        const prefix = this.connection.getConfig<boolean>('prefix_indexes')
            ? this.connection.getConfig<string>('prefix')
            : '';

        if (typeof this.resolver === 'function') {
            return this.resolver(table, this.grammar, callback, prefix);
        }

        return new Blueprint(table, this.grammar, callback, prefix);
    }

    /**
     * Get the database connection instance.
     */
    public getConnection(): ConnectionSessionI {
        return this.connection;
    }

    /**
     * Set the database connection instance.
     */
    public setConnection(connection: ConnectionSessionI): this {
        this.connection = connection;

        return this;
    }

    /**
     * Set the Schema Blueprint resolver callback.
     */
    public blueprintResolver(resolver: BlueprintResolver): this {
        this.resolver = resolver;

        return this;
    }
}

export default Builder;
