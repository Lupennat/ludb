import DatabaseManager from '../../../database-manager';

type currentGenericDB = currentPostgresDB | currentMysqlDB | currentSqliteDB | currentSqlserverDB;

export type currentPostgresDB = 'postgres12' | 'postgres16';
export type currentMysqlDB = 'mysql57' | 'mysql8' | 'maria1003' | 'maria1011';
export type currentSqliteDB = 'sqlite';
export type currentSqlserverDB = 'sqlsrv17' | 'sqlsrv22';

export const currentGenericDB: currentGenericDB = process.env.DB as currentGenericDB;

export const config = {
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
        search_path: undefined,
        host: 'localhost',
        database: 'tempdb',
        port: 25431
    },
    postgres16: {
        driver: 'pgsql',
        username: 'lupdo',
        password: 'lupdos3cRet',
        search_path: undefined,
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
} as const;

export const DB = new DatabaseManager({ connections: config });

export function isMysql(): boolean {
    return config[currentGenericDB].driver === 'mysql';
}

export function isSqlite(): boolean {
    return config[currentGenericDB].driver === 'sqlite';
}

export function isPostgres(): boolean {
    return config[currentGenericDB].driver === 'pgsql';
}

export function isSqlserver(): boolean {
    return config[currentGenericDB].driver === 'sqlsrv';
}
