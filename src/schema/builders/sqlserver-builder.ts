import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import {
    SqlServerColumnDictionary,
    SqlServerForeignKeyDictionary,
    SqlServerIndexDictionary,
    SqlServerTableDictionary,
    SqlServerViewDictionary
} from '../../types/schema/generics';
import Builder from './builder';

type SqlServerColumnDefinition = {
    name: string;
    type_name: string;
    length: number;
    precision: number | string;
    places: number | string;
    nullable: number;
    default: PdoColumnValue;
    autoincrement: number;
    collation: string;
    comment: string;
};

type SqlServerIndexDefinition = {
    name: string;
    columns: string;
    type: string;
    unique: number;
    primary: number;
};

type SqlServerForeignKeyDefinition = {
    name: string;
    columns: string;
    foreign_schema: string;
    foreign_table: string;
    foreign_columns: string;
    on_update: string;
    on_delete: string;
};

class SqlServerBuilder extends Builder {
    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<SqlServerTableDictionary[]> {
        return await this.getTablesFromDatabase<SqlServerTableDictionary>();
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<SqlServerViewDictionary[]> {
        return await this.getViewsFromDatabase<SqlServerViewDictionary>();
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(table: string): Promise<SqlServerColumnDictionary[]> {
        const columns = await this.getColumnsFromDatabase<SqlServerColumnDefinition>(table);

        return columns.map<SqlServerColumnDictionary>((column: SqlServerColumnDefinition) => {
            const { type_name, nullable, autoincrement, precision, length, places, ...keys } = column;

            let type = type_name;

            if (['binary', 'varbinary', 'char', 'varchar', 'nchar', 'nvarchar'].includes(type)) {
                type = `${type}(${length == -1 ? 'max' : length.toString()})`;
            } else if (['decimal', 'numeric'].includes(type)) {
                type = `${type}(${precision},${places})`;
            } else if (['float', 'datetime2', 'datetimeoffset', 'time'].includes(type)) {
                type = `${type}(${precision})`;
            }

            return {
                ...keys,
                type_name: type_name,
                type: type,
                nullable: Boolean(nullable),
                auto_increment: Boolean(autoincrement)
            };
        });
    }

    /**
     * Get the indexes for a given table.
     */
    public async getIndexes(table: string): Promise<SqlServerIndexDictionary[]> {
        const indexes = await this.getIndexesFromDatabase<SqlServerIndexDefinition>(table);

        return indexes.map<SqlServerIndexDictionary>((index: SqlServerIndexDefinition) => {
            return {
                name: index.name.toLowerCase(),
                columns: index.columns.split(','),
                type: index.type.toLowerCase(),
                unique: Boolean(index.unique),
                primary: Boolean(index.primary)
            };
        });
    }

    /**
     * Get the foreign keys for a given table.
     */
    public async getForeignKeys(table: string): Promise<SqlServerForeignKeyDictionary[]> {
        const foreignKeys = await this.getForeignKeysFromDatabase<SqlServerForeignKeyDefinition>(table);

        return foreignKeys.map<SqlServerForeignKeyDictionary>((foreignKey: SqlServerForeignKeyDefinition) => {
            const { columns, foreign_columns, on_update, on_delete, ...keys } = foreignKey;
            return {
                ...keys,
                columns: columns.split(','),
                foreign_columns: foreign_columns.split(','),
                on_delete: on_delete.toLowerCase().replace('_', ' '),
                on_update: on_update.toLowerCase().replace('_', ' ')
            };
        });
    }

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
    public async dropTables(): Promise<void> {
        await this.connection.statement(this.grammar.compileDropForeignKeys());

        await this.connection.statement(this.grammar.compileDropTables());
    }

    /**
     * Drop all views from the database.
     */
    public async dropViews(): Promise<void> {
        await this.connection.statement(this.grammar.compileDropViews());
    }

    /**
     * Drop a view from the schema if it exists.
     */
    public async dropViewIfExists(name: string): Promise<boolean> {
        return await this.connection.statement(this.grammar.compileDropViewIfExists(name));
    }
}

export default SqlServerBuilder;
