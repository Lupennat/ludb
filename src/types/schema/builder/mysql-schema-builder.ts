import {
    MysqlColumnDictionary,
    MysqlForeignKeyDictionary,
    MysqlIndexDictionary,
    MysqlTableDictionary,
    MysqlViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export default interface MysqlSchemaBuilderI extends SchemaBuilder {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<MysqlTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<MysqlViewDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<MysqlColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<MysqlIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<MysqlForeignKeyDictionary[]>;
}
