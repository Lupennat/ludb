import { parseSearchPath } from '../../utils';
import Builder from './builder';

class PostgresBuilder extends Builder {
    /**
     * Create a database in the schema.
     */
    public async createDatabase(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileCreateDatabase(name, this.connection));
    }

    /**
     * Drop a database from the schema if the database exists.
     */
    public async dropDatabaseIfExists(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileDropDatabaseIfExists(name));
    }

    /**
     * Determine if the given table exists.
     */
    public async hasTable(table: string): Promise<boolean> {
        const [database, schema, realTable] = this.parseSchemaAndTable(table);

        return (
            (
                await this.connection.selectFromWriteConnection(this.grammar.compileTableExists(), [
                    database,
                    schema,
                    `${this.connection.getTablePrefix()}${realTable}`
                ])
            ).length > 0
        );
    }

    /**
     * Drop all tables from the database.
     */
    public async dropAllTables(): Promise<void> {
        const tables: string[] = [];
        const dbTables = await this.getAllTablesFromConnection();
        const excludedTables = this.grammar.escapeNames(this.connection.getConfig('dont_drop', ['spatial_ref_sys']));

        for (const dbTable of dbTables) {
            const tablesToMatch = this.grammar.escapeNames(
                [dbTable.tablename].concat(dbTable.qualifiedname ? [dbTable.qualifiedname] : [])
            );
            if (tablesToMatch.filter(value => excludedTables.includes(value)).length === 0) {
                tables.push(dbTable.qualifiedname ? dbTable.qualifiedname : dbTable.tablename);
            }
        }

        if (tables.length > 0) {
            this.connection.statement(this.grammar.compileDropAllTables(tables));
        }
    }

    /**
     * Drop all views from the database.
     */
    public async dropAllViews(): Promise<void> {
        const views = await this.getAllViews();
        if (views.length > 0) {
            await this.connection.statement(this.grammar.compileDropAllViews(views));
        }
    }

    /**
     * Drop all types from the database.
     */
    public async dropAllTypes(): Promise<void> {
        const types = await this.getAllTypes();
        if (types.length > 0) {
            await this.connection.statement(this.grammar.compileDropAllTypes(types));
        }
    }
    /**
     * Get all of the table names and qualifiednames for the database.
     */
    protected async getAllTablesFromConnection(): Promise<Array<{ tablename: string; qualifiedname: string | null }>> {
        return this.connection.select<{ tablename: string; qualifiedname: string | null }>(
            this.grammar.compileGetAllTables(
                this.parseSearchPath(
                    this.connection.getConfig<string | string[]>('search_path') ||
                        this.connection.getConfig<string>('schema') ||
                        'public'
                )
            )
        );
    }

    /**
     * Get all of the table names for the database.
     */
    public async getAllTables(): Promise<string[]> {
        const results = await this.getAllTablesFromConnection();
        return results.map(result => (result.qualifiedname ? result.qualifiedname : result.tablename));
    }

    /**
     * Get all of the view names for the database.
     */
    public async getAllViews(): Promise<string[]> {
        const results = await this.connection.select<{ viewname: string; qualifiedname: string | null }>(
            this.grammar.compileGetAllViews(
                this.parseSearchPath(
                    this.connection.getConfig<string | string[]>('search_path') ||
                        this.connection.getConfig<string>('schema') ||
                        'public'
                )
            )
        );
        return results.map(result => (result.qualifiedname ? result.qualifiedname : result.viewname));
    }

    /**
     * Get all of the type names for the database.
     */
    public async getAllTypes(): Promise<string[]> {
        return await this.connection.selectColumn<string>(0, this.grammar.compileGetAllTypes());
    }

    /**
     * Get the column listing for a given table.
     */
    public async getColumnListing(table: string): Promise<string[]> {
        const [database, schema, realTable] = this.parseSchemaAndTable(table);
        const results = await this.connection.selectFromWriteConnection<{ column_name: string }>(
            this.grammar.compileColumnListing(),
            [database, schema, `${this.connection.getTablePrefix()}${realTable}`]
        );

        return results.map(result => result.column_name);
    }

    /**
     * Get the data type for the given column name.
     */
    public async getColumnType(table: string, column: string): Promise<string> {
        const [database, schema, realTable] = this.parseSchemaAndTable(table);
        const result = await this.connection.selectOne<{ data_type: string }>(
            this.grammar.compileColumnType(),
            [database, schema, `${this.connection.getTablePrefix()}${realTable}`, column],
            false
        );
        if (result === null) {
            throw new Error(
                `column "${column}" not found on table "${`${this.connection.getTablePrefix()}${realTable}`}" with schema "${schema}" and database "${database}".`
            );
        }

        return result.data_type;
    }

    /**
     * Parse the database object reference and extract the database, schema, and table.
     */
    protected parseSchemaAndTable(reference: string): [string, string, string] {
        const search =
            this.connection.getConfig<string | string[]>('search_path') ||
            this.connection.getConfig<string>('schema') ||
            'public';
        const searchPath = this.parseSearchPath(search);

        const parts = reference.split('.');

        let database = this.connection.getDatabaseName();

        // If the reference contains a database name, we will use that instead of the
        // default database name for the connection. This allows the database name
        // to be specified in the query instead of at the full connection level.
        if (parts.length === 3) {
            database = parts.shift() as string;
        }

        // We will use the default schema unless the schema has been specified in the
        // query. If the schema has been specified in the query then we can use it
        // instead of a default schema configured in the connection search path.
        let schema = searchPath[0];

        if (parts.length === 2) {
            schema = parts.shift() as string;
        }

        return [database, schema, parts[0]];
    }

    /**
     * Parse the "search_path" configuration value into an array.
     */
    protected parseSearchPath(searchPath: string | string[]): string[] {
        searchPath = parseSearchPath(searchPath);

        return searchPath.map(schema => {
            return schema === '$user' ? this.connection.getConfig('username', '') : schema;
        });
    }
}

export default PostgresBuilder;
