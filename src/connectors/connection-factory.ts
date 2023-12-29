import { Pdo } from 'lupdo';
import Connection from '../connections/connection';
import MySqlConnection from '../connections/mysql-connection';
import PostgresConnection from '../connections/postgres-connection';
import SQLiteConnection from '../connections/sqlite-connection';
import SqlServerConnection from '../connections/sqlserver-connection';
import {
    ConnectionConfig,
    DriverConnectionOptions,
    DriverFLattedConfig,
    FlattedConnectionConfig,
    MySqlConfig,
    PostgresConfig,
    PreparedConnectionConfig,
    ReadWriteType,
    SQLiteConfig,
    SqlServerConfig
} from '../types/config';
import DriverConnectionI from '../types/connection/connection';
import ConnectorI from '../types/connector';
import { merge } from '../utils';
import Connector from './connector';
import MySqlConnector from './mysql-connectors';
import PostgresConnector from './postgres-connector';
import SQLiteConnector from './sqlite-connector';
import SqlServerConnector from './sqlserver-connector';

class ConnectionFactory {
    /**
     * Establish a PDO connection based on the configuration.
     */
    public make<T = MySqlConfig>(config: T, name: string): MySqlConnection;
    public make<T = SQLiteConfig>(config: T, name: string): SQLiteConnection;
    public make<T = PostgresConfig>(config: T, name: string): PostgresConnection;
    public make<T = SqlServerConfig>(config: T, name: string): SqlServerConnection;
    public make<T extends ConnectionConfig>(config: T, name: string): DriverConnectionI {
        config.prefix = config.prefix || '';
        config.database = config.database || '';
        config.name = config.name || name;

        if ('read' in config) {
            return this.createReadWriteConnection(config as PreparedConnectionConfig);
        }

        return this.createSingleConnection(config as FlattedConnectionConfig);
    }

    /**
     * Create a single database connection instance.
     */
    protected createSingleConnection(config: DriverFLattedConfig): DriverConnectionI {
        const pdo = this.createPdoResolver(config);
        const schemaPdo = this.createPdoSchemaResolver(config);

        return this.createConnection(config.driver, pdo, schemaPdo, config, config.database, config.prefix);
    }

    /**xx
     * Create a read / write database connection instance.
     */
    protected createReadWriteConnection(config: PreparedConnectionConfig): DriverConnectionI {
        const connection = this.createSingleConnection(this.getWriteConfig(config));

        return connection.setReadPdo(this.createReadPdo(config));
    }

    /**
     * Create a new PDO instance for reading.
     */
    protected createReadPdo(config: PreparedConnectionConfig): Pdo {
        return this.createPdoResolver(this.getReadConfig(config));
    }

    /**
     * Get the read configuration for a read / write connection.
     */
    protected getReadConfig(config: PreparedConnectionConfig): DriverFLattedConfig {
        return this.mergeReadWriteConfig(config, this.getReadWriteConfig(config, 'read'));
    }

    /**
     * Get the write configuration for a read / write connection.
     */
    protected getWriteConfig(config: PreparedConnectionConfig): DriverFLattedConfig {
        return this.mergeReadWriteConfig(config, this.getReadWriteConfig(config, 'write'));
    }

    /**
     * Get a read / write level configuration.
     */
    protected getReadWriteConfig(
        config: PreparedConnectionConfig,
        type: ReadWriteType
    ): DriverConnectionOptions | undefined {
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
    protected mergeReadWriteConfig(
        config: PreparedConnectionConfig,
        toMerge?: DriverConnectionOptions
    ): DriverFLattedConfig {
        const merged = merge<PreparedConnectionConfig>(config, toMerge ?? {});
        delete merged.read;
        delete merged.write;

        return merged;
    }

    /**
     * Create a new PDO instance for Schema.
     */
    protected createPdoSchemaResolver(config: DriverFLattedConfig): Pdo {
        return this.createConnector(config).connect(
            Object.assign({}, config, {
                pool: { min: 0, max: 1 }
            })
        );
    }

    /**
     * Create a new PDO instance.
     */
    protected createPdoResolver(config: DriverFLattedConfig): Pdo {
        return this.createConnector(config).connect(config);
    }

    /**
     * Create a connector instance based on the configuration.
     */
    protected createConnector(config: DriverFLattedConfig): ConnectorI {
        const driver = config.driver;

        if (!driver) {
            throw new TypeError('A driver must be specified.');
        }

        const resolver = Connector.getResolver(driver);

        if (resolver !== null) {
            return resolver();
        }

        switch (config.driver) {
            case 'mysql':
                return new MySqlConnector();
            case 'pgsql':
                return new PostgresConnector();
            case 'sqlite':
                return new SQLiteConnector();
            case 'sqlsrv':
                return new SqlServerConnector();
            default:
                throw new Error(`Unsupported driver [${config.driver}].`);
        }
    }

    /**
     * Create a new connection instance.
     */
    protected createConnection(
        driver: string,
        connection: Pdo,
        schemaConnection: Pdo,
        config: DriverFLattedConfig,
        database: string,
        prefix: string
    ): DriverConnectionI {
        const resolver = Connection.getResolver(driver);

        if (resolver !== null) {
            return resolver(connection, schemaConnection, config, database, prefix);
        }

        switch (driver) {
            case 'mysql':
                return new MySqlConnection(connection, schemaConnection, config, database, prefix);
            case 'pgsql':
                return new PostgresConnection(connection, schemaConnection, config, database, prefix);
            case 'sqlite':
                return new SQLiteConnection(connection, schemaConnection, config, database, prefix);
            case 'sqlsrv':
                return new SqlServerConnection(connection, schemaConnection, config, database, prefix);
            default:
                throw new Error(`Unsupported driver [${config.driver}].`);
        }
    }
}

export default ConnectionFactory;
