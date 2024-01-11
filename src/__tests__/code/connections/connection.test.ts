import { Pdo, TypedBinding } from 'lupdo';
import { EventEmitter } from 'stream';
import { bindTo } from '../../../bindings';
import ConnectionSession from '../../../connections/connection-session';
import QueryExecuted from '../../../events/query-executed';
import Raw from '../../../query/expression';
import Grammar from '../../../query/grammars/grammar';
import QueryBuilder from '../../../query/query-builder';

import CacheManager from '../../../cache-manager';
import Expression from '../../../query/expression';
import MysqlGrammar from '../../../query/grammars/mysql-grammar';
import PostgresGrammar from '../../../query/grammars/postgres-grammar';
import SqliteGrammar from '../../../query/grammars/sqlite-grammar';
import SqlserverGrammar from '../../../query/grammars/sqlserver-grammar';
import SchemaBuilder from '../../../schema/builders/builder';
import MysqlBuilder from '../../../schema/builders/mysql-builder';
import PostgresBuilder from '../../../schema/builders/postgres-builder';
import SqliteBuilder from '../../../schema/builders/sqlite-builder';
import SqlserverBuilder from '../../../schema/builders/sqlserver-builder';
import SchemaGrammar from '../../../schema/grammars/grammar';
import {
    getConnection,
    getMysqlConnection,
    getPostgresConnection,
    getSqliteConnection,
    getSqlserverConnection
} from '../fixtures/mocked';
import { MockedConnection } from '../fixtures/mocked-connections';

