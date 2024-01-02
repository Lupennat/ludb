import { MysqlConfig, PostgresConfig, SqliteConfig, SqlserverConfig } from '../../../types/config';

export const sqliteConfig: SqliteConfig = {
    driver: 'sqlite',
    database: ':memory:'
};

export const mysqlConfig: MysqlConfig = {
    driver: 'mysql'
};

export const postgresConfig: PostgresConfig = {
    driver: 'pgsql'
};

export const sqlserverConfig: SqlserverConfig = {
    driver: 'sqlsrv',
    username: 'sa',
    password: 'lupdo@s3cRet'
};
