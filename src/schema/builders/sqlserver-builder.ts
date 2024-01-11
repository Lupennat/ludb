import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import SqlserverConnection from '../../connections/sqlserver-connection';
import { ConnectionSessionI } from '../../types/connection';
import { Stringable } from '../../types/generics';
import SqlserverSchemaBuilderI from '../../types/schema/builder/sqlserver-schema-builder';
import {
    SqlserverColumnDictionary,
    SqlserverForeignKeyDictionary,
    SqlserverIndexDictionary,
    SqlserverSimpleType,
    SqlserverTableDictionary,
    SqlserverTypeDictionary,
    SqlserverViewDictionary
} from '../../types/schema/generics';
import QueryBuilder from './builder';

type SqlserverTypeDefinition = {
    name: string;
    schema: string;
    type_name: string;
    length: number;
    precision: number | string;
    places: number | string;
};

type SqlserverColumnDefinition = {
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

type SqlserverIndexDefinition = {
    name: string;
    columns: string;
    type: string;
    unique: number;
    primary: number;
};

type SqlserverForeignKeyDefinition = {
    name: string;
    columns: string;
    foreign_schema: string;
    foreign_table: string;
    foreign_columns: string;
    on_update: string;
    on_delete: string;
};

class SqlserverBuilder
    extends QueryBuilder<ConnectionSessionI<SqlserverConnection>>
    implements SqlserverSchemaBuilderI
{
    /**
     * Get the tables that belong to the database.
     */
    public async getTables(): Promise<SqlserverTableDictionary[]> {
        return await this.getTablesFromDatabase<SqlserverTableDictionary>();
    }

    /**
     * Get the views that belong to the database.
     */
    public async getViews(): Promise<SqlserverViewDictionary[]> {
        return await this.getViewsFromDatabase<SqlserverViewDictionary>();
    }

    /**
     * Get the columns for a given table.
     */
    public async getColumns(table: string): Promise<SqlserverColumnDictionary[]> {
        const columns = await this.getColumnsFromDatabase<SqlserverColumnDefinition>(table);

        return columns.map<SqlserverColumnDictionary>((column: SqlserverColumnDefinition) => {
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
     * Get the user-defined types that belong to the database.
     */
    public async getTypes(): Promise<SqlserverTypeDictionary[]> {
        const types = await this.getTypesFromDatabase<SqlserverTypeDefinition>(this.getConnection().getDatabaseName());

        return types.map<SqlserverTypeDictionary>((column: SqlserverTypeDefinition) => {
            const { type_name, precision, length, places, ...keys } = column;

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
                type: type
            };
        });
    }

    /**
     * Get the indexes for a given table.
     */
    public async getIndexes(table: string): Promise<SqlserverIndexDictionary[]> {
        const indexes = await this.getIndexesFromDatabase<SqlserverIndexDefinition>(table);

        return indexes.map<SqlserverIndexDictionary>((index: SqlserverIndexDefinition) => {
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
    public async getForeignKeys(table: string): Promise<SqlserverForeignKeyDictionary[]> {
        const foreignKeys = await this.getForeignKeysFromDatabase<SqlserverForeignKeyDefinition>(table);

        return foreignKeys.map<SqlserverForeignKeyDictionary>((foreignKey: SqlserverForeignKeyDefinition) => {
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
     * Determine if the given view exists.
     */
    public async hasType(type: string): Promise<boolean> {
        const types = await this.getTypes();

        for (const value of types) {
            if (type.toLowerCase() === value.name.toLowerCase()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create a database in the schema.
     */
    public async createDatabase(name: string): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileCreateDatabase(name));
    }

    /**
     * create user-defined type.
     */
    public async createType(name: Stringable, type: 'simple', definition: SqlserverSimpleType): Promise<boolean>;
    public async createType(name: Stringable, type: 'external', definition: string): Promise<boolean>;
    public async createType(
        name: Stringable,
        type: 'simple' | 'external',
        definition: SqlserverSimpleType | Stringable
    ): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileCreateType(name, type, definition));
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
        await this.getConnection().statement(this.getGrammar().compileDropForeignKeys());

        await this.getConnection().statement(this.getGrammar().compileDropTables());
    }

    /**
     * Drop all views from the database.
     */
    public async dropViews(): Promise<void> {
        await this.getConnection().statement(this.getGrammar().compileDropViews());
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
     * Drop a type from the schema if it exists.
     */
    public async dropType(name: Stringable): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileDropType(name));
    }

    /**
     * Drop a type from the schema if it exists.
     */
    public async dropTypeIfExists(name: Stringable): Promise<boolean> {
        return await this.getConnection().statement(this.getGrammar().compileDropTypeIfExists(name));
    }

    /**
     * Drop all types from the database.
     */
    public async dropTypes(): Promise<void> {
        const types: string[] = [];
        const dbTypes = await this.getTypes();

        for (const dbType of dbTypes) {
            types.push(`${dbType.schema}.${dbType.name}`);
        }

        if (types.length > 0) {
            await this.getConnection().transaction(session => {
                types.forEach(type => {
                    session.statement(this.getGrammar().compileDropType(type));
                });
            });
        }
    }
}

export default SqlserverBuilder;
