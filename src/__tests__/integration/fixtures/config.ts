import DatabaseManager from '../../../database-manager';

type currentDB =
    | 'mysql57'
    | 'mysql8'
    | 'maria1003'
    | 'maria1011'
    | 'sqlite'
    | 'postgres12'
    | 'postgres16'
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
            charset: 'utf8',
            collation: 'utf8_unicode_ci',
            strict: true,
            database: 'tempdb'
        },
        mysql8: {
            driver: 'mysql',
            host: 'localhost',
            port: 5308,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        },
        maria1003: {
            driver: 'mysql',
            host: 'localhost',
            port: 31003,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        },
        maria1011: {
            driver: 'mysql',
            host: 'localhost',
            port: 31011,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            strict: true,
            database: 'tempdb'
        },
        sqlite: {
            driver: 'sqlite',
            database: __dirname + '/../../../../.sqlite3.db',
            foreign_key_constraints: true,
            journal_mode_wal: true
        },
        postgres12: {
            driver: 'pgsql',
            username: 'lupdo',
            password: 'lupdos3cRet',
            host: 'localhost',
            database: 'tempdb',
            port: 25431
        },
        postgres16: {
            driver: 'pgsql',
            username: 'lupdo',
            password: 'lupdos3cRet',
            host: 'localhost',
            database: 'tempdb',
            port: 25435
        },
        sqlsrv17: {
            port: 21433,
            driver: 'sqlsrv',
            database: 'tempdb',
            username: 'sa',
            password: 'lupdo@s3cRet',
            host: 'localhost',
            trust_server_certificate: true
        },
        sqlsrv22: {
            port: 21435,
            driver: 'sqlsrv',
            database: 'tempdb',
            username: 'sa',
            password: 'lupdo@s3cRet',
            host: 'localhost',
            trust_server_certificate: true
        }
    }
} as const;

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
