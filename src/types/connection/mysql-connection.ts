import MysqlSchemaBuilder from '../schema/builder/mysql-schema-builder';
import DriverConnectionI from './connection';

export default interface MysqlConnectionI extends DriverConnectionI {
    /**
     * Get a schema builder instance for the connection.
     */
    getSchemaBuilder(): MysqlSchemaBuilder;
}
