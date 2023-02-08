import { MssqlIsolationLevel, MssqlOptions } from 'lupdo-mssql';
import { MysqlOptions } from 'lupdo-mysql';
import { PostgresOptions } from 'lupdo-postgres';
import { SqliteOptions } from 'lupdo-sqlite';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import { PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';

export type ReadWriteType = 'write' | 'read';

export interface ConnectionOptions {
    /**
     * database
     */
    database?: string;
    /**
     * host or list of host:port
     */
    host?: string | string[];
    /**
     * port number
     */
    port?: number;
    /**
     * username
     */
    username?: string;
    /**
     * password
     */
    password?: string;
    /**
     * table prefix
     */
    prefix?: string;
}

export interface FlattedConnectionConfig extends ConnectionOptions {
    /**
     * driver name
     */
    driver: string;
    /**
     * connection name
     */
    name: string;
    /**
     * table prefix
     */
    prefix: string;
    /**
     * pdo attributes
     */
    attributes?: PdoAttributes;
    /**
     * pool options
     */
    pool?: PoolOptions;
}

export interface PreparedConnectionConfig extends FlattedConnectionConfig {
    /**
     * connection name
     */
    name: string;
    /**
     * table prefix
     */
    prefix: string;
    /**
     * write connection
     */
    write?: ConnectionOptions | ConnectionOptions[];
    /**
     * read connection
     */
    read?: ConnectionOptions | ConnectionOptions[];
}

export interface ConnectionConfig extends Omit<PreparedConnectionConfig, 'name' | 'prefix'> {
    /**
     * connection name
     */
    name?: string;
    /**
     * table prefix
     */
    prefix?: string;
}

export interface MysqlConnectionOptions extends Omit<ConnectionOptions, 'prefix'> {
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * connection charset
     */
    charset?: string;
    /**
     * connection collation
     */
    collation?: string;
    /**
     * strict mode must be old if mysql < 8.0.11
     */
    strict?: 'new' | 'old' | false;
    /**
     * mysql table engine for schema builder
     */
    engine?: string;
    /**
     * custom modes
     */
    modes?: string[];
    /**
     * default timezone
     */
    timezone?: string;
    /**
     * transaction isolation level
     */
    isolation_level?: string;
    /**
     * The path to a unix domain socket to connect to. When used host and port are ignored
     */
    unix_socket?: string;
    /**
     * lupdo-mysql options
     */
    lupdo_options?: MysqlOptions;
}

export interface MysqlFlattedConfig extends FlattedConnectionConfig, MysqlConnectionOptions {}

export interface MysqlConfig extends MysqlFlattedConfig {
    /**
     * driver name
     */
    driver: 'mysql' | 'mariadb';
    /**
     * write connection
     */
    write?: MysqlConnectionOptions | MysqlConnectionOptions[];
    /**
     * read connection
     */
    read?: MysqlConnectionOptions | MysqlConnectionOptions[];
}

export interface SQliteConnectionOptions
    extends Omit<ConnectionOptions, 'host' | 'port' | 'username' | 'password' | 'prefix'> {
    /**
     * make Database ReadOnly
     */
    readonly?: boolean;
    /**
     * Enable foreign key constraints.
     */
    foreign_key_constraints?: boolean;
    /**
     * lupdo-sqlite options
     */
    lupdo_options?: SqliteOptions;
}

export interface SQliteFlattedConfig
    extends Omit<FlattedConnectionConfig, 'host' | 'port' | 'username' | 'password'>,
        SQliteConnectionOptions {}

export interface SQliteConfig extends SQliteFlattedConfig {
    /**
     * driver name
     */
    driver: 'sqlite';
    /**
     * write connection
     */
    write?: SQliteConnectionOptions | SQliteConnectionOptions[];
    /**
     * read connection
     */
    read?: SQliteConnectionOptions | SQliteConnectionOptions[];
}

export interface PostgresConnectionOptions extends Omit<ConnectionOptions, 'prefix'> {
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * connection charset
     */
    charset?: string;
    /**
     * default timezone
     */
    timezone?: string;
    /**
     * transaction isolation level
     */
    isolation_level?: string;
    /**
     * search path
     */
    search_path?: string;
    /**
     * schema
     */
    schema?: string;
    /**
     * application name
     */
    application_name?: string;
    /**
     * Specifies how much WAL processing must complete
     * before the database server returns a success indication to the client.
     */
    synchronous_commit?: string;
    /**
     * ssl mode
     */
    sslmode?: string;
    /**
     * trusted CA certificates path.
     */
    sslrootcert?: string;
    /**
     * Cert chains path.
     */
    sslcert?: string;
    /**
     * Private key path.
     */
    sslkey?: string;
    /**
     * lupdo-postgres options
     */
    lupdo_options?: PostgresOptions;
}

export interface PostgresFlattedConfig extends FlattedConnectionConfig, PostgresConnectionOptions {}

export interface PostgresConfig extends PostgresFlattedConfig {
    /**
     * driver name
     */
    driver: 'pgsql';
    /**
     * write connection
     */
    write?: PostgresConnectionOptions | PostgresConnectionOptions[];
    /**
     * read connection
     */
    read?: PostgresConnectionOptions | PostgresConnectionOptions[];
}

export interface SqlServerConnectionOptions extends ConnectionOptions {
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * make Database ReadOnly
     */
    readonly?: boolean;
    /**
     * make Database ReadOnly
     */
    version?: string;
    /**
     * encrypt connection
     */
    encrypt?: boolean;
    /**
     * column encryption
     */
    column_encryption?: boolean;
    /**
     * transaction isolation level
     */
    isolation_level?: MssqlIsolationLevel;
    /**
     * app name
     */
    appname?: string;
    /**
     * force trust server certificate
     */
    trust_server_certificate?: boolean;
    /**
     * multi subnet failover
     */
    multi_subnet_failover: boolean;
    /**
     * lupdo-mssql options
     */
    lupdo_options?: MssqlOptions;
}

export interface SqlServerFlattedConfig extends FlattedConnectionConfig, Omit<SqlServerConnectionOptions, 'prefix'> {}

export interface SqlServerConfig extends SqlServerFlattedConfig {
    /**
     * driver name
     */
    driver: 'sqlsrv';
    /**
     * write connection
     */
    write?: SqlServerConnectionOptions | SqlServerConnectionOptions[];
    /**
     * read connection
     */
    read?: SqlServerConnectionOptions | SqlServerConnectionOptions[];
}

export type DriverConnectionOptions =
    | PostgresConnectionOptions
    | SqlServerConnectionOptions
    | MysqlConnectionOptions
    | SQliteConnectionOptions
    | ConnectionOptions;

export type DriverConfig = PostgresConfig | SqlServerConfig | MysqlConfig | SQliteConfig | ConnectionConfig;

export type DriverFLattedConfig =
    | PostgresFlattedConfig
    | SqlServerFlattedConfig
    | MysqlFlattedConfig
    | SQliteFlattedConfig
    | FlattedConnectionConfig;

export interface DatabaseConfig {
    default: string;
    connections: {
        [key: string]: DriverConfig;
    };
}
