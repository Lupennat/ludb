import SqliteConnection from '../../../connections/sqlite-connection';
import { ConnectionSessionI } from '../../connection';
import {
    SqliteColumnDictionary,
    SqliteForeignKeyDictionary,
    SqliteIndexDictionary,
    SqliteTableDictionary,
    SqliteViewDictionary
} from '../generics';
import SchemaBuilder from './schema-builder';

export default interface SqliteSchemaBuilderI extends SchemaBuilder<ConnectionSessionI<SqliteConnection>> {
    /**
     * Get the tables that belong to the database.
     */
    getTables(): Promise<SqliteTableDictionary[]>;
    /**
     * Get the views that belong to the database.
     */
    getViews(): Promise<SqliteViewDictionary[]>;
    /**
     * Get the columns for a given table.
     */
    getColumns(table: string): Promise<SqliteColumnDictionary[]>;
    /**
     * Get the indexes for a given table.
     */
    getIndexes(table: string): Promise<SqliteIndexDictionary[]>;
    /**
     * Get the foreign keys for a given table.
     */
    getForeignKeys(table: string): Promise<SqliteForeignKeyDictionary[]>;
}
