import { Pdo } from 'lupdo';
import MysqlConnection from '../connections/mysql-connection';
import PostgresConnection from '../connections/postgres-connection';
import SqliteConnection from '../connections/sqlite-connection';
import SqlserverConnection from '../connections/sqlserver-connection';
import { DatabaseConfig, DatabaseConnectionOptions, ReadWriteType } from '../types/config';
import DriverConnectionI from '../types/connection';
import { merge } from '../utils';
import Connector from './connector';
import MysqlConnector from './mysql-connectors';
import PostgresConnector from './postgres-connector';
import SqliteConnector from './sqlite-connector';
import SqlserverConnector from './sqlserver-connector';

class ConnectionFactory {
    /**
     * Establish a PDO connection based on the configuration.
     */
    public make(config: DatabaseConfig, name: string): DriverConnectionI {
        config.prefix = config.prefix || '';
        config.database = config.database || '';

        if ('read' in config || 'write' in config) {
            return this.createReadWriteConnection(config, name);
        }

        return this.createSingleConnection(config, name);
    }

    /**
     * Create a single database connection instance.
     */
    protected createSingleConnection(config: DatabaseConfig, name: string): DriverConnectionI {
        const pdo = this.createPdoResolver(config);
        const schemaPdo = this.createPdoSchemaResolver(config);

        return this.createConnection(name, config.driver, pdo, schemaPdo, config, config.database!, config.prefix!);
    }

    /**xx
     * Create a read / write database connection instance.
     */
    protected createReadWriteConnection(config: DatabaseConfig, name: string): DriverConnectionI {
        const connection = this.createSingleConnection(this.getWriteConfig(config), name);

        return connection.setReadPdo(this.createReadPdo(config));
    }

    /**
     * Create a new PDO instance for reading.
     */
    protected createReadPdo(config: DatabaseConfig): Pdo {
        return this.createPdoResolver(this.getReadConfig(config));
    }

    /**
     * Get the read configuration for a read / write connection.
     */
    protected getReadConfig(config: DatabaseConfig): DatabaseConfig {
        return this.mergeReadWriteConfig(config, this.getReadWriteConfig(config, 'read'));
    }

    /**
     * Get the write configuration for a read / write connection.
     */
    protected getWriteConfig(config: DatabaseConfig): DatabaseConfig {
        return this.mergeReadWriteConfig(config, this.getReadWriteConfig(config, 'write'));
    }

    /**
     * Get a read / write level configuration.
     */
    protected getReadWriteConfig(config: DatabaseConfig, type: ReadWriteType): DatabaseConnectionOptions | undefined {
        if (type in config) {
            const options = config[type]!;
            if (Array.isArray(options)) {
                return options[Math.floor(Math.random() * options.length)];
            } else {
                return options;
            }
        }
        return undefined;
    }

    /**
     * Merge a configuration for a read / write connection.
     */
    protected mergeReadWriteConfig(config: DatabaseConfig, toMerge?: DatabaseConnectionOptions): DatabaseConfig {
        const merged = merge<DatabaseConfig>(config, toMerge ?? {});
        delete merged.read;
        delete merged.write;

        return merged;
    }

    /**
     * Create a new PDO instance for Schema.
     */
    protected createPdoSchemaResolver(config: DatabaseConfig): Pdo {
        return this.createConnector(config).connect(
            Object.assign({}, config, {
                pool: { min: 0, max: 1 }
            })
        );
    }

    /**
     * Create a new PDO instance.
     */
    protected createPdoResolver(config: DatabaseConfig): Pdo {
        return this.createConnector(config).connect(config);
    }

    /**
     * Create a connector instance based on the configuration.
     */
    protected createConnector(config: DatabaseConfig): Connector {
        const driver = config.driver;

        switch (driver) {
            case 'mysql':
                return new MysqlConnector();
            case 'pgsql':
                return new PostgresConnector();
            case 'sqlite':
                return new SqliteConnector();
            case 'sqlsrv':
                return new SqlserverConnector();
            default:
                throw new Error(`Unsupported driver [${driver}].`);
        }
    }

    /**
     * Create a new connection instance.
     */
    protected createConnection(
        name: string,
        driver: string,
        connection: Pdo,
        schemaConnection: Pdo,
        config: DatabaseConfig,
        database: string,
        prefix: string
    ): DriverConnectionI {
        switch (driver) {
            case 'mysql':
                return new MysqlConnection(name, connection, schemaConnection, config, database, prefix);
            case 'pgsql':
                return new PostgresConnection(name, connection, schemaConnection, config, database, prefix);
            case 'sqlite':
                return new SqliteConnection(name, connection, schemaConnection, config, database, prefix);
            case 'sqlsrv':
                return new SqlserverConnection(name, connection, schemaConnection, config, database, prefix);
            default:
                throw new Error(`Unsupported driver [${config.driver}].`);
        }
    }
}

export default ConnectionFactory;
