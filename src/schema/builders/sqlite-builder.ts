import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { existsSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import SqliteConnection from '../../connections/sqlite-connection';
import { ConnectionSessionI } from '../../types/connection';
import { Stringable } from '../../types/generics';
import {
    SqliteColumnDictionary,
    SqliteForeignKeyDictionary,
    SqliteIndexDictionary,
    SqliteTableDictionary,
    SqliteViewDictionary
} from '../../types/schema/generics';
import Builder from './builder';

type SqliteColumnDefinition = {
    name: string;
    type: string;
    nullable: number;
    default: PdoColumnValue;
    primary: number;
};

type SqliteIndexDefinition = {
    name: string;
    columns: string;
    unique: boolean;
    primary: boolean;
};

type SqliteForeignKeyDefinition = {
    columns: string;
    foreign_schema: string;
    foreign_table: string;
    foreign_columns: string;
    on_update: string;
    on_delete: string;
};

class SqliteBuilder extends Builder<ConnectionSessionI<SqliteConnection>> {
    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<SqliteTableDictionary[]> {
        let withSize = false;

        try {
            withSize = (await this.getConnection().scalar(this.getGrammar().compileDbstatExists())) ?? false;
        } catch (error) {
            //
        }

        return await this.getTablesFromDatabase<SqliteTableDictionary>(withSize);
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<SqliteViewDictionary[]> {
        return await this.getViewsFromDatabase<SqliteViewDictionary>();
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(table: string): Promise<SqliteColumnDictionary[]> {
        const columns = await this.getColumnsFromDatabase<SqliteColumnDefinition>(table);

        const hasPrimaryKey: boolean =
            columns.reduce((carry, column) => {
                carry += column.primary;
                return carry;
            }, 0) === 1;

        return columns.map<SqliteColumnDictionary>((column: SqliteColumnDefinition) => {
            const { name, type, nullable, primary, ...keys } = column;
            const lowerType = type.toLowerCase();
            return {
                ...keys,
                name,
                type_name: lowerType.split('(', 1)[0],
                type: lowerType,
                nullable: Boolean(nullable),
                auto_increment: hasPrimaryKey && primary === 1 && lowerType === 'integer'
            };
        });
    }

    /**
     * Get the indexes for a given table.
     */
    public async getIndexes(table: string): Promise<SqliteIndexDictionary[]> {
        let indexes: SqliteIndexDictionary[] | SqliteIndexDefinition[] =
            await this.getIndexesFromDatabase<SqliteIndexDefinition>(table);

        let primaryCount = 0;

        indexes = indexes.map<SqliteIndexDictionary>((index: SqliteIndexDefinition) => {
            const { columns, unique, primary, name } = index;
            const isPrimary = Boolean(primary);
            if (primary) {
                primaryCount += 1;
            }
            return {
                name: name.toLowerCase(),
                columns: columns.split(','),
                unique: Boolean(unique),
                primary: isPrimary
            };
        });

        if (primaryCount > 1) {
            indexes = indexes.filter(index => index.name !== 'primary');
        }

        return indexes;
    }

    /**
     * Get the foreign keys for a given table.
     */
    public async getForeignKeys(table: string): Promise<SqliteForeignKeyDictionary[]> {
        const foreignKeys = await this.getForeignKeysFromDatabase<SqliteForeignKeyDefinition>(table);

        return foreignKeys.map<SqliteForeignKeyDictionary>((foreignKey: SqliteForeignKeyDefinition) => {
            const { columns, foreign_columns, on_update, on_delete, ...keys } = foreignKey;
            return {
                ...keys,
                name: '',
                columns: columns.split(','),
                foreign_columns: foreign_columns.split(','),
                on_delete: on_delete.toLowerCase(),
                on_update: on_update.toLowerCase()
            };
        });
    }

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
     * Drop a view from the schema.
     */
    public async dropView(name: Stringable): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileDropView(name));
    }

    /**
     * Drop a view from the schema if it exists.
     */
    public async dropViewIfExists(name: Stringable): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileDropViewIfExists(name));
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
    public async dropTables(): Promise<void> {
        if (this.getConnection().getDatabaseName() !== ':memory:') {
            return await this.refreshDatabaseFile();
        }

        await this.getConnection().statement(this.getGrammar().compileEnableWriteableSchema());
        await this.getConnection().statement(this.getGrammar().compileDropTables());
        await this.getConnection().statement(this.getGrammar().compileDisableWriteableSchema());
        await this.getConnection().statement(this.getGrammar().compileRebuild());
    }

    /**
     * Drop all tables from the database.
     */
    public async dropViews(): Promise<void> {
        await this.getConnection().statement(this.getGrammar().compileEnableWriteableSchema());
        await this.getConnection().statement(this.getGrammar().compileDropViews());
        await this.getConnection().statement(this.getGrammar().compileDisableWriteableSchema());
        await this.getConnection().statement(this.getGrammar().compileRebuild());
    }

    /**
     * Empty the database file.
     */
    protected async refreshDatabaseFile(): Promise<void> {
        await this.createDatabase(this.getConnection().getDatabaseName());
    }
}

export default SqliteBuilder;
