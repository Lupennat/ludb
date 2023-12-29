import {
    PostgresColumnDictionary,
    PostgresForeignKeyDictionary,
    PostgresIndexDictionary,
    PostgresTableDictionary,
    PostgresTypeDictionary,
    PostgresViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export default interface PostgresSchemaBuilderI extends SchemaBuilder {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<PostgresTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<PostgresViewDictionary[]>;
    /**
     * Get the user-defined types that belong to the database.
     */
    getTypes(): Promise<PostgresTypeDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<PostgresColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<PostgresIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<PostgresForeignKeyDictionary[]>;
}
