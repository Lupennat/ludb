import { Pdo } from 'lupdo';
import { Connection } from '../../../connections';
import MySqlConnection from '../../../connections/mysql-connection';
import PostgresConnection from '../../../connections/postgres-connection';
import SQLiteConnection from '../../../connections/sqlite-connection';
import SqlServerConnection from '../../../connections/sqlserver-connection';
import ConnectionFactory from '../../../connectors/connection-factory';
import Connector from '../../../connectors/connector';
import DatabaseManager from '../../../database-manager';
import { mysqlConfig, postgresConfig, sqliteConfig, sqlserverConfig } from '../fixtures/config';
import { MockedFactory, pdo, schemaPdo } from '../fixtures/mocked';

describe('Connection Factory', () => {
    const db = new DatabaseManager();

    db.addConnection({
        driver: 'sqlite',
        database: ':memory:'
    });
    db.addConnection(
        {
            driver: 'sqlite',
            read: {
                database: ':memory:'
            },
            write: {
                database: ':memory:'
            }
        },
        'read_write'
    );
    db.addConnection(
        {
            driver: 'sqlite',
            read: {
                database: ':memory:'
            },
            database: ':memory:'
        },
        'read_only'
    );
    db.addConnection(
        {
            driver: 'sqlite',
            write: {
                database: ':memory:'
            },
            database: ':memory:'
        },
        'write_only'
    );
    db.addConnection(
        {
            driver: 'sqlite',
            read: [
                {
                    database: ':memory:'
                },
                {
                    database: ':memory:'
                }
            ],
            database: ':memory:'
        },
        'read_multi'
    );

    afterAll(async () => {
        await pdo.disconnect();
        await schemaPdo.disconnect();
    });

    it('Works Connection Can Be Created', () => {
        expect(db.connection().getReadPdo()).toBeInstanceOf(Pdo);
        expect(db.connection().getPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('read_write').getReadPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('read_write').getPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('read_only').getReadPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('read_only').getPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('write_only').getReadPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('write_only').getPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('read_multi').getReadPdo()).toBeInstanceOf(Pdo);
        expect(db.connection('read_multi').getPdo()).toBeInstanceOf(Pdo);
    });

    it('Works If Driver Isnt Set Error Is Thrown', () => {
        expect(() => {
            new ConnectionFactory().make({}, 'unset');
        }).toThrow('A driver must be specified.');
    });

    it('Works Error Is Thrown On Unsupported Driver', () => {
        expect(() => {
            new ConnectionFactory().make({ driver: 'foo' }, 'foo');
        }).toThrow('Unsupported driver [foo]');
    });

    it('Works Custom Connectors Can Be Resolved', () => {
        const callback = jest.fn();
        Connector.resolverFor('foo', callback);
        new MockedFactory().createConnector({ driver: 'foo', name: 'foo', database: '', prefix: '' });
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Custom Connection Can Be Resolved', () => {
        const callback = jest.fn();
        Connection.resolverFor('foo', callback);
        new MockedFactory().createConnection(
            'foo',
            pdo,
            schemaPdo,
            { driver: 'foo', name: 'foo', database: '', prefix: '' },
            '',
            ''
        );
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Error Is Thrown On Unsupported Connection', () => {
        expect(() => {
            new MockedFactory().createConnection(
                'baz',
                pdo,
                schemaPdo,
                { driver: 'baz', name: 'baz', database: '', prefix: '' },
                '',
                ''
            );
        }).toThrow('Unsupported driver [baz]');
    });

    it('Works MySql Driver', () => {
        expect(new ConnectionFactory().make(mysqlConfig, 'mysql')).toBeInstanceOf(MySqlConnection);
    });

    it('Works SQLite Driver', () => {
        expect(new ConnectionFactory().make(sqliteConfig, 'sqlite')).toBeInstanceOf(SQLiteConnection);
    });

    it('Works Postgres Driver', () => {
        expect(new ConnectionFactory().make(postgresConfig, 'postgres')).toBeInstanceOf(PostgresConnection);
    });

    it('Works SqlServer Driver', () => {
        expect(new ConnectionFactory().make(sqlserverConfig, 'sqlServer')).toBeInstanceOf(SqlServerConnection);
    });
});
