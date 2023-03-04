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
     * database
     */
    database: string;
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
     * table prefix
     */
    database: string;
    /**
     * write connection
     */
    write?: ConnectionOptions | ConnectionOptions[];
    /**
     * read connection
     */
    read?: ConnectionOptions | ConnectionOptions[];
    /**
     * pdo attributes
     */
    attributes?: PdoAttributes;
    /**
     * pool options
     */
    pool?: PoolOptions;
}

export interface ConnectionConfig extends Omit<PreparedConnectionConfig, 'name' | 'prefix' | 'database'> {
    /**
     * connection name
     */
    name?: string;
    /**
     * table prefix
     */
    prefix?: string;
    /**
     * table prefix
     */
    database?: string;
}

export type MySqlStrict = `${'N' | 'n'}${'E' | 'e'}${'W' | 'w'}` | `${'O' | 'o'}${'L' | 'l'}${'D' | 'd'}`;

export interface MySqlConnectionOptions extends ConnectionOptions {
    /**
     * database
     */
    database?: string;
    /**
     * table prefix
     */
    prefix?: string;
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
    strict?: MySqlStrict | false;
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

export interface MySqlFlattedConfig
    extends FlattedConnectionConfig,
        Omit<MySqlConnectionOptions, 'prefix' | 'database'> {}

export interface MySqlConfig extends MySqlConnectionOptions {
    /**
     * driver name
     */
    driver: 'mysql' | 'mariadb';
    /**
     * write connection
     */
    write?: MySqlConnectionOptions | MySqlConnectionOptions[];
    /**
     * read connection
     */
    read?: MySqlConnectionOptions | MySqlConnectionOptions[];
}

export interface SQLiteConnectionOptions
    extends Omit<ConnectionOptions, 'host' | 'port' | 'username' | 'password' | 'database'> {
    /**
     * database
     */
    database: string;
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

export interface SQLiteFlattedConfig
    extends Omit<FlattedConnectionConfig, 'host' | 'port' | 'username' | 'password'>,
        Omit<SQLiteConnectionOptions, 'prefix'> {}

export interface SQLiteConfig extends SQLiteConnectionOptions {
    /**
     * driver name
     */
    driver: 'sqlite';
    /**
     * write connection
     */
    write?: SQLiteConnectionOptions | SQLiteConnectionOptions[];
    /**
     * read connection
     */
    read?: SQLiteConnectionOptions | SQLiteConnectionOptions[];
}

export type PostgresSslMode = 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full' | 'no-verify';

export interface PostgresConnectionOptions extends ConnectionOptions {
    /**
     * database
     */
    database?: string;
    /**
     * table prefix
     */
    prefix?: string;
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
    search_path?: string | string[];
    /**
     * schema
     */
    schema?: string;
    /**
     * exclude from drop tables
     */
    dont_drop?: string[];
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
    sslmode?: PostgresSslMode;
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

export interface PostgresFlattedConfig
    extends FlattedConnectionConfig,
        Omit<PostgresConnectionOptions, 'prefix' | 'database'> {}

export interface PostgresConfig extends PostgresConnectionOptions {
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
    multi_subnet_failover?: boolean;
    /**
     * lupdo-mssql options
     */
    lupdo_options?: MssqlOptions;
}

export interface SqlServerFlattedConfig
    extends FlattedConnectionConfig,
        Omit<SqlServerConnectionOptions, 'prefix' | 'database'> {}

export interface SqlServerConfig extends SqlServerConnectionOptions {
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
    | MySqlConnectionOptions
    | SQLiteConnectionOptions
    | ConnectionOptions;

export type DriverConfig = PostgresConfig | SqlServerConfig | MySqlConfig | SQLiteConfig | ConnectionConfig;

export type DriverFLattedConfig =
    | PostgresFlattedConfig
    | SqlServerFlattedConfig
    | MySqlFlattedConfig
    | SQLiteFlattedConfig
    | FlattedConnectionConfig;

export default interface DatabaseConfig {
    default: string;
    connections: {
        [key: string]: DriverConfig;
    };
}
