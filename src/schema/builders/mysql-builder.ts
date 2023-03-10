import Builder from './builder';

class MySqlBuilder extends Builder {
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
        const [database, realTable] = this.parsDatabaseAndTable(table);
        return (
            (
                await this.connection.selectFromWriteConnection(this.grammar.compileTableExists(), [
                    database,
                    `${this.connection.getTablePrefix()}${realTable}`
                ])
            ).length > 0
        );
    }

    /**
     * Get the column listing for a given table.
     */
    public async getColumnListing(table: string): Promise<string[]> {
        const [database, realTable] = this.parsDatabaseAndTable(table);

        const results = await this.connection.selectFromWriteConnection<{ column_name: string }>(
            this.grammar.compileColumnListing(),
            [database, `${this.connection.getTablePrefix()}${realTable}`]
        );

        return results.map(result => result.column_name);
    }

    /**
     * Get the data type for the given column name.
     */
    public async getColumnType(table: string, column: string): Promise<string> {
        const [database, realTable] = this.parsDatabaseAndTable(table);
        const result = await this.connection.selectOne<{ data_type: string }>(
            this.grammar.compileColumnType(),
            [database, `${this.connection.getTablePrefix()}${realTable}`, column],
            false
        );

        if (result === null) {
            throw new Error(
                `column "${column}" not found on table "${`${this.connection.getTablePrefix()}${realTable}`}" with database "${database}".`
            );
        }

        return result.data_type;
    }

    /**
     * Drop all tables from the database.
     */
    public async dropAllTables(): Promise<void> {
        const tables = await this.getAllTables();
        if (tables.length > 0) {
            await this.disableForeignKeyConstraints();
            await this.connection.statement(this.grammar.compileDropAllTables(tables));
            await this.enableForeignKeyConstraints();
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
     * Get all of the table names for the database.
     */
    public async getAllTables(): Promise<string[]> {
        return await this.connection.selectColumn<string>(0, this.grammar.compileGetAllTables());
    }

    /**
     * Get all of the view names for the database.
     */
    public async getAllViews(): Promise<string[]> {
        return await this.connection.selectColumn<string>(0, this.grammar.compileGetAllViews());
    }

    /**
     * Parse the database object reference and extract the database, and table.
     */
    protected parsDatabaseAndTable(reference: string): [string, string] {
        const parts = reference.split('.');

        let database = this.connection.getDatabaseName();

        // If the reference contains a database name, we will use that instead of the
        // default database name for the connection. This allows the database name
        // to be specified in the query instead of at the full connection level.
        if (parts.length === 2) {
            database = parts.shift() as string;
        }

        return [database, parts[0]];
    }
}

export default MySqlBuilder;
