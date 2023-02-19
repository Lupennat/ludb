import { Pdo } from 'lupdo';
import { EventEmitter } from 'stream';
import { bindTo } from '../../binding';
import Connection from '../../connections/connection';
import ConnectionSession from '../../connections/connection-session';
import QueryExecuted from '../../events/query-executed';
import Builder from '../../query/builder';
import Raw from '../../query/expression';
import Grammar from '../../query/grammars/grammar';
import Processor from '../../query/processors/processor';
import { FlattedConnectionConfig } from '../../types/config';
import { getConnection, pdo } from '../fixtures/mocked';

describe('Connection', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Resolver', () => {
        const resolver = (
            pdo: Pdo,
            config: FlattedConnectionConfig,
            database: string,
            tablePrefix: string
        ): Connection => {
            return new Connection(pdo, config, database, tablePrefix);
        };
        Connection.resolverFor('driver', resolver);
        expect(Connection.getResolver('driver')).toEqual(resolver);
    });

    it('Works Session', () => {
        expect(getConnection().session()).toBeInstanceOf(ConnectionSession);
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

    it('Works Post Processor', () => {
        const connection = getConnection();
        class TestProcessor extends Processor {}
        expect(connection.getPostProcessor()).toBeInstanceOf(Processor);
        expect(connection.getPostProcessor()).not.toBeInstanceOf(TestProcessor);
        connection.setPostProcessor(new TestProcessor());
        expect(connection.getPostProcessor()).toBeInstanceOf(TestProcessor);
        connection.useDefaultPostProcessor();
        expect(connection.getPostProcessor()).toBeInstanceOf(Processor);
        expect(connection.getPostProcessor()).not.toBeInstanceOf(TestProcessor);
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
        const statement = await pdo.prepare('select * from users where name = ?');
        const spiedBindValue = jest.spyOn(statement, 'bindValue');
        const date = bindTo.date(new Date());
        connection.bindValues(statement, [null, date]);
        expect(spiedBindValue).toHaveBeenNthCalledWith(1, 1, null);
        expect(spiedBindValue).toHaveBeenNthCalledWith(2, 2, date);
        await statement.close();
    });

    it('Works Bind Expression Value Throw An Error', async () => {
        const connection = getConnection();
        const statement = await pdo.prepare('select * from users where name = ?');
        expect(() => {
            // @ts-expect-error test wrong binding
            connection.bindValues(statement, [new Raw('wrong')]);
        }).toThrowError('Expression binding can not be binded directly to statement.');

        await statement.close();
    });

    it('Works Prepare Bindings', () => {
        const connection = getConnection();
        expect(connection.prepareBindings([null, new Raw('expression')])).toEqual([null, 'expression']);
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
        const trx = await connection.beginTransaction();
        expect(trx).toEqual(session);
        expect(spiedSession).toBeCalled();
        await trx.rollBack();
    });

    it('Works Use Write Connection When Reading', () => {
        const connection = getConnection();
        const session = new ConnectionSession(connection);
        jest.spyOn(connection, 'session').mockReturnValue(session);
        const spiedSession = jest.spyOn(session, 'useWriteConnectionWhenReading');
        expect(connection.useWriteConnectionWhenReading(true)).toEqual(session);
        expect(spiedSession).toBeCalledWith(true);
    });
});
