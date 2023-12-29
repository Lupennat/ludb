import SQLiteSchemaBuilder from '../schema/builder/sqlite-schema-builder';
import DriverConnectionI from './connection';

export default interface SQLiteConnectionI extends DriverConnectionI {
    /**
     * Get a schema builder instance for the connection.
     */
    getSchemaBuilder(): SQLiteSchemaBuilder;
}
