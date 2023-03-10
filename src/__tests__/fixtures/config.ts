import { MySqlConfig, PostgresConfig, SQLiteConfig, SqlServerConfig } from '../../types/config';

export const sqliteConfig: SQLiteConfig = {
    driver: 'sqlite',
    database: ':memory:'
};

export const mysqlConfig: MySqlConfig = {
    driver: 'mysql'
};

export const postgresConfig: PostgresConfig = {
    driver: 'pgsql'
};

export const sqlserverConfig: SqlServerConfig = {
    driver: 'sqlsrv',
    username: 'sa',
    password: 'lupdo@s3cRet'
};
