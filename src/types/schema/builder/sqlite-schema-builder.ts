import {
    SQLiteColumnDictionary,
    SQLiteForeignKeyDictionary,
    SQLiteIndexDictionary,
    SQLiteTableDictionary,
    SQLiteViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export default interface SQLiteSchemaBuilderI extends SchemaBuilder {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<SQLiteTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<SQLiteViewDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<SQLiteColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<SQLiteIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<SQLiteForeignKeyDictionary[]>;
}
