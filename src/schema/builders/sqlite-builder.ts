import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { existsSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import {
    SQLiteColumnDictionary,
    SQLiteForeignKeyDictionary,
    SQLiteIndexDictionary,
    SQLiteTableDictionary,
    SQLiteViewDictionary
} from '../../types/schema/generics';
import Builder from './builder';

type SQLiteColumnDefinition = {
    name: string;
    type: string;
    nullable: number;
    default: PdoColumnValue;
    primary: number;
};

type SQLiteIndexDefinition = {
    name: string;
    columns: string;
    unique: boolean;
    primary: boolean;
};

type SQLiteForeignKeyDefinition = {
    columns: string;
    foreign_schema: string;
    foreign_table: string;
    foreign_columns: string;
    on_update: string;
    on_delete: string;
};

class SQLiteBuilder extends Builder {
    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<SQLiteTableDictionary[]> {
        let withSize = false;

        try {
            withSize = (await this.connection.scalar(this.grammar.compileDbstatExists())) ?? false;
        } catch (error) {
            //
        }

        return await this.getTablesFromDatabase<SQLiteTableDictionary>(withSize);
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<SQLiteViewDictionary[]> {
        return await this.getViewsFromDatabase<SQLiteViewDictionary>();
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(table: string): Promise<SQLiteColumnDictionary[]> {
        const columns = await this.getColumnsFromDatabase<SQLiteColumnDefinition>(table);

        const hasPrimaryKey: boolean =
            columns.reduce((carry, column) => {
                carry += column.primary;
                return carry;
            }, 0) === 1;

        return columns.map<SQLiteColumnDictionary>((column: SQLiteColumnDefinition) => {
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
    public async getIndexes(table: string): Promise<SQLiteIndexDictionary[]> {
        let indexes: SQLiteIndexDictionary[] | SQLiteIndexDefinition[] =
            await this.getIndexesFromDatabase<SQLiteIndexDefinition>(table);

        let primaryCount = 0;

        indexes = indexes.map<SQLiteIndexDictionary>((index: SQLiteIndexDefinition) => {
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
    public async getForeignKeys(table: string): Promise<SQLiteForeignKeyDictionary[]> {
        const foreignKeys = await this.getForeignKeysFromDatabase<SQLiteForeignKeyDefinition>(table);

        return foreignKeys.map<SQLiteForeignKeyDictionary>((foreignKey: SQLiteForeignKeyDefinition) => {
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
     * Drop a view from the schema if it exists.
     */
    public async dropViewIfExists(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileDropViewIfExists(name));
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
        if (this.connection.getDatabaseName() !== ':memory:') {
            return await this.refreshDatabaseFile();
        }

        await this.connection.statement(this.grammar.compileEnableWriteableSchema());
        await this.connection.statement(this.grammar.compileDropTables());
        await this.connection.statement(this.grammar.compileDisableWriteableSchema());
        await this.connection.statement(this.grammar.compileRebuild());
    }

    /**
     * Drop all tables from the database.
     */
    public async dropViews(): Promise<void> {
        await this.connection.statement(this.grammar.compileEnableWriteableSchema());
        await this.connection.statement(this.grammar.compileDropViews());
        await this.connection.statement(this.grammar.compileDisableWriteableSchema());
        await this.connection.statement(this.grammar.compileRebuild());
    }

    /**
     * Empty the database file.
     */
    protected async refreshDatabaseFile(): Promise<void> {
        await this.createDatabase(this.connection.getDatabaseName());
    }
}

export default SQLiteBuilder;
