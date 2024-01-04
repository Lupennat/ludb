import { MssqlIsolationLevel, MssqlOptions } from 'lupdo-mssql';
import { MysqlOptions } from 'lupdo-mysql';
import { PostgresOptions } from 'lupdo-postgres';
import { SqliteOptions } from 'lupdo-sqlite';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import { PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';

export interface DatabaseConnectionOptions {
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
    /**
     * pool options
     */
    pool?: PoolOptions;
}

interface MysqlConnectionOptions extends DatabaseConnectionOptions {
    /**
     * connection charset
     */
    charset?: string;
    /**
     * connection collation
     */
    collation?: string;
    /**
     * strict mode
     */
    strict?: boolean;
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
     * Database Version
     */
    version?: string;
    /**
     * lupdo-mysql options
     */
    lupdo_options?: MysqlOptions;
}

export interface MysqlConfig extends MysqlConnectionOptions {
    /**
     * write connection
     */
    write?: MysqlConnectionOptions | MysqlConnectionOptions[];
    /**
     * read connection
     */
    read?: MysqlConnectionOptions | MysqlConnectionOptions[];
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * pdo attributes
     */
    attributes?: PdoAttributes;
}

interface SqliteConnectionOptions {
    /**
     * database
     */
    database?: string;
    /**
     * table prefix
     */
    prefix?: string;
    /**
     * pool options
     */
    pool?: PoolOptions;
    /**
     * make Database ReadOnly
     */
    readonly?: boolean;
    /**
     * Enable foreign key constraints.
     */
    foreign_key_constraints?: boolean;
    /**
     * Enable journal_mode WAL.
     */
    journal_mode_wal?: boolean;
    /**
     * WAL file will max size in mb.
     */
    wal_max_size?: number;
    /**
     * Define WAL synchronous type.
     */
    wal_synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
    /**
     * error WAL interceptor for wal_max_size watcher error
     */
    wal_on_error?: (err: any) => void | Promise<void>;
    /**
     * lupdo-sqlite options
     */
    lupdo_options?: SqliteOptions;
}

export interface SqliteConfig extends SqliteConnectionOptions {
    /**
     * write connection
     */
    write?: SqliteConnectionOptions | SqliteConnectionOptions[];
    /**
     * read connection
     */
    read?: SqliteConnectionOptions | SqliteConnectionOptions[];
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * pdo attributes
     */
    attributes?: PdoAttributes;
}

interface PostgresConnectionOptions extends DatabaseConnectionOptions {
    /**
     * database
     */
    database?: string;
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
    sslmode?: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full' | 'no-verify';
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

export interface PostgresConfig extends PostgresConnectionOptions {
    /**
     * write connection
     */
    write?: PostgresConnectionOptions | PostgresConnectionOptions[];
    /**
     * read connection
     */
    read?: PostgresConnectionOptions | PostgresConnectionOptions[];
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * pdo attributes
     */
    attributes?: PdoAttributes;
}

interface SqlserverConnectionOptions extends DatabaseConnectionOptions {
    /**
     * make Database ReadOnly
     */
    readonly?: boolean;
    /**
     * Database Version
     */
    version?: string;
    /**
     * encrypt connection
     */
    encrypt?: boolean;
    /**
     * exclude from drop tables
     */
    dont_drop?: string[];
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

export interface SqlserverConfig extends SqlserverConnectionOptions {
    /**
     * write connection
     */
    write?: SqlserverConnectionOptions | SqlserverConnectionOptions[];
    /**
     * read connection
     */
    read?: SqlserverConnectionOptions | SqlserverConnectionOptions[];
    /**
     * use prefix for schema builder
     */
    prefix_indexes?: boolean;
    /**
     * pdo attributes
     */
    attributes?: PdoAttributes;
}

export type ReadWriteType = 'write' | 'read';

type DatabaseConfig = PostgresConfig | SqlserverConfig | MysqlConfig | SqliteConfig;

export type ConfigWithDefault<T, D> = T extends undefined ? D : T extends null ? D : T;

export type ConfigOrConfigWithDefault<T, U, D> = U extends keyof T
    ? D extends undefined
        ? T[U]
        : ConfigWithDefault<T[U], D>
    : T;

export default DatabaseConfig;
