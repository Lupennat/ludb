import DatabaseManager from '../../../src/database-manager';

type currentGenericDB =
  | currentPostgresDB
  | currentMysqlDB
  | currentSqliteDB
  | currentSqlserverDB;

export type currentPostgresDB = 'postgres12' | 'postgres16';
export type currentMysqlDB = 'mysql57' | 'mysql8' | 'maria1003' | 'maria1011';
export type currentSqliteDB = 'sqlite';
export type currentSqlserverDB = 'sqlsrv22';

export const currentGenericDB: currentGenericDB = process.env
  .DB as currentGenericDB;

export const config = {
  mysql57: {
    driver: 'mysql',
    host: 'mysql57',
    port: 3306,
    username: 'lupdo',
    password: 'lupdo@s3cRet',
    charset: 'utf8',
    collation: 'utf8_unicode_ci',
    strict: true,
    database: 'tempdb',
  },
  mysql8: {
    driver: 'mysql',
    host: 'mysql8',
    port: 3306,
    username: 'lupdo',
    password: 'lupdo@s3cRet',
    strict: true,
    database: 'tempdb',
  },
  maria1003: {
    driver: 'mysql',
    host: 'maria1003',
    port: 3306,
    username: 'lupdo',
    password: 'lupdo@s3cRet',
    strict: true,
    database: 'tempdb',
  },
  maria1011: {
    driver: 'mysql',
    host: 'maria1011',
    port: 3306,
    username: 'lupdo',
    password: 'lupdo@s3cRet',
    strict: true,
    database: 'tempdb',
  },
  sqlite: {
    driver: 'sqlite',
    database: __dirname + '/../../../sqlite3.db',
    foreign_key_constraints: true,
    journal_mode_wal: true,
  },
  postgres12: {
    driver: 'pgsql',
    username: 'lupdo',
    password: 'lupdos3cRet',
    search_path: undefined,
    host: 'postgres12',
    database: 'tempdb',
    port: 5432,
  },
  postgres16: {
    driver: 'pgsql',
    username: 'lupdo',
    password: 'lupdos3cRet',
    search_path: undefined,
    host: 'postgres16',
    database: 'tempdb',
    port: 5432,
  },
  sqlsrv17: {
    port: 1433,
    driver: 'sqlsrv',
    database: 'tempdb',
    username: 'sa',
    password: 'lupdo@s3cRet',
    host: 'sqlsrv17',
    trust_server_certificate: true,
  },
  sqlsrv22: {
    port: 1433,
    driver: 'sqlsrv',
    database: 'tempdb',
    username: 'sa',
    password: 'lupdo@s3cRet',
    host: 'sqlsrv22',
    trust_server_certificate: true,
  },
} as const;

export const DB = new DatabaseManager({ connections: config });

export function isMysql8(): boolean {
  return currentGenericDB === 'mysql8';
}

export function isPostgres16(): boolean {
  return currentGenericDB === 'postgres16';
}

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
