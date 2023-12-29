import SqlServerSchemaBuilder from '../schema/builder/sqlserver-schema-builder';
import DriverConnectionI from './connection';

export default interface SqlServerConnectionI extends DriverConnectionI {
    /**
     * Get a schema builder instance for the connection.
     */
    getSchemaBuilder(): SqlServerSchemaBuilder;
}
