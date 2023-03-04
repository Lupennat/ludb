import Builder from './builder';

class SqlServerBuilder extends Builder {
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
     * Drop all tables from the database.
     */
    public async dropAllTables(): Promise<void> {
        await this.connection.statement(this.grammar.compileDropAllForeignKeys());

        await this.connection.statement(this.grammar.compileDropAllTables());
    }

    /**
     * Drop all views from the database.
     */
    public async dropAllViews(): Promise<void> {
        await this.connection.statement(this.grammar.compileDropAllViews());
    }

    /**
     * Get all of the table names for the database.
     */
    public async getAllTables(): Promise<string[]> {
        const results = await this.connection.select<{ type: string; name: string }>(
            this.grammar.compileGetAllTables()
        );
        return results.map(result => result.name);
    }

    /**
     * Get all of the view names for the database.
     */
    public async getAllViews(): Promise<string[]> {
        const results = await this.connection.select<{ type: string; name: string }>(this.grammar.compileGetAllViews());
        return results.map(result => result.name);
    }

    /**
     * Get the column listing for a given table.
     */
    public async getColumnListing(table: string): Promise<string[]> {
        const results = await this.connection.selectFromWriteConnection<{ name: string }>(
            this.grammar.compileColumnListing(),
            [`${this.connection.getTablePrefix()}${table}`]
        );

        return results.map(result => result.name);
    }

    /**
     * Get the data type for the given column name.
     */
    public async getColumnType(table: string, column: string): Promise<string> {
        const result = await this.connection.selectOne<{ type: string }>(this.grammar.compileColumnType(), [
            `${this.connection.getTablePrefix()}${table}`,
            column
        ]);

        return result === null ? '' : result.type;
    }
}

export default SqlServerBuilder;
