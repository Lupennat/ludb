import { existsSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import Builder from './builder';

class SQLiteBuilder extends Builder {
    /**
     * Create a database in the schema.
     */
    public async createDatabase(path: string): Promise<boolean> {
        try {
            await this.writeFile(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Drop a database from the schema if the database exists.
     */
    public async dropDatabaseIfExists(path: string): Promise<boolean> {
        if (this.existFile(path)) {
            try {
                await this.removeFile(path);
                return true;
            } catch (error) {
                return false;
            }
        }
        return true;
    }

    /**
     * write file on FileSystem
     */
    protected async writeFile(path: string): Promise<void> {
        await writeFile(path, '');
    }

    /**
     * Remove file on FileSystem
     */
    protected async removeFile(path: string): Promise<void> {
        await unlink(path);
    }

    /**
     * Remove file on FileSystem
     */
    protected existFile(path: string): boolean {
        return existsSync(path);
    }

    /**
     * Drop all tables from the database.
     */
    public async dropAllTables(): Promise<void> {
        if (this.connection.getDatabaseName() !== ':memory:') {
            return await this.refreshDatabaseFile();
        }

        await this.connection.statement(this.grammar.compileEnableWriteableSchema());
        await this.connection.statement(this.grammar.compileDropAllTables());
        await this.connection.statement(this.grammar.compileDisableWriteableSchema());
        await this.connection.statement(this.grammar.compileRebuild());
    }

    /**
     * Drop all tables from the database.
     */
    public async dropAllViews(): Promise<void> {
        await this.connection.statement(this.grammar.compileEnableWriteableSchema());
        await this.connection.statement(this.grammar.compileDropAllViews());
        await this.connection.statement(this.grammar.compileDisableWriteableSchema());
        await this.connection.statement(this.grammar.compileRebuild());
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
            this.grammar.compileColumnListing(`${this.connection.getTablePrefix()}${table}`)
        );

        return results.map(result => result.name);
    }

    /**
     * Get the data type for the given column name.
     */
    public async getColumnType(table: string, column: string): Promise<string> {
        const results = await this.connection.selectFromWriteConnection<{ name: string; type: string }>(
            this.grammar.compileColumnType(`${this.connection.getTablePrefix()}${table}`)
        );

        for (const result of results) {
            if (result.name === column) {
                return result.type;
            }
        }

        throw new Error(
            `column "${column}" not found on table "${`${this.connection.getTablePrefix()}${table}`}" with database "${this.connection.getDatabaseName()}".`
        );
    }

    /**
     * Empty the database file.
     */
    protected async refreshDatabaseFile(): Promise<void> {
        await this.createDatabase(this.connection.getDatabaseName());
    }
}

export default SQLiteBuilder;
