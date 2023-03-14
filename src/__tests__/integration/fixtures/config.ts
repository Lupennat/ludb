import DatabaseManager from '../../../database-manager';
import { MySqlConfig, PostgresConfig, SQLiteConfig, SqlServerConfig } from '../../../types/config';

export const currentDB: string = process.env.DB as string;

export function isMySql(): boolean {
    return currentDB === 'mysql' || currentDB === 'maria';
}

export function isSQLite(): boolean {
    return currentDB === 'sqlite';
}

export function isPostgres(): boolean {
    return currentDB === 'postgres';
}

export function isSqlServer(): boolean {
    return currentDB === 'sqlsrv';
}

export const config = {
    default: currentDB,
    connections: {
        mysql: {
            driver: 'mysql',
            host: 'localhost',
            port: 5308,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            database: 'tempdb'
        } as MySqlConfig,
        maria: {
            driver: 'mysql',
            host: 'localhost',
            port: 31011,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            database: 'tempdb'
        } as MySqlConfig,
        sqlite: {
            driver: 'sqlite',
            database: __dirname + '/../../../../.sqlite3.db',
            foreign_key_constraints: true
        } as SQLiteConfig,
        postgres: {
            driver: 'pgsql',
            username: 'lupdo',
            password: 'lupdos3cRet',
            host: 'localhost',
            database: 'tempdb',
            port: 25435
        } as PostgresConfig,
        sqlsrv: {
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
