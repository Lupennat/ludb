import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import MysqlConnection from '../connections/mysql-connection';
import PostgresConnection from '../connections/postgres-connection';
import SqliteConnection from '../connections/sqlite-connection';
import SqlserverConnection from '../connections/sqlserver-connection';
import { MysqlConfig, PostgresConfig, SqliteConfig, SqlserverConfig } from './config';

export interface DBMysqlConfig extends MysqlConfig {
    /**
     * The driver name
     */
    driver: 'mysql';
}

export interface DBSqliteConfig extends SqliteConfig {
    /**
     * The driver name
     */
    driver: 'sqlite';
}

export interface DBPostgresConfig extends PostgresConfig {
    /**
     * The driver name
     */
    driver: 'pgsql';
}

export interface DBSqlserverConfig extends SqlserverConfig {
    /**
     * The driver name
     */
    driver: 'sqlsrv';
}

export type DBConnectionsConfig = DBMysqlConfig | DBSqliteConfig | DBPostgresConfig | DBSqlserverConfig;

export type DBConnections = Record<string, DBConnectionsConfig>;

export type DBConfig = {
    attributes?: PdoAttributes;
    connections: DBConnections;
};

export type ExtractConnection<T> = T extends { driver: 'mysql' }
    ? MysqlConnection
    : T extends { driver: 'sqlite' }
      ? SqliteConnection
      : T extends { driver: 'pgsql' }
        ? PostgresConnection
        : SqlserverConnection;
