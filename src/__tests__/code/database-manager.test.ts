import { Pdo, TypedBinding } from 'lupdo';
import { Connection } from '../../connections';
import MysqlConnection from '../../connections/mysql-connection';
import PostgresConnection from '../../connections/postgres-connection';
import SQLiteConnection from '../../connections/sqlite-connection';
import SqlserverConnection from '../../connections/sqlserver-connection';
import DatabaseManager from '../../database-manager';
import Expression from '../../query/expression';
import { MockedDatabaseManager } from './fixtures/mocked';

describe('Database Manager', () => {
    it('Works Connection Return Connection', () => {
        const db = new DatabaseManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' },
                mysql: { driver: 'mysql', database: 'localhost' },
                sqlsrv: { driver: 'sqlsrv', database: 'localhost' },
                pgsql: { driver: 'pgsql', database: 'localhost' }
            }
        });

        expect(db.connection('sqlite')).toBeInstanceOf(SQLiteConnection);
        expect(db.connection('mysql')).toBeInstanceOf(MysqlConnection);
        expect(db.connection('sqlsrv')).toBeInstanceOf(SqlserverConnection);
        expect(db.connection('pgsql')).toBeInstanceOf(PostgresConnection);
    });

    it('Works Raw Return Expression', () => {
        const db = new DatabaseManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });
        const raw = db.raw('rawValue');
        expect(raw).toBeInstanceOf(Expression);
    });

    it('Works Bind To', () => {
        const db = new DatabaseManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });
        const typed = db.bindTo.bigInteger('934342342342343232');
        expect(typed).toBeInstanceOf(TypedBinding);
    });

    it('Works Connection Should Be Created Once', () => {
        const db = new MockedDatabaseManager({
            connections: { test: { driver: 'sqlite', database: ':memory:' } }
        });

        const spiedConfigure = jest.spyOn(db, 'createConnection');
        db.connection('test');
        db.connection('test');
        expect(spiedConfigure).toHaveBeenCalledTimes(1);
    });

    it('Works Get Connections', () => {
        const db = new DatabaseManager({
            connections: { test: { driver: 'sqlite', database: ':memory:' } }
        });
        expect(db.getConnections()).toEqual({});
        db.connection('test');
        expect('test' in db.getConnections()).toBeTruthy();
    });

    it('Works Purge Connection Should Disconnect And Remove From Cache', async () => {
        const db = new DatabaseManager({
            connections: { purge: { driver: 'sqlite', database: ':memory:' } }
        });
        const spiedDisconnect = jest.spyOn(db, 'disconnect');
        db.connection('purge');
        expect('purge' in db.getConnections()).toBeTruthy();
        await db.purge('purge');
        expect(spiedDisconnect).toHaveBeenCalledWith('purge');
        expect(db.getConnections()).toEqual({});
    });

    it('Works Disconnect Should Disconnect All Pdo', async () => {
        const db = new DatabaseManager({
            connections: {
                disconnect: {
                    driver: 'sqlite',
                    database: ':memory:',
                    read: {
                        readonly: true
                    },
                    write: { readonly: false }
                }
            }
        });

        const conn = db.connection('disconnect');
        expect('disconnect' in db.getConnections()).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeFalsy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeFalsy();
        // @ts-expect-error not exposed
        expect(conn.getSchemaPdo().driver.disconnected).toBeFalsy();
        await db.disconnect('disconnect');
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getSchemaPdo().driver.disconnected).toBeTruthy();
    });

    it('Works Terminate Should Disconnect All connections', async () => {
        const db = new DatabaseManager({
            connections: {
                disconnect: {
                    driver: 'sqlite',
                    database: ':memory:',
                    read: {
                        readonly: true
                    },
                    write: { readonly: false }
                },
                disconnect2: {
                    driver: 'sqlite',
                    database: ':memory:',
                    read: {
                        readonly: true
                    },
                    write: { readonly: false }
                }
            }
        });

        db.connection('disconnect');
        db.connection('disconnect2');
        const connections = db.getConnections();
        expect('disconnect' in connections).toBeTruthy();
        expect('disconnect2' in connections).toBeTruthy();

        for (const key in connections) {
            // @ts-expect-error not exposed
            expect(connections[key].getPdo().driver.disconnected).toBeFalsy();
            // @ts-expect-error not exposed
            expect(connections[key].getReadPdo().driver.disconnected).toBeFalsy();
            // @ts-expect-error not exposed
            expect(connections[key].getSchemaPdo().driver.disconnected).toBeFalsy();
        }

        await db.terminate();

        for (const key in connections) {
            // @ts-expect-error not exposed
            expect(connections[key].getPdo().driver.disconnected).toBeTruthy();
            // @ts-expect-error not exposed
            expect(connections[key].getReadPdo().driver.disconnected).toBeTruthy();
            // @ts-expect-error not exposed
            expect(connections[key].getSchemaPdo().driver.disconnected).toBeTruthy();
        }
    });

    it('Works Reconnect Should Reconnect All Pdo', async () => {
        const db = new DatabaseManager({
            connections: {
                reconnect: {
                    driver: 'sqlite',
                    database: ':memory:',
                    read: {
                        readonly: true
                    },
                    write: { readonly: false }
                }
            }
        });

        const conn = db.connection('reconnect');
        expect('reconnect' in db.getConnections()).toBeTruthy();
        await db.disconnect('reconnect');
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeTruthy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeTruthy();
        await db.reconnect('reconnect');
        // @ts-expect-error not exposed
        expect(conn.getPdo().driver.disconnected).toBeFalsy();
        // @ts-expect-error not exposed
        expect(conn.getReadPdo().driver.disconnected).toBeFalsy();
    });

    it('Works Reconnect Should Create And Return Connection', async () => {
        const db = new DatabaseManager({
            connections: {
                reconnect: {
                    driver: 'sqlite',
                    database: ':memory:',
                    read: {
                        readonly: true
                    },
                    write: { readonly: false }
                }
            }
        });
        expect('reconnect' in db.getConnections()).toBeFalsy();
        expect(await db.reconnect('reconnect')).toBeInstanceOf(Connection);
        expect('reconnect' in db.getConnections()).toBeTruthy();
    });

    it('Works Supported Drivers', () => {
        const db = new DatabaseManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });
        expect(db.supportedDrivers()).toEqual(['mysql', 'pgsql', 'sqlite', 'sqlsrv']);
    });

    it('Works Load Drivers', () => {
        const db = new MockedDatabaseManager({
            connections: {}
        });
        db.loadDriver('sqlite');
        db.loadDriver('mysql');
        db.loadDriver('pgsql');
        db.loadDriver('sqlsrv');
        expect(() => {
            db.loadDriver('not_loadable');
        }).toThrow('unsupported lupdo driver');
    });

    it('Works Available Drivers', () => {
        jest.spyOn(Pdo, 'getAvailableDrivers').mockReturnValueOnce(['mysql', 'pgsql']);
        const db = new DatabaseManager({
            connections: {
                sqlite: { driver: 'sqlite', database: ':memory:' }
            }
        });
        expect(db.availableDrivers()).toEqual(['mysql', 'pgsql']);
        expect(db.availableDrivers()).toEqual(['mysql', 'pgsql', 'sqlite', 'sqlsrv']);
    });

    it('Works Not Available Drivers throw Error', () => {
        jest.spyOn(Pdo, 'getAvailableDrivers').mockReturnValueOnce(['mysql', 'pgsql']);
        const db = new DatabaseManager({
            connections: {
                // @ts-expect-error wrong driver
                wrong: { driver: 'wrong', database: ':memory:' }
            }
        });
        expect(() => {
            db.connection('wrong');
        }).toThrow('Lupdo driver is missing, please install driver for "wrong"');
    });
});
