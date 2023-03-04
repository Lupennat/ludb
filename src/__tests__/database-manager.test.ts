import Connection from '../connections/connection';
import SQLiteConnection from '../connections/sqlite-connection';
import DatabaseManager from '../database-manager';
import Expression from '../query/expression';
import { FlattedConnectionConfig } from '../types/config';
import { pdo, schemaPdo } from './fixtures/mocked';

describe('Database Manager', () => {
    it('Works Connection Return Connection', () => {
        const db = new DatabaseManager({
            default: 'sqlite',
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' },
                sqlite_read_write: { driver: 'sqlite', read: { database: ':memory:' }, write: { database: ':memory:' } }
            }
        });
        expect(db.connection()).toBeInstanceOf(SQLiteConnection);
        expect(db.connection('sqlite')).toBeInstanceOf(SQLiteConnection);
        expect(db.connection('sqlite_read_write::read')).toBeInstanceOf(SQLiteConnection);
        expect(db.connection('sqlite_read_write::write')).toBeInstanceOf(SQLiteConnection);
    });

    it('Works Add Connection', () => {
        const db = new DatabaseManager();
        expect(() => {
            db.connection('sqlite2');
        }).toThrowError('Database connection [sqlite2] not configured.');
        db.addConnection({ driver: 'sqlite', database: ':memory:' }, 'sqlite2');
        expect(db.connection('sqlite2')).toBeInstanceOf(SQLiteConnection);
    });

    it('Works Raw Return Expression', () => {
        const db = new DatabaseManager();
        const raw = db.raw('rawValue');
        expect(raw).toBeInstanceOf(Expression);
    });

    it('Works Get Connections', () => {
        const db = new DatabaseManager({
            default: 'test',
            connections: { test: { driver: 'sqlite', database: ':memory:' } }
        });
        expect(db.getConnections()).toEqual({});
        db.connection();
        expect('test' in db.getConnections()).toBeTruthy();
    });

    it('Works Purge Connection Should Disconnect And Remove From Cache', async () => {
        const db = new DatabaseManager({
            default: 'purge',
            connections: { purge: { driver: 'sqlite', database: ':memory:' } }
        });
        const spiedDisconnect = jest.spyOn(db, 'disconnect');
        db.connection();
        expect('purge' in db.getConnections()).toBeTruthy();
        await db.purge();
        expect(spiedDisconnect).toBeCalledWith('purge');
        expect(db.getConnections()).toEqual({});
    });

    it('Works Disconnect Should Disconnect All Pdo', async () => {
        const db = new DatabaseManager({
            default: 'disconnect',
            connections: {
                disconnect: { driver: 'sqlite', read: { database: ':memory:' }, write: { database: ':memory:' } }
            }
        });

        const conn = db.connection();
        expect('disconnect' in db.getConnections()).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeFalsy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeFalsy();
        await db.disconnect();
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeTruthy();
    });

    it('Works Reconnect Should Reconnect All Pdo', async () => {
        const db = new DatabaseManager({
            default: 'reconnect',
            connections: {
                reconnect: { driver: 'sqlite', read: { database: ':memory:' }, write: { database: ':memory:' } }
            }
        });

        const conn = db.connection();
        expect('reconnect' in db.getConnections()).toBeTruthy();
        await db.disconnect();
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeTruthy();
        await db.reconnect();
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeFalsy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeFalsy();
    });

    it('Works Reconnect Should Create And Return Connection', async () => {
        const db = new DatabaseManager({
            default: 'reconnect',
            connections: {
                reconnect: { driver: 'sqlite', read: { database: ':memory:' }, write: { database: ':memory:' } }
            }
        });
        expect('reconnect' in db.getConnections()).toBeFalsy();
        expect(await db.reconnect()).toBeInstanceOf(Connection);
        expect('reconnect' in db.getConnections()).toBeTruthy();
    });

    it('Works Get Default Connection', async () => {
        const db = new DatabaseManager({
            default: 'test',
            connections: {}
        });

        expect(db.getDefaultConnection()).toBe('test');
    });

    it('Works Set Default Connection', async () => {
        const db = new DatabaseManager({
            default: 'test',
            connections: {}
        });
        db.setDefaultConnection('test2');
        expect(db.getDefaultConnection()).toBe('test2');
    });

    it('Works Supported Drivers', () => {
        const db = new DatabaseManager();
        expect(db.supportedDrivers()).toEqual(['mysql', 'mariadb', 'pgsql', 'sqlite', 'sqlsrv']);
    });

    it('Works Available Drivers', () => {
        const db = new DatabaseManager();
        expect(db.availableDrivers()).toEqual(['mysql', 'mariadb', 'pgsql', 'sqlite', 'sqlsrv']);
    });

    it('Works Extend', () => {
        const db = new DatabaseManager({
            default: 'test',
            connections: {
                test: { driver: 'new-driver' },
                test2: { driver: 'new-driver' },
                'test-name': { driver: 'new-driver', database: ':memory:' }
            }
        });
        expect(() => {
            db.connection('test');
        }).toThrowError('Unsupported driver [new-driver].');
        class TestConnection extends Connection {}
        db.extend('new-driver', (config, name) => {
            config.name = name;
            return new TestConnection(pdo, schemaPdo, config as FlattedConnectionConfig, '', '');
        });
        class TestNameConnection extends Connection {}
        db.extend('test-name', (config, name) => {
            config.name = name;
            return new TestNameConnection(pdo, schemaPdo, config as FlattedConnectionConfig, '', '');
        });
        expect(db.connection('test')).toBeInstanceOf(TestConnection);
        expect(db.connection('test-name')).toBeInstanceOf(TestNameConnection);
        db.forgetExtension('new-driver');
        db.forgetExtension('test-name');
        expect(() => {
            db.connection('test2');
        }).toThrowError('Unsupported driver [new-driver].');
    });
});
