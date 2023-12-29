import {
    SqlServerColumnDictionary,
    SqlServerForeignKeyDictionary,
    SqlServerIndexDictionary,
    SqlServerTableDictionary,
    SqlServerViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export default interface SqlServerSchemaBuilderI extends SchemaBuilder {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<SqlServerTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<SqlServerViewDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<SqlServerColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<SqlServerIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<SqlServerForeignKeyDictionary[]>;
}
