import { Pdo, TypedBinding } from 'lupdo';
import { EventEmitter } from 'stream';
import { bindTo } from '../../../bindings';
import Connection from '../../../connections/connection';
import ConnectionSession from '../../../connections/connection-session';
import MySqlConnection from '../../../connections/mysql-connection';
import PostgresConnection from '../../../connections/postgres-connection';
import SQLiteConnection from '../../../connections/sqlite-connection';
import SqlServerConnection from '../../../connections/sqlserver-connection';
import QueryExecuted from '../../../events/query-executed';
import Builder from '../../../query/builder';
import Raw from '../../../query/expression';
import Grammar from '../../../query/grammars/grammar';

import Expression from '../../../query/expression';
import SchemaBuilder from '../../../schema/builders/builder';
import SchemaGrammar from '../../../schema/grammars/grammar';
import { FlattedConnectionConfig } from '../../../types/config';
import { getConnection, pdo, schemaPdo } from '../fixtures/mocked';

describe('Connection', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Resolver', () => {
        const resolver = (
            pdo: Pdo,
            schemaPdo: Pdo,
            config: FlattedConnectionConfig,
            database: string,
            tablePrefix: string
        ): Connection => {
            return new Connection(pdo, schemaPdo, config, database, tablePrefix);
        };
        Connection.resolverFor('driver', resolver);
        expect(Connection.getResolver('driver')).toEqual(resolver);
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
        connection.setQueryGrammar(new TestGrammar());
        expect(connection.getQueryGrammar()).toBeInstanceOf(TestGrammar);
        connection.useDefaultQueryGrammar();
        expect(connection.getQueryGrammar()).toBeInstanceOf(Grammar);
        expect(connection.getQueryGrammar()).not.toBeInstanceOf(TestGrammar);
    });

    it('Works Schema Grammar', () => {
        const connection = getConnection();
        class TestGrammar extends SchemaGrammar {}
        expect(connection.getSchemaGrammar()).toBeInstanceOf(SchemaGrammar);
        expect(connection.getSchemaGrammar()).not.toBeInstanceOf(TestGrammar);
        connection.setSchemaGrammar(new TestGrammar());
        expect(connection.getSchemaGrammar()).toBeInstanceOf(TestGrammar);
        connection.useDefaultSchemaGrammar();
        expect(connection.getSchemaGrammar()).toBeInstanceOf(SchemaGrammar);
        expect(connection.getSchemaGrammar()).not.toBeInstanceOf(TestGrammar);
    });

    it('Works Schema Builder', () => {
        const connection = getConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
    });

    it('Works Schema Builder', () => {
        let connection = getConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
        connection = new MySqlConnection(
            pdo,
            schemaPdo,
            { driver: 'fake', name: 'fake', database: 'database', prefix: 'prefix' },
            '',
            ''
        );
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
        connection = new PostgresConnection(
            pdo,
            schemaPdo,
            { driver: 'fake', name: 'fake', database: 'database', prefix: 'prefix' },
            '',
            ''
        );
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
        connection = new SQLiteConnection(
            pdo,
            schemaPdo,
            { driver: 'fake', name: 'fake', database: 'database', prefix: 'prefix' },
            '',
            ''
        );
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
        connection = new SqlServerConnection(
            pdo,
            schemaPdo,
            { driver: 'fake', name: 'fake', database: 'database', prefix: 'prefix' },
            '',
            ''
        );
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
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

    it('Works Bind Values', async () => {
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
    });

    it('Works Bind Expression Value Throw An Error', async () => {
        const connection = getConnection();
        let statement = await pdo.prepare('select * from users where name = ?');
        expect(() => {
            // @ts-expect-error test wrong binding
            connection.bindValues(statement, [new Raw('wrong')]);
        }).toThrowError('Expression binding can not be binded directly to statement.');

        await statement.close();

        statement = await pdo.prepare('select * from users where name = ?');
        expect(() => {
            // @ts-expect-error test wrong binding
            connection.bindValues(statement, { wrong: new Raw('wrong') });
        }).toThrowError('Expression binding can not be binded directly to statement.');

        await statement.close();
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
        expect(spiedEvent).not.toBeCalled();
        connection.setEventDispatcher(eventDispatcher);
        connection.listen(callback);
        expect(spiedEvent).toBeCalledWith(QueryExecuted.eventName, callback);
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
        expect(spiedEvent).not.toBeCalled();
        connection.setEventDispatcher(eventDispatcher);
        connection.listen(callback);
        expect(spiedEvent).not.toBeCalled();
        expect(eventDispatcher._eventsCount).toBe(1);
        connection.unlisten(callback);
        expect(spiedEvent).toBeCalledWith(QueryExecuted.eventName, callback);
        expect(eventDispatcher._eventsCount).toBe(0);
    });

    it('Works Pdo', () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        connection.setPdo(pdo);
        expect(connection.getPdo()).toEqual(pdo);
    });

    it('Works Read Pdo', () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        connection.setPdo(pdo);
        expect(connection.getReadPdo()).toEqual(pdo);
        const readPdo = new Pdo('fake', {}, {}, {});
        connection.setReadPdo(readPdo);
        expect(connection.getReadPdo()).toEqual(readPdo);
        expect(connection.getReadPdo()).not.toEqual(pdo);
        expect(connection.getPdo()).toEqual(pdo);
        expect(connection.getPdo()).not.toEqual(readPdo);
    });

    it('Works Schema Pdo', () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        connection.setSchemaPdo(pdo);
        expect(connection.getSchemaPdo()).toEqual(pdo);
    });

    it('Works Get Name', () => {
        const connection = getConnection();
        jest.spyOn(connection, 'getConfig').mockImplementationOnce(option => {
            expect(option).toBe('name');
            return 'test-name';
        });
        expect(connection.getName()).toBe('test-name');
    });

    it('Works Get Name With Read Write Type', () => {
        const connection = getConnection();
        const spiedName = jest.spyOn(connection, 'getConfig').mockImplementation(option => {
            expect(option).toBe('name');
            return 'test-name';
        });
        expect(connection.getNameWithReadWriteType()).toBe('test-name');
        expect(spiedName).toBeCalled();
        connection.setReadWriteType('write');
        expect(connection.getNameWithReadWriteType()).toBe('test-name::write');
        expect(spiedName).toBeCalledTimes(2);
        connection.setReadWriteType('read');
        expect(connection.getNameWithReadWriteType()).toBe('test-name::read');
        expect(spiedName).toBeCalledTimes(3);
        connection.setReadWriteType(null);
        expect(connection.getNameWithReadWriteType()).toBe('test-name');
        expect(spiedName).toBeCalledTimes(4);
    });

    it('Works Get Config', () => {
        const connection = getConnection();
        expect(connection.getConfig()).toEqual({
            database: 'database',
            driver: 'fake',
            name: 'fake',
            pool: { killResource: false },
            prefix: 'prefix'
        });
        expect(connection.getConfig<boolean>('pool.killResource', true)).toBeFalsy();
        expect(connection.getConfig<boolean>('pool.notExists', true)).toBeTruthy();
    });

    it('Works Get Driver Name', () => {
        const connection = getConnection();
        jest.spyOn(connection, 'getConfig').mockImplementationOnce(option => {
            expect(option).toBe('driver');
            return 'test-driver';
        });
        expect(connection.getDriverName()).toBe('test-driver');
    });

    it('Works Database Name', () => {
        const connection = getConnection();
        expect(connection.getDatabaseName()).toBe('database');
        connection.setDatabaseName('test-db');
        expect(connection.getDatabaseName()).toBe('test-db');
    });

    it('Works Table Prefix', () => {
        class TestGrammar extends Grammar {}
        const grammar = new TestGrammar();
        const spiedTablePrefix = jest.spyOn(grammar, 'setTablePrefix');
        const connection = getConnection();
        expect(connection.getTablePrefix()).toBe('prefix');
        connection.setTablePrefix('test-prefix');
        expect(connection.getTablePrefix()).toBe('test-prefix');
        expect(spiedTablePrefix).not.toBeCalled();
        expect(connection.withTablePrefix(grammar)).toEqual(grammar);
        expect(spiedTablePrefix).toBeCalledWith('test-prefix');
    });

    it('Works Table', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'table');
        expect(connection.table('test', 'name')).toBeInstanceOf(Builder);
        expect(spiedSession).toBeCalledWith('test', 'name');
    });

    it('Works Query', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'query');
        expect(connection.query()).toBeInstanceOf(Builder);
        expect(spiedSession).toBeCalledTimes(1);
    });

    it('Works Select One', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectOne');
        await connection.selectOne('select * from users', [], false);
        expect(spiedSession).toBeCalledWith('select * from users', [], false);
    });

    it('Works Scalar', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'scalar');
        await connection.scalar('select * from users', [], false);
        expect(spiedSession).toBeCalledWith('select * from users', [], false);
    });

    it('Works Select', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'select');
        await connection.select('select * from users', [], false);
        expect(spiedSession).toBeCalledWith('select * from users', [], false);
    });

    it('Works Select Column', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectColumn');
        await connection.selectColumn(0, 'select * from users', [], false);
        expect(spiedSession).toBeCalledWith(0, 'select * from users', [], false);
    });

    it('Works Select From Write Connection', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectFromWriteConnection');
        await connection.selectFromWriteConnection('select * from users', []);
        expect(spiedSession).toBeCalledWith('select * from users', []);
    });

    it('Works Cursor', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'cursor');
        await connection.cursor('select * from users', [], false);
        expect(spiedSession).toBeCalledWith('select * from users', [], false);
    });

    it('Works Insert', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'insert');
        await connection.insert('insert into "users" ("email") values (?)', ['foo']);
        expect(spiedSession).toBeCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Insert Get Id', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'insertGetId');
        await connection.insertGetId('insert into "users" ("email") values (?)', ['foo'], 'id');
        expect(spiedSession).toBeCalledWith('insert into "users" ("email") values (?)', ['foo'], 'id');
    });

    it('Works Update', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'update');
        await connection.update('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1]);
        expect(spiedSession).toBeCalledWith('update "users" set "email" = ?, "name" = ? where "id" = ?', [
            'foo',
            'bar',
            1
        ]);
    });

    it('Works Delete', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'delete');
        await connection.delete('delete from "users" where "email" = ?', ['foo']);
        expect(spiedSession).toBeCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Statement', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'statement');
        await connection.statement('insert into "users" ("email") values (?)', ['foo']);
        expect(spiedSession).toBeCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Affecting Statement', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'affectingStatement');
        await connection.affectingStatement('delete from "users" where "email" = ?', ['foo']);
        expect(spiedSession).toBeCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Unprepared', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'unprepared');
        await connection.unprepared('delete from "users" where "email" = "foo"');
        expect(spiedSession).toBeCalledWith('delete from "users" where "email" = "foo"');
    });

    it('Works Pretend', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'pretend');
        const callback = (): void => {};
        await connection.pretend(callback);
        expect(spiedSession).toBeCalledWith(callback);
    });

    it('Works Transaction', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'transaction');
        const callback = (): void => {};
        await connection.transaction(callback, 2);
        expect(spiedSession).toBeCalledWith(callback, 2);
    });

    it('Works Begin Transaction', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'beginTransaction');
        const sess = await connection.beginTransaction();
        expect(sess).toEqual(session);
        expect(spiedSession).toBeCalled();
        await sess.rollBack();
    });

    it('Works Use Write Connection When Reading', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'useWriteConnectionWhenReading');
        expect(connection.useWriteConnectionWhenReading(true)).toEqual(session);
        expect(spiedSession).toBeCalledWith(true);
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