describe('Connection', () => {
    it('Works Disconnect Should Disconnect pdos', async () => {
        let connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            host: 'readhost',
            pool: {
                killResource: false
            }
        });

        let spiedPdo = jest.spyOn(connection, 'getPdo');
        let spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        let spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        await connection.disconnect();
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();

        connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            read: {
                host: 'readhost1'
            },
            host: 'readhost',
            pool: {
                killResource: false
            }
        });

        spiedPdo = jest.spyOn(connection, 'getPdo');
        spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        await connection.disconnect();
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();
    });

    it('Works Reconnect Should Reconnect pdos', async () => {
        let connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            host: 'readhost',
            pool: {
                killResource: false
            }
        });

        let spiedPdo = jest.spyOn(connection, 'getPdo');
        let spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        let spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        expect(await connection.reconnect()).toEqual(connection);
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();

        connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            read: {
                host: 'readhost1'
            },
            host: 'readhost',
            pool: {
                killResource: false
            }
        });

        spiedPdo = jest.spyOn(connection, 'getPdo');
        spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        expect(await connection.reconnect()).toEqual(connection);
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();
    });

    it('Works Session', () => {
        const session = getConnection().session();
        expect(session).toBeInstanceOf(ConnectionSession);
        expect(session.isSchema()).toBeFalsy();
    });

    it('Works Session Schema', () => {
        const schemaSession = getConnection().sessionSchema();
        expect(schemaSession).toBeInstanceOf(ConnectionSession);
        expect(schemaSession.isSchema()).toBeTruthy();
    });

    it('Works Query Grammar', () => {
        const connection = getConnection();
        class TestGrammar extends Grammar {}
        expect(connection.getQueryGrammar()).toBeInstanceOf(Grammar);
        expect(connection.getQueryGrammar()).not.toBeInstanceOf(TestGrammar);

        expect(getMysqlConnection().getQueryGrammar()).toBeInstanceOf(MysqlGrammar);
        expect(getPostgresConnection().getQueryGrammar()).toBeInstanceOf(PostgresGrammar);
        expect(getSqliteConnection().getQueryGrammar()).toBeInstanceOf(SqliteGrammar);
        expect(getSqlserverConnection().getQueryGrammar()).toBeInstanceOf(SqlserverGrammar);
    });

    it('Works Schema Grammar', () => {
        const connection = getConnection();
        class TestGrammar extends SchemaGrammar {}
        expect(connection.getSchemaGrammar()).toBeInstanceOf(SchemaGrammar);
        expect(connection.getSchemaGrammar()).not.toBeInstanceOf(TestGrammar);
    });

    it('Works Schema QueryBuilder', () => {
        const connection = getConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
    });

    it('Works Schema QueryBuilder', () => {
        expect(getConnection().getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
        expect(getMysqlConnection().getSchemaBuilder()).toBeInstanceOf(MysqlBuilder);
        expect(getPostgresConnection().getSchemaBuilder()).toBeInstanceOf(PostgresBuilder);
        expect(getSqliteConnection().getSchemaBuilder()).toBeInstanceOf(SqliteBuilder);
        expect(getSqlserverConnection().getSchemaBuilder()).toBeInstanceOf(SqlserverBuilder);
    });

    it('Works Event Dispatcher', () => {
        const connection = getConnection();
        class TestEmitter extends EventEmitter {}
        expect(connection.getEventDispatcher()).toBeUndefined();
        connection.setEventDispatcher(new TestEmitter());
        expect(connection.getEventDispatcher()).toBeInstanceOf(TestEmitter);
        connection.unsetEventDispatcher();
        expect(connection.getEventDispatcher()).toBeUndefined();
    });

    it('Works Cache Manager', () => {
        const connection = getConnection();
        expect(connection.getCacheManager()).toBeUndefined();
        connection.setCacheManager(
            new CacheManager({ connections: { sqlite: { driver: 'sqlite', database: ':memory:' } } })
        );
        expect(connection.getCacheManager()).toBeInstanceOf(CacheManager);
        connection.unsetCacheManager();
        expect(connection.getCacheManager()).toBeUndefined();
    });

    it('Works Bind Values', async () => {
        const pdo = new Pdo('fake', {});
        const connection = getConnection();
        let statement = await pdo.prepare('select * from users where name = ?');
        let spiedBindValue = jest.spyOn(statement, 'bindValue');
        const date = bindTo.date(new Date());
        connection.bindValues(statement, [null, date]);
        expect(spiedBindValue).toHaveBeenNthCalledWith(1, 1, null);
        expect(spiedBindValue).toHaveBeenNthCalledWith(2, 2, date);
        await statement.close();

        statement = await pdo.prepare('select * from users where name = ?');
        spiedBindValue = jest.spyOn(statement, 'bindValue');
        connection.bindValues(statement, { name: null, date });
        expect(spiedBindValue).toHaveBeenNthCalledWith(1, 'name', null);
        expect(spiedBindValue).toHaveBeenNthCalledWith(2, 'date', date);
        await statement.close();
        await pdo.disconnect();
    });

    it('Works Bind Expression Value Throw An Error', async () => {
        const pdo = new Pdo('fake', {});
        const connection = getConnection();
        let statement = await pdo.prepare('select * from users where name = ?');
        expect(() => {
            // @ts-expect-error test wrong binding
            connection.bindValues(statement, [new Raw('wrong')]);
        }).toThrow('Expression binding can not be binded directly to statement.');

        await statement.close();

        statement = await pdo.prepare('select * from users where name = ?');
        expect(() => {
            // @ts-expect-error test wrong binding
            connection.bindValues(statement, { wrong: new Raw('wrong') });
        }).toThrow('Expression binding can not be binded directly to statement.');

        await statement.close();
        await pdo.disconnect();
    });

    it('Works Prepare Bindings', () => {
        const connection = getConnection();
        expect(connection.prepareBindings([null, new Raw('expression')])).toEqual([null, 'expression']);
        expect(connection.prepareBindings({ name: null, expression: new Raw('expression') })).toEqual({
            name: null,
            expression: 'expression'
        });
    });

    it('Works Before Executing', () => {
        const connection = getConnection();
        expect(connection.getBeforeExecuting()).toEqual([]);
        const callback = (): void => {};
        connection.beforeExecuting(callback);
        expect(connection.getBeforeExecuting()).toEqual([callback]);
    });

    it('Works Listen', () => {
        const connection = getConnection();
        const eventDispatcher = new EventEmitter();
        const spiedEvent = jest.spyOn(eventDispatcher, 'on');
        const callback = (): void => {};
        connection.listen(callback);
        expect(spiedEvent).not.toHaveBeenCalled();
        connection.setEventDispatcher(eventDispatcher);
        connection.listen(callback);
        expect(spiedEvent).toHaveBeenCalledWith(QueryExecuted.eventName, callback);
    });

    it('Works UnListen', () => {
        const connection = getConnection();
        class MockedEventEmitter extends EventEmitter {
            public _eventsCount = 0;
        }
        const eventDispatcher = new MockedEventEmitter();
        const spiedEvent = jest.spyOn(eventDispatcher, 'off');
        const callback = (): void => {};
        connection.unlisten(callback);
        expect(spiedEvent).not.toHaveBeenCalled();
        connection.setEventDispatcher(eventDispatcher);
        connection.listen(callback);
        expect(spiedEvent).not.toHaveBeenCalled();
        expect(eventDispatcher._eventsCount).toBe(1);
        connection.unlisten(callback);
        expect(spiedEvent).toHaveBeenCalledWith(QueryExecuted.eventName, callback);
        expect(eventDispatcher._eventsCount).toBe(0);
    });

    it('Works Pdo', () => {
        const connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            host: 'readhost',
            pool: {
                killResource: false
            }
        });
        expect(connection.getPdo()).toBeInstanceOf(Pdo);
    });

    it('Works Read Pdo', () => {
        const connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            read: {
                host: 'readhost1'
            },
            host: 'readhost',
            pool: {
                killResource: false
            }
        });

        expect(connection.getReadPdo()).toBeInstanceOf(Pdo);
        expect(connection.getPdo()).toBeInstanceOf(Pdo);
        expect(connection.getPdo()).not.toEqual(connection.getReadPdo());
    });

    it('Works Schema Pdo', () => {
        const connection = new MockedConnection('fake', {
            database: 'database',
            prefix: 'prefix',
            host: 'readhost',
            pool: {
                killResource: false
            }
        });

        expect(connection.getSchemaPdo()).toBeInstanceOf(Pdo);
    });

    it('Works Get Name', () => {
        const connection = getConnection();
        expect(connection.getName()).toBe('fake');
    });

    it('Works Get Config', () => {
        const connection = getConnection('prefix_');
        expect(connection.getConfig()).toEqual({
            database: 'database',
            pool: { killResource: false },
            prefix: 'prefix_'
        });
        expect(connection.getConfig<boolean>('pool.killResource', true)).toBeFalsy();
        expect(connection.getConfig<boolean>('pool.notExists', true)).toBeTruthy();
    });

    it('Works Database Name', () => {
        const connection = getConnection();
        expect(connection.getDatabaseName()).toBe('database');
    });

    it('Works Table Prefix', () => {
        const connection = getConnection();
        expect(connection.getTablePrefix()).toBe('prefix_');
    });

    it('Works Table', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'table');
        expect(connection.table('test', 'name')).toBeInstanceOf(QueryBuilder);
        expect(spiedSession).toHaveBeenCalledWith('test', 'name');
    });

    it('Works Query', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'query');
        expect(connection.query()).toBeInstanceOf(QueryBuilder);
        expect(spiedSession).toHaveBeenCalledTimes(1);
    });

    it('Works Cache', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'cache');
        expect(connection.cache({ cache: 1000, key: 'test', options: { a: true } })).toBeInstanceOf(ConnectionSession);
        expect(spiedSession).toHaveBeenCalledTimes(1);
        expect(spiedSession).toHaveBeenCalledWith({ cache: 1000, key: 'test', options: { a: true } });
    });

    it('Works Select One', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectOne').mockImplementation();
        await connection.selectOne('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Scalar', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'scalar').mockImplementation();
        await connection.scalar('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Select', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'select').mockImplementation();
        await connection.select('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Select Column', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectColumn').mockImplementation();
        await connection.selectColumn(0, 'select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith(0, 'select * from users', [], false);
    });

    it('Works Select Resultsets', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectResultSets').mockImplementation();
        await connection.selectResultSets('CALL a_procedure(?)', [], false);
        expect(spiedSession).toHaveBeenCalledWith('CALL a_procedure(?)', [], false);
    });

    it('Works Select From Write Connection', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectFromWriteConnection').mockImplementation();
        await connection.selectFromWriteConnection('select * from users', []);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', []);
    });

    it('Works Cursor', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'cursor').mockImplementation();
        await connection.cursor('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Insert', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'insert').mockImplementation(async () => true);
        await connection.insert('insert into "users" ("email") values (?)', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Insert Get Id', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'insertGetId').mockImplementation(async () => 1);
        await connection.insertGetId('insert into "users" ("email") values (?)', ['foo'], 'id');
        expect(spiedSession).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo'], 'id');
    });

    it('Works Update', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'update').mockImplementation(async () => 1);
        await connection.update('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]);
        expect(spiedSession).toHaveBeenCalledWith('update "users" set "email" = ?, "name" = ? where "id" = ?', [
            'foo',
            'bar',
            1
        ]);
    });

    it('Works Delete', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'delete').mockImplementation(async () => 1);
        await connection.delete('delete from "users" where "email" = ?', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Statement', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'statement').mockImplementation(async () => true);
        await connection.statement('insert into "users" ("email") values (?)', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Affecting Statement', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'affectingStatement').mockImplementation(async () => 1);
        await connection.affectingStatement('delete from "users" where "email" = ?', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Unprepared', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'unprepared').mockImplementation(async () => true);
        await connection.unprepared('delete from "users" where "email" = "foo"');
        expect(spiedSession).toHaveBeenCalledWith('delete from "users" where "email" = "foo"');
    });

    it('Works Pretend', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'pretend');
        const callback = (): void => {};
        await connection.pretend(callback);
        expect(spiedSession).toHaveBeenCalledWith(callback);
    });

    it('Works Transaction', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'transaction');
        const callback = (): void => {};
        await connection.transaction(callback, 2);
        expect(spiedSession).toHaveBeenCalledWith(callback, 2);
        await connection.disconnect();
    });

    it('Works Begin Transaction', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'beginTransaction');
        const sess = await connection.beginTransaction();
        expect(sess).toEqual(session);
        expect(spiedSession).toHaveBeenCalled();
        await sess.rollBack();
        await connection.disconnect();
    });

    it('Works Use Write Connection When Reading', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'useWriteConnectionWhenReading');
        expect(connection.useWriteConnectionWhenReading(true)).toEqual(session);
        expect(spiedSession).toHaveBeenCalledWith(true);
    });

    it('Works Reference', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'reference');
        expect(connection.reference('newid')).toEqual(session);
        expect(spiedSession).toHaveBeenCalledWith('newid');
        expect(session.getReference()).toBe('newid');
    });

    it('Works Raw Return Expression', () => {
        const connection = getConnection();
        const raw = connection.raw('rawValue');
        expect(raw).toBeInstanceOf(Expression);
    });

    it('Works Bind To', () => {
        const connection = getConnection();
        const typed = connection.bindTo.bigInteger('934342342342343232');
        expect(typed).toBeInstanceOf(TypedBinding);
    });
});
