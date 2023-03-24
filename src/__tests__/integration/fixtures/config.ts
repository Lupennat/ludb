import DatabaseManager from '../../../database-manager';
import { MySqlConfig, PostgresConfig, SQLiteConfig, SqlServerConfig } from '../../../types/config';

type currentDB =
    | 'mysql57'
    | 'mysql8'
    | 'maria1003'
    | 'maria1011'
    | 'sqlite'
    | 'postgres11'
    | 'postgres15'
    | 'sqlsrv17'
    | 'sqlsrv22';

export const currentDB: currentDB = process.env.DB as currentDB;

export const config = {
    default: currentDB,
    connections: {
        mysql57: {
            driver: 'mysql',
            host: 'localhost',
            port: 5307,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        } as MySqlConfig,
        mysql8: {
            driver: 'mysql',
            host: 'localhost',
            port: 5308,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        } as MySqlConfig,
        maria1003: {
            driver: 'mysql',
            host: 'localhost',
            port: 31003,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        } as MySqlConfig,
        maria1011: {
            driver: 'mysql',
            host: 'localhost',
            port: 31011,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        } as MySqlConfig,
        sqlite: {
            driver: 'sqlite',
            database: __dirname + '/../../../../.sqlite3.db',
            foreign_key_constraints: true,
            journal_mode_wal: true
        } as SQLiteConfig,
        postgres11: {
            driver: 'pgsql',
            username: 'lupdo',
            password: 'lupdos3cRet',
            host: 'localhost',
            database: 'tempdb',
            port: 25431
        } as PostgresConfig,
        postgres15: {
            driver: 'pgsql',
            username: 'lupdo',
            password: 'lupdos3cRet',
            host: 'localhost',
            database: 'tempdb',
            port: 25435
        } as PostgresConfig,
        sqlsrv17: {
            port: 21433,
            driver: 'sqlsrv',
            database: 'tempdb',
            username: 'sa',
            password: 'lupdo@s3cRet',
            host: 'localhost',
            trust_server_certificate: true
        } as SqlServerConfig,
        sqlsrv22: {
            port: 21435,
            driver: 'sqlsrv',
            database: 'tempdb',
            username: 'sa',
            password: 'lupdo@s3cRet',
            host: 'localhost',
            trust_server_certificate: true
        } as SqlServerConfig
    }
};

export const DB = new DatabaseManager(config);

export function isMySql(): boolean {
    return config.connections[currentDB].driver === 'mysql';
}

export function isSQLite(): boolean {
    return config.connections[currentDB].driver === 'sqlite';
}

export function isPostgres(): boolean {
    return config.connections[currentDB].driver === 'pgsql';
}

export function isSqlServer(): boolean {
    return config.connections[currentDB].driver === 'sqlsrv';
}
