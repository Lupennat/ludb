/* eslint-disable @typescript-eslint/no-unused-vars */

import { GrammarBuilder } from '../../query';
import DriverConnectionI, { ConnectionSessionI } from '../../types/connection';
import { Stringable } from '../../types/generics';
import BlueprintI from '../../types/schema/blueprint';
import SchemaBuilderI, {
    BlueprintCallback,
    BlueprintResolver,
    MorphKeyType,
    ViewCallback
} from '../../types/schema/builder/schema-builder';
import {
    ColumnDictionary,
    ForeignKeyDictionary,
    IndexDictionary,
    TableDictionary,
    TypeDictionary,
    ViewDictionary
} from '../../types/schema/generics';
import { ViewRegistryI } from '../../types/schema/registry';
import Blueprint from '../blueprint';
import CommandViewDefinition from '../definitions/commands/command-view-definition';

class QueryBuilder<Session extends ConnectionSessionI<DriverConnectionI> = ConnectionSessionI<DriverConnectionI>>
    implements SchemaBuilderI<Session>
{
    /**
     * The schema grammar instance.
     */
    protected grammar: ReturnType<Session['getSchemaGrammar']>;

    /**
     * The Blueprint resolver callback.
     */
    protected resolver: BlueprintResolver | null = null;

    /**
     * The default string length for migrations.
     */
    public static defaultStringLength: number | undefined = 255;

    /**
     * The default relationship morph key type.
     */
    public static defaultMorphKeyType: MorphKeyType = 'int';

    /**
     * Create a new database Schema manager.
     */
    constructor(protected connection: Session) {
        this.grammar = connection.getSchemaGrammar() as ReturnType<Session['getSchemaGrammar']>;
    }

    /**
     * Set the default string length for migrations.
     */
    public static withDefaultStringLength(length: number): void {
        QueryBuilder.defaultStringLength = length;
    }

    /**
     * UnSet the default string length for migrations.
     */
    public static withoutDefaultStringLength(): void {
        QueryBuilder.defaultStringLength = undefined;
    }

    /**
     * Set the default morph key type for migrations.
     */
    public static withDefaultMorphKeyType(type: MorphKeyType): void {
        if (!['int', 'uuid', 'ulid'].includes(type)) {
            throw new TypeError("Morph key type must be 'int', 'uuid', or 'ulid'.");
        }

        QueryBuilder.defaultMorphKeyType = type;
    }

    /**
     * Set the default morph key type for migrations to UUIDs.
     */
    public static morphUsingUuids(): void {
        QueryBuilder.withDefaultMorphKeyType('uuid');
    }

    /**
     * Set the default morph key type for migrations to ULIDs.
     */
    public static morphUsingUlids(): void {
        QueryBuilder.withDefaultMorphKeyType('ulid');
    }

    /**
     * Set the default morph key type for migrations to INTs.
     */
    public static morphUsingInts(): void {
        QueryBuilder.withDefaultMorphKeyType('int');
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
    public async dropTables(): Promise<void> {
        throw new Error('This database driver does not support dropping tables.');
    }

    /**
     * Drop all types from the database.
     */
    public async dropTypes(): Promise<void> {
        throw new Error('This database driver does not support dropping types.');
    }

    /**
     * Drop all views from the database.
     */
    public async dropViews(): Promise<void> {
        throw new Error('This database driver does not support dropping views.');
    }

    /**
     * Drop a view from the schema if it exists.
     */
    public async dropView(_view: Stringable): Promise<boolean> {
        throw new Error('This database driver does not support dropping views.');
    }

    /**
     * Drop a view from the schema if it exists.
     */
    public async dropViewIfExists(_view: Stringable): Promise<boolean> {
        throw new Error('This database driver does not support dropping views.');
    }

    /**
     * Drop a type from the schema if it exists.
     */
    public async dropType(_type: Stringable): Promise<boolean> {
        throw new Error('This database driver does not support dropping types.');
    }

    /**
     * Drop a type from the schema if it exists.
     */
    public async dropTypeIfExists(_type: Stringable): Promise<boolean> {
        throw new Error('This database driver does not support dropping types.');
    }

    /**
     * Drop a domain from the schema if it exists.
     */
    public async dropDomain(_domain: Stringable): Promise<boolean> {
        throw new Error('This database driver does not support dropping domains.');
    }

    /**
     * Drop a domain from the schema if it exists.
     */
    public async dropDomainIfExists(_domain: Stringable): Promise<boolean> {
        throw new Error('This database driver does not support dropping domains.');
    }

    /**
     * Drop a database from the schema if the database exists.
     */
    public async dropDatabaseIfExists(_name: string): Promise<boolean> {
        throw new Error('This database driver does not support dropping databases.');
    }

    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<TableDictionary[]> {
        throw new Error('This database driver does not support retrieval of tables.');
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<ViewDictionary[]> {
        throw new Error('This database driver does not support retrieval of views.');
    }

    /**
     * Get the user-defined types that belong to the database.
     */
    public async getTypes(): Promise<TypeDictionary[]> {
        throw new Error('This database driver does not support user-defined types.');
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(_table: string): Promise<ColumnDictionary[]> {
        throw new Error('This database driver does not support retrieval of columns.');
    }

    /**
     * Get the indexes for a given table.
     */
    public async getIndexes(_table: string): Promise<IndexDictionary[]> {
        throw new Error('This database driver does not support retrieval of indexes.');
    }

    /**
     * Get the foreign keys for a given table.
     */
    public async getForeignKeys(_table: string): Promise<ForeignKeyDictionary[]> {
        throw new Error('This database driver does not support retrieval of foreign keys.');
    }

    /**
     * Determine if the given table exists.
     */
    public async hasTable(table: string): Promise<boolean> {
        table = `${this.getConnection().getTablePrefix()}${table}`;
        const tables = await this.getTables();

        for (const value of tables) {
            if (table.toLowerCase() === value.name.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determine if the given view exists.
     */
    public async hasView(view: string): Promise<boolean> {
        view = `${this.getConnection().getTablePrefix()}${view}`;
        const views = await this.getViews();

        for (const value of views) {
            if (view.toLowerCase() === value.name.toLowerCase()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if the given type exists.
     */
    public async hasType(_type: string): Promise<boolean> {
        throw new Error('This database driver does not support user-defined types.');
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
     * Get the column listing for a given table.
     */
    protected async getColumnListing(table: string): Promise<string[]> {
        return (await this.getColumns(table)).map(column => column.name);
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
    public async getColumnType(table: string, column: string, fullDefinition = false): Promise<string> {
        const columns = await this.getColumns(table);

        for (const value of columns) {
            if (value.name.toLowerCase() === column.toLowerCase()) {
                return fullDefinition ? value.type : value.type_name;
            }
        }

        throw new Error(
            `There is no column with name '${column}' on table '${this.getConnection().getTablePrefix()}${table}'.`
        );
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
    public async create(table: Stringable, callback: BlueprintCallback): Promise<void> {
        const blueprint = this.createBlueprint(table, blueprint => {
            blueprint.create();
            callback(blueprint);
        });
        await this.build(blueprint);
    }

    /**
     * Create a new table on the schema.
     */
    public async createView(view: Stringable, callback?: ViewCallback): Promise<boolean> {
        return await this.getConnection().statement(
            this.getGrammar().compileCreateView(
                view,
                callback
                    ? callback(
                          new CommandViewDefinition<ViewRegistryI>('create', {
                              as: new GrammarBuilder(this.connection)
                          } as ViewRegistryI)
                      )
                    : undefined
            )
        );
    }

    /**
     * create user-defined type.
     */
    public async createType(_name: Stringable, _type: string, _definition: any): Promise<boolean> {
        throw new Error('This database driver does not support creating types.');
    }

    /**
     * Drop a table from the schema.
     */
    public async drop(table: Stringable): Promise<void> {
        const blueprint = this.createBlueprint(table, blueprint => {
            blueprint.drop();
        });
        await this.build(blueprint);
    }

    /**
     * Drop a table from the schema if it exists.
     */
    public async dropTableIfExists(table: Stringable): Promise<void> {
        const blueprint = this.createBlueprint(table, blueprint => {
            blueprint.dropTableIfExists();
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
        return await this.getConnection().statement(this.getGrammar().compileEnableForeignKeyConstraints());
    }

    /**
     * Disable foreign key constraints.
     */
    public async disableForeignKeyConstraints(): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileDisableForeignKeyConstraints());
    }

    /**
     * Disable foreign key constraints during the execution of a callback.
     */
    public async withoutForeignKeyConstraints<T>(callback: () => T): Promise<T | void> {
        await this.disableForeignKeyConstraints();

        try {
            const result = callback();
            return result;
        } finally {
            await this.enableForeignKeyConstraints();
        }
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
    protected createBlueprint(table: Stringable, callback?: BlueprintCallback): BlueprintI {
        const prefix = this.getConnection().getConfig<boolean>('prefix_indexes')
            ? this.getConnection().getConfig<string>('prefix')
            : '';

        if (typeof this.resolver === 'function') {
            return this.resolver(table, this.grammar, callback, prefix);
        }

        return new Blueprint(table, this.grammar, callback, prefix);
    }

    /**
     * Get the database connection instance.
     */
    public getConnection(): Session {
        return this.connection;
    }

    /**
     * Get the database schema grammar instance.
     */
    public getGrammar(): ReturnType<ReturnType<this['getConnection']>['getSchemaGrammar']> {
        return this.grammar as ReturnType<ReturnType<this['getConnection']>['getSchemaGrammar']>;
    }

    /**
     * Set the Schema Blueprint resolver callback.
     */
    public blueprintResolver(resolver: BlueprintResolver): this {
        this.resolver = resolver;

        return this;
    }

    /**
     * Get tables From database
     */
    protected async getTablesFromDatabase<T = TableDictionary>(
        databaseOrSchemaOrWithSize?: string | boolean
    ): Promise<T[]> {
        return this.getConnection().selectFromWriteConnection<T>(
            this.getGrammar().compileTables(databaseOrSchemaOrWithSize)
        );
    }

    /**
     * Get views From database
     */
    protected async getViewsFromDatabase<T = ViewDictionary>(databaseOrSchema?: string): Promise<T[]> {
        return this.getConnection().selectFromWriteConnection<T>(this.getGrammar().compileViews(databaseOrSchema));
    }

    /**
     * Get types From database
     */
    protected async getTypesFromDatabase<T = TypeDictionary>(databaseOrSchema?: string): Promise<T[]> {
        return this.getConnection().selectFromWriteConnection<T>(this.getGrammar().compileTypes(databaseOrSchema));
    }

    /**
     * Get the columns for a given table.
     */
    protected async getColumnsFromDatabase<T = ColumnDictionary>(
        table: string,
        databaseOrSchema?: string
    ): Promise<T[]> {
        table = `${this.getConnection().getTablePrefix()}${table}`;

        return this.getConnection().selectFromWriteConnection<T>(
            this.getGrammar().compileColumns(table, databaseOrSchema)
        );
    }

    /**
     * Get the indexes for a given table.
     */
    protected async getIndexesFromDatabase<T = IndexDictionary>(
        table: string,
        databaseOrSchema?: string
    ): Promise<T[]> {
        table = `${this.getConnection().getTablePrefix()}${table}`;

        return this.getConnection().selectFromWriteConnection<T>(
            this.getGrammar().compileIndexes(table, databaseOrSchema)
        );
    }

    /**
     * Get the foreign keys for a given table.
     */
    protected async getForeignKeysFromDatabase<T = ForeignKeyDictionary>(
        table: string,
        databaseOrSchema?: string
    ): Promise<T[]> {
        table = `${this.getConnection().getTablePrefix()}${table}`;

        return this.getConnection().selectFromWriteConnection<T>(
            this.getGrammar().compileForeignKeys(table, databaseOrSchema)
        );
    }
}

export default QueryBuilder;
