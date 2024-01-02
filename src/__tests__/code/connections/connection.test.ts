import { Pdo, TypedBinding } from 'lupdo';
import { EventEmitter } from 'stream';
import { bindTo } from '../../../bindings';
import ConnectionSession from '../../../connections/connection-session';
import QueryExecuted from '../../../events/query-executed';
import Raw from '../../../query/expression';
import Grammar from '../../../query/grammars/grammar';
import QueryBuilder from '../../../query/query-builder';

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
    getSqlserverConnection,
    pdo
} from '../fixtures/mocked';

describe('Connection', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Disconnect Should Disconnect pdos', async () => {
        const connection = getConnection();

        let spiedPdo = jest.spyOn(connection, 'getPdo');
        let spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        let spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        await connection.disconnect();
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();

        connection.setReadPdo(pdo);

        spiedPdo = jest.spyOn(connection, 'getPdo');
        spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        await connection.disconnect();
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();
    });

    it('Works Reconnect Should Reconnect pdos', async () => {
        const connection = getConnection();

        let spiedPdo = jest.spyOn(connection, 'getPdo');
        let spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        let spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        expect(await connection.reconnect()).toEqual(connection);
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();

        connection.setReadPdo(pdo);

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
        let connection = getConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SchemaBuilder);
        connection = getMysqlConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(MysqlBuilder);
        connection = getPostgresConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(PostgresBuilder);
        connection = getSqliteConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SqliteBuilder);
        connection = getSqlserverConnection();
        expect(connection.getSchemaBuilder()).toBeInstanceOf(SqlserverBuilder);
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
        }).toThrow('Expression binding can not be binded directly to statement.');

        await statement.close();

        statement = await pdo.prepare('select * from users where name = ?');
        expect(() => {
            // @ts-expect-error test wrong binding
            connection.bindValues(statement, { wrong: new Raw('wrong') });
        }).toThrow('Expression binding can not be binded directly to statement.');

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
        expect(connection.getName()).toBe('fake');
    });

    it('Works Get Config', () => {
        const connection = getConnection('prefix_');
        expect(connection.getConfig()).toEqual({
            database: 'database',
            driver: 'fake',
            pool: { killResource: false },
            prefix: 'prefix_'
        });
        expect(connection.getConfig<boolean>('pool.killResource', true)).toBeFalsy();
        expect(connection.getConfig<boolean>('pool.notExists', true)).toBeTruthy();
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
        expect(connection.getTablePrefix()).toBe('prefix_');
        connection.setTablePrefix('test-prefix');
        expect(connection.getTablePrefix()).toBe('test-prefix');
        expect(spiedTablePrefix).not.toHaveBeenCalled();
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

    it('Works Select One', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectOne');
        await connection.selectOne('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Scalar', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'scalar');
        await connection.scalar('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Select', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'select');
        await connection.select('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Select Column', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectColumn');
        await connection.selectColumn(0, 'select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith(0, 'select * from users', [], false);
    });

    it('Works Select Resultsets', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectResultSets');
        await connection.selectResultSets('CALL a_procedure(?)', [], false);
        expect(spiedSession).toHaveBeenCalledWith('CALL a_procedure(?)', [], false);
    });

    it('Works Select From Write Connection', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'selectFromWriteConnection');
        await connection.selectFromWriteConnection('select * from users', []);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', []);
    });

    it('Works Cursor', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'cursor');
        await connection.cursor('select * from users', [], false);
        expect(spiedSession).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Insert', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'insert');
        await connection.insert('insert into "users" ("email") values (?)', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Insert Get Id', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'insertGetId');
        await connection.insertGetId('insert into "users" ("email") values (?)', ['foo'], 'id');
        expect(spiedSession).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo'], 'id');
    });

    it('Works Update', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'update');
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
        const spiedSession = jest.spyOn(session, 'delete');
        await connection.delete('delete from "users" where "email" = ?', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Statement', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'statement');
        await connection.statement('insert into "users" ("email") values (?)', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Affecting Statement', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'affectingStatement');
        await connection.affectingStatement('delete from "users" where "email" = ?', ['foo']);
        expect(spiedSession).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Unprepared', async () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'unprepared');
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
    });

    it('Works Use Write Connection When Reading', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'useWriteConnectionWhenReading');
        expect(connection.useWriteConnectionWhenReading(true)).toEqual(session);
        expect(spiedSession).toHaveBeenCalledWith(true);
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
