import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import MysqlConnection from '../../connections/mysql-connection';
import { ConnectionSessionI } from '../../types/connection';
import { Stringable } from '../../types/generics';
import MysqlSchemaBuilderI from '../../types/schema/builder/mysql-schema-builder';
import {
    MysqlColumnDictionary,
    MysqlForeignKeyDictionary,
    MysqlIndexDictionary,
    MysqlTableDictionary,
    MysqlViewDictionary
} from '../../types/schema/generics';
import Builder from './builder';

type MysqlColumnDefinition = {
    name: string;
    type_name: string;
    type: string;
    collation: string;
    nullable: string;
    default: PdoColumnValue;
    extra: string;
    comment: string;
};

type MysqlIndexDefinition = {
    name: string;
    columns: string;
    type: string;
    unique: number;
};

type MysqlForeignKeyDefinition = {
    name: string;
    columns: string;
    foreign_schema: string;
    foreign_table: string;
    foreign_columns: string;
    on_update: string;
    on_delete: string;
};

class MysqlBuilder extends Builder<ConnectionSessionI<MysqlConnection>> implements MysqlSchemaBuilderI {
    /**
     * Create a database in the schema.
     */
    public async createDatabase(name: string): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileCreateDatabase(name, this.connection));
    }

    /**
     * Drop a database from the schema if the database exists.
     */
    public async dropDatabaseIfExists(name: string): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileDropDatabaseIfExists(name));
    }

    /**
     * Drop all tables from the database.
     */
    public async dropTables(): Promise<void> {
        const tables = (await this.getTables()).map(table => table.name);
        if (tables.length > 0) {
            await this.disableForeignKeyConstraints();
            await this.getConnection().statement(this.getGrammar().compileDropTables(tables));
            await this.enableForeignKeyConstraints();
        }
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
     * Drop all views from the database.
     */
    public async dropViews(): Promise<void> {
        const views = (await this.getViews()).map(view => view.name);

        if (views.length > 0) {
            await this.getConnection().statement(this.getGrammar().compileDropViews(views));
        }
    }

    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<MysqlTableDictionary[]> {
        return await this.getTablesFromDatabase<MysqlTableDictionary>(this.getConnection().getDatabaseName());
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<MysqlViewDictionary[]> {
        return await this.getViewsFromDatabase<MysqlViewDictionary>(this.getConnection().getDatabaseName());
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(table: string): Promise<MysqlColumnDictionary[]> {
        const columns = await this.getColumnsFromDatabase<MysqlColumnDefinition>(
            table,
            this.getConnection().getDatabaseName()
        );

        return columns.map<MysqlColumnDictionary>((column: MysqlColumnDefinition) => {
            const { extra, nullable, ...keys } = column;
            return { ...keys, nullable: nullable === 'YES', auto_increment: extra === 'auto_increment' };
        });
    }

    /**
     * Get the indexes for a given table.
     */
    public async getIndexes(table: string): Promise<MysqlIndexDictionary[]> {
        const indexes = await this.getIndexesFromDatabase<MysqlIndexDefinition>(
            table,
            this.getConnection().getDatabaseName()
        );

        return indexes.map<MysqlIndexDictionary>((index: MysqlIndexDefinition) => {
            return {
                name: index.name.toLowerCase(),
                type: index.type.toLowerCase(),
                columns: index.columns.split(','),
                unique: Boolean(index.unique),
                primary: index.name.toLowerCase() === 'primary'
            };
        });
    }

    /**
     * Get the foreign keys for a given table.
     */
    public async getForeignKeys(table: string): Promise<MysqlForeignKeyDictionary[]> {
        const foreignKeys = await this.getForeignKeysFromDatabase<MysqlForeignKeyDefinition>(
            table,
            this.getConnection().getDatabaseName()
        );

        return foreignKeys.map<MysqlForeignKeyDictionary>((foreignKey: MysqlForeignKeyDefinition) => {
            const { columns, foreign_columns, on_update, on_delete, ...keys } = foreignKey;
            return {
                ...keys,
                columns: columns.split(','),
                foreign_columns: foreign_columns.split(','),
                on_delete: on_delete.toLowerCase(),
                on_update: on_update.toLowerCase()
            };
        });
    }
}

export default MysqlBuilder;
