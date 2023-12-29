import PostgresSchemaBuilder from '../schema/builder/postgres-schema-builder';
import DriverConnectionI from './connection';

export default interface PostgresConnectionI extends DriverConnectionI {
    /**
     * Get a schema builder instance for the connection.
     */
    getSchemaBuilder(): PostgresSchemaBuilder;
}
