import { Pdo, TypedBinding } from 'lupdo';
import { EventEmitter } from 'stream';
import { Connection } from '../../../connections';
import DeadlockError from '../../../errors/deadlock-error';
import QueryExecuted from '../../../events/query-executed';
import TransactionBeginning from '../../../events/transaction-beginning';
import TransactionCommitted from '../../../events/transaction-committed';
import TransactionCommitting from '../../../events/transaction-committing';
import TransactionRolledBack from '../../../events/transaction-rolledback';
import Builder from '../../../query/builder';
import Grammar from '../../../query/grammars/grammar';

import Expression from '../../../query/expression';
import {
    MockedConnectionSession,
    MockedConnectionSessionWithResults,
    MockedConnectionSessionWithResultsSets,
    pdo as fakePdo,
    getBuilder,
    getConnection
} from '../fixtures/mocked';

describe('Connection Session', () => {
    afterAll(async () => {
        await fakePdo.disconnect();
    });

    const sleep = function (timeout = 0): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
    };

    it('Works Get Driver Connection', () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        expect(session.getDriverConnection()).toBeInstanceOf(Connection);
        expect(session.getDriverConnection()).toEqual(connection);
    });

    it('Works Get Query Grammar', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getQueryGrammar');
        const session = new MockedConnectionSession(connection);
        expect(session.getQueryGrammar()).toBeInstanceOf(Grammar);
        expect(spiedConnection).toHaveBeenCalled();
    });

    it('Works Event Dispatcher', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getEventDispatcher');
        const session = new MockedConnectionSession(connection);
        expect(session.getEventDispatcher()).toBeUndefined();
        expect(spiedConnection).toHaveBeenCalled();
    });

    it('Works Get Pdo', async () => {
        const connection = getConnection();
        const spiedPdo = jest.spyOn(connection, 'getPdo');
        const session = new MockedConnectionSession(connection);
        expect(session.getPdo()).toBeInstanceOf(Pdo);
        expect(spiedPdo).toHaveBeenCalled();
        const pdo = new Pdo('fake', {}, {}, {});
        const trx = await pdo.beginTransaction();
        session.setPdoTransaction(trx);
        session.incrementTransaction();
        expect(session.getPdo()).toBe(trx);
        expect(spiedPdo).toHaveBeenCalledTimes(1);
        await trx.rollback();
        await pdo.disconnect();
    });

    it('Works Read Pdo', async () => {
        const connection = getConnection();
        connection.setReadPdo(new Pdo('fake', {}, {}, {}));
        const spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        const spiedPdo = jest.spyOn(connection, 'getPdo');
        const session = new MockedConnectionSession(connection);
        const spiedSessionPdo = jest.spyOn(session, 'getPdo');
        const spiedEnTrans = jest.spyOn(session, 'getEnsuredPdoTransaction');
        expect(session.getReadPdo()).toBeInstanceOf(Pdo);
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).not.toHaveBeenCalled();
        expect(spiedSessionPdo).not.toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalled();
        const pdo = new Pdo('fake', {}, {}, {});
        const trx = await pdo.beginTransaction();
        session.setPdoTransaction(trx);
        session.incrementTransaction();
        session.getReadPdo();
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).toHaveBeenCalled();
        expect(spiedSessionPdo).toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalledTimes(1);
        session.decrementTransaction();
        session.getReadPdo();
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).toHaveBeenCalledTimes(1);
        expect(spiedSessionPdo).toHaveBeenCalledTimes(1);
        expect(spiedReadPdo).toHaveBeenCalledTimes(2);
        session.useWriteConnectionWhenReading().getReadPdo();
        expect(spiedPdo).toHaveBeenCalledTimes(1);
        expect(spiedEnTrans).toHaveBeenCalledTimes(1);
        expect(spiedSessionPdo).toHaveBeenCalledTimes(2);
        expect(spiedReadPdo).toHaveBeenCalledTimes(2);
        await trx.rollback();
        await pdo.disconnect();
    });

    it('Works Read Pdo When Schema Session Always Return Schema Pdo', async () => {
        const connection = getConnection();
        connection.setSchemaPdo(new Pdo('fake', {}, {}, {}));
        const spiedSchemaPdo = jest.spyOn(connection, 'getSchemaPdo');
        const spiedReadPdo = jest.spyOn(connection, 'getReadPdo');
        const spiedPdo = jest.spyOn(connection, 'getPdo');
        const session = new MockedConnectionSession(connection, true);
        const spiedSessionPdo = jest.spyOn(session, 'getPdo');
        const spiedEnTrans = jest.spyOn(session, 'getEnsuredPdoTransaction');
        expect(session.getReadPdo()).toBeInstanceOf(Pdo);
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).not.toHaveBeenCalled();
        expect(spiedSessionPdo).not.toHaveBeenCalled();
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalled();
        const pdo = new Pdo('fake', {}, {}, {});
        const trx = await pdo.beginTransaction();
        session.setPdoTransaction(trx);
        session.incrementTransaction();
        session.getReadPdo();
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).toHaveBeenCalled();
        expect(spiedSessionPdo).toHaveBeenCalled();
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalledTimes(1);
        session.decrementTransaction();
        session.getReadPdo();
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).toHaveBeenCalledTimes(1);
        expect(spiedSessionPdo).toHaveBeenCalledTimes(1);
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalledTimes(2);
        session.useWriteConnectionWhenReading().getReadPdo();
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedEnTrans).toHaveBeenCalledTimes(1);
        expect(spiedSessionPdo).toHaveBeenCalledTimes(2);
        expect(spiedReadPdo).not.toHaveBeenCalled();
        expect(spiedSchemaPdo).toHaveBeenCalledTimes(3);
        await trx.rollback();
        await pdo.disconnect();
    });

    it('Works Get Pdo For Select', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedReadPdo = jest.spyOn(session, 'getReadPdo');
        const spiedPdo = jest.spyOn(session, 'getPdo');
        session.getPdoForSelect(true);
        expect(spiedPdo).not.toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalled();
        session.getPdoForSelect(false);
        expect(spiedPdo).toHaveBeenCalled();
        expect(spiedReadPdo).toHaveBeenCalledTimes(1);
    });

    it('Works Get Ensured Pdo Always Return Pdo Or Schema Pdo From Connection', async () => {
        const connection = getConnection();
        let session = new MockedConnectionSession(connection);
        let spiedConnection = jest.spyOn(connection, 'getPdo');
        expect(session.getEnsuredPdo()).toBeInstanceOf(Pdo);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
        session = new MockedConnectionSession(connection, true);
        spiedConnection = jest.spyOn(session, 'getSchemaPdo');
        expect(session.getEnsuredPdo()).toBeInstanceOf(Pdo);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Get Schema Pdo Always Schema Pdo From Connection', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedConnection = jest.spyOn(connection, 'getSchemaPdo');
        expect(session.getSchemaPdo()).toBeInstanceOf(Pdo);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Get Ensured Pdo Transaction Return Pdo Transaction', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const trx = await pdo.beginTransaction();
        session.setPdoTransaction(trx);
        expect(session.getEnsuredPdoTransaction()).toBe(trx);
        await trx.rollback();
        await pdo.disconnect();
    });

    it('Works Get Ensured Pdo Transaction Throw Error If Not In Transaction', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        expect(() => {
            session.getEnsuredPdoTransaction();
        }).toThrow('You should be inside a Transaction.');
    });

    it('Works Get Name', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getName');
        const session = new MockedConnectionSession(connection);
        session.getName();
        expect(spiedConnection).toHaveBeenCalled();
    });

    it('Works Get Config', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getConfig');
        const session = new MockedConnectionSession(connection);
        session.getConfig('name', 'default');
        expect(spiedConnection).toHaveBeenCalledWith('name', 'default');
    });

    it('Works Get Before Executing', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getBeforeExecuting');
        const session = new MockedConnectionSession(connection);
        session.getBeforeExecuting();
        expect(spiedConnection).toHaveBeenCalled();
    });

    it('Works Get Database Name', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getDatabaseName');
        const session = new MockedConnectionSession(connection);
        session.getDatabaseName();
        expect(spiedConnection).toHaveBeenCalled();
    });

    it('Works Get Table Prefix', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'getTablePrefix');
        const session = new MockedConnectionSession(connection);
        session.getTablePrefix();
        expect(spiedConnection).toHaveBeenCalled();
    });

    it('Works Bind Values', async () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'bindValues');
        const session = new MockedConnectionSession(connection);
        const statement = await fakePdo.prepare('select * from users where name = ?');
        session.bindValues(statement, []);
        expect(spiedConnection).toHaveBeenCalledWith(statement, []);
        await statement.close();
    });

    it('Works Prepare Bindings', () => {
        const connection = getConnection();
        const spiedConnection = jest.spyOn(connection, 'prepareBindings');
        const session = new MockedConnectionSession(connection);
        session.prepareBindings([null, 'Claudio']);
        expect(spiedConnection).toHaveBeenCalledWith([null, 'Claudio']);
    });

    it('Works Table', () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const builder = getBuilder();
        const spiedBuilder = jest.spyOn(builder, 'from');
        const spiedQuery = jest.spyOn(session, 'query').mockReturnValueOnce(builder);
        expect(session.table('test', 'name')).toBe(builder);
        expect(spiedQuery).toHaveBeenCalled();
        expect(spiedBuilder).toHaveBeenCalledWith('test', 'name');
    });

    it('Works Query', () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        expect(session.query()).toBeInstanceOf(Builder);
    });

    it('Works Select Use Read Pdo', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPdo = jest.spyOn(session, 'getPdoForSelect');
        await session.select('select * from users');
        expect(spiedPdo).toHaveBeenCalledWith(undefined);
        await session.select('select * from users', [], true);
        expect(spiedPdo).toHaveBeenLastCalledWith(true);
        await session.select('select * from users', [], false);
        expect(spiedPdo).toHaveBeenLastCalledWith(false);
    });

    it('Works Select Column Use Read Pdo', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPdo = jest.spyOn(session, 'getPdoForSelect');
        await session.selectColumn(0, 'select * from users');
        expect(spiedPdo).toHaveBeenCalledWith(undefined);
        await session.selectColumn(0, 'select * from users', [], true);
        expect(spiedPdo).toHaveBeenLastCalledWith(true);
        await session.selectColumn(0, 'select * from users', [], false);
        expect(spiedPdo).toHaveBeenLastCalledWith(false);
    });

    it('Works Select Query Will Be Prepared', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedPrepare = jest.spyOn(pdo, 'prepare');
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdoForSelect').mockReturnValueOnce(pdo);
        const spiedBindings = jest.spyOn(session, 'prepareBindings');
        const spiedValues = jest.spyOn(session, 'bindValues');
        expect(await session.select('select * from users', [null, 'claudio'])).toEqual([]);
        expect(spiedPrepare).toHaveBeenCalledWith('select * from users');
        expect(spiedBindings).toHaveBeenCalledWith([null, 'claudio']);
        expect(spiedValues).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it('Works Select Column Query Will Be Prepared', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedPrepare = jest.spyOn(pdo, 'prepare');
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdoForSelect').mockReturnValueOnce(pdo);
        const spiedBindings = jest.spyOn(session, 'prepareBindings');
        const spiedValues = jest.spyOn(session, 'bindValues');
        expect(await session.selectColumn(0, 'select * from users', [null, 'claudio'])).toEqual([]);
        expect(spiedPrepare).toHaveBeenCalledWith('select * from users');
        expect(spiedBindings).toHaveBeenCalledWith([null, 'claudio']);
        expect(spiedValues).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it('Works Select With Pretend Return Empty', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.select('select * from users', [])).toEqual([]);
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Select Column With Pretend Return Empty', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.selectColumn(0, 'select * from users', [])).toEqual([]);
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Select Return Array Of Results', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResults(connection, [[1], [2], [3]], ['test']);
        expect(await session.select('select * from users', [])).toEqual([{ test: 1 }, { test: 2 }, { test: 3 }]);
    });

    it('Works Select Return Array Of Columns', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResults(connection, [[1], [2], [3]], ['test']);
        expect(await session.selectColumn<number>(0, 'select * from users', [])).toEqual([1, 2, 3]);
    });

    it('Works Select One', async () => {
        const connection = getConnection();
        let session = new MockedConnectionSessionWithResults(connection, [[1], [2], [3]], ['test']);
        const spiedSelect = jest.spyOn(session, 'select');
        expect(await session.selectOne('select * from users', [], true)).toEqual({ test: 1 });
        expect(spiedSelect).toHaveBeenCalledWith('select * from users', [], true);
        session = new MockedConnectionSessionWithResults(connection, [], []);
        expect(await session.selectOne('select * from users', [])).toBeNull();
    });

    it('Works Select Resultsets Return Multiple Rowset', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResultsSets(
            connection,
            [
                [['user1'], ['user2'], ['user3']],
                [['comp1'], ['comp2'], ['comp3']]
            ],
            [['test_user'], ['test_comp']]
        );
        expect(await session.selectResultSets('CALL a_procedure(?)', ['foo'])).toEqual([
            [{ test_user: 'user1' }, { test_user: 'user2' }, { test_user: 'user3' }],
            [{ test_comp: 'comp1' }, { test_comp: 'comp2' }, { test_comp: 'comp3' }]
        ]);
    });

    it('Works Select Resultsets With Pretend Return Empty', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.selectResultSets('CALL a_procedure(?)')).toEqual([]);
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Scalar', async () => {
        const connection = getConnection();
        let session = new MockedConnectionSessionWithResults(connection, [[10], [2], [3]], ['test']);
        const spiedSelect = jest.spyOn(session, 'selectOne');
        expect(await session.scalar('select * from users', [], true)).toEqual(10);
        expect(spiedSelect).toHaveBeenCalledWith('select * from users', [], true);
        session = new MockedConnectionSessionWithResults(connection, [], []);
        expect(await session.scalar('select * from users', [])).toBeNull();
        session = new MockedConnectionSessionWithResults(connection, [[10, 20]], ['test', 'test2']);
        await expect(session.scalar('select * from users', [])).rejects.toThrow('Multiple columns found.');
    });

    it('Works Select From Write Connection', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResults(connection, [[1], [2], [3]], ['test']);
        const spiedSelect = jest.spyOn(session, 'select');
        expect(await session.selectFromWriteConnection('select * from users', [])).toEqual([
            { test: 1 },
            { test: 2 },
            { test: 3 }
        ]);
        expect(spiedSelect).toHaveBeenCalledWith('select * from users', [], false);
    });

    it('Works Cursor Use Read Pdo', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPdo = jest.spyOn(session, 'getPdoForSelect');
        const spiedReadPdo = jest.spyOn(session, 'getReadPdo');
        await session.cursor('select * from users');
        expect(spiedPdo).toHaveBeenCalledWith(undefined);
        expect(spiedReadPdo).toHaveBeenCalledTimes(1);
        await session.cursor('select * from users', [], true);
        expect(spiedPdo).toHaveBeenLastCalledWith(true);
        expect(spiedReadPdo).toHaveBeenCalledTimes(2);
        await session.cursor('select * from users', [], false);
        expect(spiedPdo).toHaveBeenLastCalledWith(false);
        expect(spiedReadPdo).toHaveBeenCalledTimes(2);
        session.getPdoForSelect();
        expect(spiedReadPdo).toHaveBeenCalledTimes(3);
    });

    it('Works Cursor Query Will Be Prepared', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedPrepare = jest.spyOn(pdo, 'prepare');
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdoForSelect').mockReturnValueOnce(pdo);
        const spiedBindings = jest.spyOn(session, 'prepareBindings');
        const spiedValues = jest.spyOn(session, 'bindValues');
        expect(Array.from(await session.cursor('select * from users', [null, 'claudio']))).toEqual([]);
        expect(spiedPrepare).toHaveBeenCalledWith('select * from users');
        expect(spiedBindings).toHaveBeenCalledWith([null, 'claudio']);
        expect(spiedValues).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it('Works Cursor With Pretend Return Empty', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(Array.from(await session.cursor('select * from users', []))).toEqual([]);
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Cursor Return Generator', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResults(connection, [[1], [2], [3]], ['test']);
        const response = await session.cursor('select * from users', []);
        expect(response.next()).toEqual({ value: { test: 1 }, done: false });
        expect(Array.from(response)).toEqual([{ test: 2 }, { test: 3 }]);
    });

    it('Works Statment Query Will Be Prepared', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedPrepare = jest.spyOn(pdo, 'prepare');
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdo').mockReturnValueOnce(pdo);
        const spiedBindings = jest.spyOn(session, 'prepareBindings');
        const spiedValues = jest.spyOn(session, 'bindValues');
        expect(await session.statement('insert into "users" ("email") values (?)', ['foo'])).toBeTruthy();
        expect(spiedPrepare).toHaveBeenCalledWith('insert into "users" ("email") values (?)');
        expect(spiedBindings).toHaveBeenCalledWith(['foo']);
        expect(spiedValues).toHaveBeenCalled();
        expect(await session.statement('insert into "users" ("email") values ("foo")')).toBeTruthy();
        await pdo.disconnect();
    });

    it('Works Statement With Pretend Return True', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.statement('insert into "users" ("email") values (?)', ['foo'])).toBeTruthy();
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Statement Return True', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        expect(await session.statement('insert into "users" ("email") values (?)', ['foo'])).toBeTruthy();
    });

    it('Works Insert Call Statement', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedStatement = jest.spyOn(session, 'statement');
        expect(await session.insert('insert into "users" ("email") values (?)', ['foo'])).toBeTruthy();
        expect(spiedStatement).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Insert Get Id Will Be Prepared', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const originalPrepare = pdo.prepare;
        const spiedPrepare = jest.spyOn(pdo, 'prepare').mockImplementation(async sql => {
            const statement = await originalPrepare.call(pdo, sql);
            jest.spyOn(statement, 'lastInsertId').mockImplementation(async () => {
                return 'idValue';
            });
            return statement;
        });
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdo').mockReturnValue(pdo);
        const spiedBindings = jest.spyOn(session, 'prepareBindings');
        const spiedValues = jest.spyOn(session, 'bindValues');
        expect(await session.insertGetId('insert into "users" ("email") values (?)', ['foo'])).toBe('idValue');
        expect(spiedPrepare).toHaveBeenCalledWith('insert into "users" ("email") values (?)');
        expect(spiedBindings).toHaveBeenCalledWith(['foo']);
        expect(spiedValues).toHaveBeenCalled();
        expect(await session.insertGetId('insert into "users" ("email") values ("foo")')).toBe('idValue');
        await pdo.disconnect();
    });

    it('Works Insert Get Id With Pretend Return Null', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const originalPrepare = pdo.prepare;
        jest.spyOn(pdo, 'prepare').mockImplementationOnce(async sql => {
            const statement = await originalPrepare.call(pdo, sql);
            jest.spyOn(statement, 'lastInsertId').mockImplementationOnce(async () => {
                return 'idValue';
            });
            return statement;
        });
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdo').mockReturnValueOnce(pdo);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.insertGetId('insert into "users" ("email") values (?)', ['foo'])).toBeNull();
        expect(spiedPretending).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it('Works Insert Get Id Return Id', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const originalPrepare = pdo.prepare;
        jest.spyOn(pdo, 'prepare').mockImplementationOnce(async sql => {
            const statement = await originalPrepare.call(pdo, sql);
            jest.spyOn(statement, 'lastInsertId').mockImplementationOnce(async () => {
                return 'idValue';
            });
            return statement;
        });
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdo').mockReturnValueOnce(pdo);
        expect(await session.insertGetId('insert into "users" ("email") values (?)', ['foo'])).toBe('idValue');
        await pdo.disconnect();
    });

    it('Works Affecting Statement Query Will Be Prepared', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const originalPrepare = pdo.prepare;
        const spiedPrepare = jest.spyOn(pdo, 'prepare').mockImplementation(async sql => {
            const statement = await originalPrepare.call(pdo, sql);
            jest.spyOn(statement, 'rowCount').mockImplementation(() => {
                return 10;
            });
            return statement;
        });
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdo').mockReturnValue(pdo);
        const spiedBindings = jest.spyOn(session, 'prepareBindings');
        const spiedValues = jest.spyOn(session, 'bindValues');
        expect(await session.affectingStatement('delete from "users" where "email" = ?', ['foo'])).toBe(10);
        expect(spiedPrepare).toHaveBeenCalledWith('delete from "users" where "email" = ?');
        expect(spiedBindings).toHaveBeenCalledWith(['foo']);
        expect(spiedValues).toHaveBeenCalled();
        expect(await session.affectingStatement('delete from "users" where "email" = "foo"')).toBe(10);
        await pdo.disconnect();
    });

    it('Works Affecting Statement With Pretend Return Zero', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.affectingStatement('delete from "users" where "email" = ?', ['foo'])).toBe(0);
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Affecting Statement Return Row Count', async () => {
        const connection = getConnection();
        const pdo = new Pdo('fake', {}, {}, {});
        const originalPrepare = pdo.prepare;
        jest.spyOn(pdo, 'prepare').mockImplementationOnce(async sql => {
            const statement = await originalPrepare.call(pdo, sql);
            jest.spyOn(statement, 'rowCount').mockImplementationOnce(() => {
                return 10;
            });
            return statement;
        });
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdo').mockReturnValueOnce(pdo);
        expect(await session.affectingStatement('delete from "users" where "email" = ?', ['foo'])).toBe(10);
        await pdo.disconnect();
    });

    it('Works Update Call Affecting Statement', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedStatement = jest.spyOn(session, 'affectingStatement');
        expect(
            await session.update('update "users" set "email" = ?, "name" = ? where "id" = ?', ['foo', 'bar', 1])
        ).toBe(0);
        expect(spiedStatement).toHaveBeenCalledWith('update "users" set "email" = ?, "name" = ? where "id" = ?', [
            'foo',
            'bar',
            1
        ]);
    });

    it('Works Delete Call Affecting Statement', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedStatement = jest.spyOn(session, 'affectingStatement');
        expect(await session.delete('delete from "users" where "email" = ?', ['foo'])).toBe(0);
        expect(spiedStatement).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);
    });

    it('Works Unprepare Call Pdo Exec', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedExec = jest.spyOn(pdo, 'exec');
        jest.spyOn(session, 'getPdo').mockReturnValueOnce(pdo);
        expect(await session.unprepared('delete from "users" where "email" = "foo"')).toBeTruthy();
        expect(spiedExec).toHaveBeenCalledWith('delete from "users" where "email" = "foo"');
        await pdo.disconnect();
    });

    it('Works Unprepare With Pretend Return True', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretending = jest.spyOn(session, 'pretending').mockReturnValueOnce(true);
        expect(await session.unprepared('delete from "users" where "email" = "foo"')).toBeTruthy();
        expect(spiedPretending).toHaveBeenCalled();
    });

    it('Works Unprepare Return True', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        expect(await session.unprepared('delete from "users" where "email" = "foo"')).toBeTruthy();
    });

    it('Works Run Will Be Called Before Executing Pdo', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedRun = jest.spyOn(session, 'run');
        await session.unprepared('delete from "users" where "email" = "foo"');
        await session.statement('insert into "users" ("email") values (?)', ['foo']);
        await session.affectingStatement('delete from "users" where "email" = ?', ['foo']);
        await session.insertGetId('insert into "users" ("email") values (?)', ['foo']);
        await session.select('select * from users', [null, 'claudio']);
        await session.selectColumn(0, 'select * from users', [null, 'claudio']);
        await session.cursor('select * from users', ['claudio']);
        expect(spiedRun).toHaveBeenNthCalledWith(
            1,
            'delete from "users" where "email" = "foo"',
            [],
            expect.any(Function)
        );
        expect(spiedRun).toHaveBeenNthCalledWith(
            2,
            'insert into "users" ("email") values (?)',
            ['foo'],
            expect.any(Function)
        );
        expect(spiedRun).toHaveBeenNthCalledWith(
            3,
            'delete from "users" where "email" = ?',
            ['foo'],
            expect.any(Function)
        );
        expect(spiedRun).toHaveBeenNthCalledWith(
            4,
            'insert into "users" ("email") values (?)',
            ['foo'],
            expect.any(Function)
        );
        expect(spiedRun).toHaveBeenNthCalledWith(5, 'select * from users', [null, 'claudio'], expect.any(Function));
        expect(spiedRun).toHaveBeenNthCalledWith(6, 'select * from users', [null, 'claudio'], expect.any(Function));
        expect(spiedRun).toHaveBeenNthCalledWith(7, 'select * from users', ['claudio'], expect.any(Function));
    });

    it('Works Run Call Get Before Executing', async () => {
        const connection = getConnection();
        const callback = jest.fn();
        connection.beforeExecuting(callback);
        const session = new MockedConnectionSession(connection);
        const spiedExecuted = jest.spyOn(session, 'getBeforeExecuting');
        await session.unprepared('delete from "users" where "email" = "foo"');
        expect(spiedExecuted).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith('delete from "users" where "email" = "foo"', [], session);
    });

    it('Works Run Call Callback With Query And Bindings', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spied = jest.fn();
        await session.run('delete from "users" where "email" = "foo"', ['foo', 'baz'], spied);
        expect(spied).toHaveBeenCalledWith('delete from "users" where "email" = "foo"', ['foo', 'baz']);
    });

    it('Works Run Call Log Query', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedLog = jest.spyOn(session, 'logQuery');
        await session.run<string[]>('delete from "users" where "email" = ?', ['foo'], async () => {
            return ['test'];
        });
        expect(spiedLog).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo'], expect.any(Number));
    });

    it('Works Log Query Emit Query Executed', async () => {
        const connection = getConnection();
        const dispatcher = new EventEmitter();
        const callback = jest.fn((queryExecuted: QueryExecuted) => {
            expect(queryExecuted).toBeInstanceOf(QueryExecuted);
            expect(queryExecuted.bindings).toEqual([null, 'claudio']);
            expect(queryExecuted.connectionName).toBe('fake');
            expect(queryExecuted.sql).toBe('select * from users');
            expect(queryExecuted.time).toBeGreaterThanOrEqual(0.5);
            expect(queryExecuted.inTransaction).toBeFalsy();
        });
        dispatcher.on(QueryExecuted.eventName, callback);
        connection.setEventDispatcher(dispatcher);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalPrepare = pdo.prepare;
        jest.spyOn(pdo, 'prepare').mockImplementation(async sql => {
            const statement = await originalPrepare.call(pdo, sql);
            jest.spyOn(statement, 'execute').mockImplementation(async () => {
                await sleep(500);
            });
            return statement;
        });
        const session = new MockedConnectionSession(connection);
        jest.spyOn(session, 'getPdoForSelect').mockReturnValue(pdo);
        await session.select('select * from users', [null, 'claudio']);
        expect(callback).toHaveBeenCalledTimes(1);
        await pdo.disconnect();
    });

    it('Works Run Throw Query Error', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const callback = jest.fn(() => {
            throw new Error('fake error');
        });
        await expect(session.run('delete from "users" where "email" = ?', ['foo'], callback)).rejects.toThrow(
            `fake error (Connection: fake, SQL: delete from "users" where "email" = 'foo')`
        );
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Run Retry On Query Connection Lost Error', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const callback = jest.fn(() => {
            throw new Error('server has gone away');
        });
        await expect(session.run('delete from "users" where "email" = ?', ['foo'], callback)).rejects.toThrow(
            `server has gone away (Connection: fake, SQL: delete from "users" where "email" = 'foo')`
        );
        expect(callback).toHaveBeenCalledTimes(2);
    });

    it('Works Run Do Not Retry On Query Connection Lost Error When In Transaction', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        session.incrementTransaction();
        const callback = jest.fn(() => {
            throw new Error('server has gone away');
        });
        await expect(session.run('delete from "users" where "email" = ?', ['foo'], callback)).rejects.toThrow(
            `server has gone away (Connection: fake, SQL: delete from "users" where "email" = 'foo')`
        );
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Pretend Call Callback With Connection Session', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const callback = jest.fn();
        await session.pretend(callback);
        expect(callback).toHaveBeenCalledWith(session);
    });

    it('Works Pretend Return Array of Logged Queries', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedPretend = jest.spyOn(session, 'pretending');
        const spiedEnableLog = jest.spyOn(session, 'enableQueryLog');
        expect(
            await session.pretend(async ses => {
                await ses.insert('insert into "users" ("email") values (?)', ['foo']);
                await ses.select('select * from users', [null, 'claudio']);
            })
        ).toEqual([
            { bindings: ['foo'], query: 'insert into "users" ("email") values (\'foo\')' },
            { bindings: [null, 'claudio'], query: 'select * from users' }
        ]);
        expect(spiedEnableLog).toHaveBeenCalledTimes(1);
        expect(spiedPretend).toHaveBeenCalledTimes(2);
        expect(spiedPretend).toHaveNthReturnedWith(1, true);
        expect(spiedPretend).toHaveNthReturnedWith(2, true);
    });

    it('Works Pretend Reset Query Logger', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        expect(
            await session.pretend(async ses => {
                await ses.insert('insert into "users" ("email") values (?)', ['foo']);
                await ses.select('select * from users', [null, 'claudio']);
            })
        ).toEqual([
            { bindings: ['foo'], query: 'insert into "users" ("email") values (\'foo\')' },
            { bindings: [null, 'claudio'], query: 'select * from users' }
        ]);
        expect(
            await session.pretend(async ses => {
                await ses.delete('delete from "users" where "email" = "foo"', ['foo', 'baz']);
            })
        ).toEqual([{ bindings: ['foo', 'baz'], query: 'delete from "users" where "email" = "foo"' }]);
    });

    it('Works Without Pretend Inside A pretend session execute the query', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResults(connection, [['claudio'], ['lupennat']], ['name']);
        const spiedPretend = jest.spyOn(session, 'pretending');
        const spiedEnableLog = jest.spyOn(session, 'enableQueryLog');
        const spiedDisableLog = jest.spyOn(session, 'disableQueryLog');
        expect(
            await session.pretend(async ses => {
                expect(await ses.insert('insert into "users" ("email") values (?)', ['foo'])).toBeTruthy();
                expect(
                    await ses.withoutPretending(() => {
                        return ses.select('select * from users');
                    })
                ).toEqual([{ name: 'claudio' }, { name: 'lupennat' }]);
                expect(await ses.select('select * from users', [null, 'claudio'])).toEqual([]);
            })
        ).toEqual([
            { bindings: ['foo'], query: 'insert into "users" ("email") values (\'foo\')' },
            { bindings: [null, 'claudio'], query: 'select * from users' }
        ]);
        expect(spiedEnableLog).toHaveBeenCalledTimes(2);
        expect(spiedDisableLog).toHaveBeenCalledTimes(1);
        expect(spiedPretend).toHaveBeenCalledTimes(4);
        expect(spiedPretend).toHaveNthReturnedWith(1, true);
        expect(spiedPretend).toHaveNthReturnedWith(2, true);
        expect(spiedPretend).toHaveNthReturnedWith(3, false);
        expect(spiedPretend).toHaveNthReturnedWith(4, true);
    });

    it('Works Without Pretend Only Execute callback if not pretending', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSessionWithResults(connection, [['claudio'], ['lupennat']], ['name']);
        const spiedPretend = jest.spyOn(session, 'pretending');
        const spiedEnableLog = jest.spyOn(session, 'enableQueryLog');
        const spiedDisableLog = jest.spyOn(session, 'disableQueryLog');

        expect(
            await session.withoutPretending(() => {
                return session.select('select * from users');
            })
        ).toEqual([{ name: 'claudio' }, { name: 'lupennat' }]);

        expect(spiedEnableLog).toHaveBeenCalledTimes(0);
        expect(spiedDisableLog).toHaveBeenCalledTimes(0);
        expect(spiedPretend).toHaveBeenCalledTimes(2);
        expect(spiedPretend).toHaveNthReturnedWith(1, false);
        expect(spiedPretend).toHaveNthReturnedWith(2, false);
    });

    it('Works Use Write Connection When Reading', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedReadPdo = jest.spyOn(session, 'getReadPdo');
        const spiedPdo = jest.spyOn(session, 'getPdo');
        session.useWriteConnectionWhenReading(true);
        await session.select('select * from users');
        expect(spiedReadPdo).toHaveBeenCalledTimes(1);
        expect(spiedPdo).toHaveBeenCalledTimes(1);
        session.useWriteConnectionWhenReading(false);
        await session.select('select * from users');
        expect(spiedReadPdo).toHaveBeenCalledTimes(2);
        expect(spiedPdo).toHaveBeenCalledTimes(1);
        session.useWriteConnectionWhenReading(true);
        await session.selectColumn(0, 'select * from users');
        expect(spiedReadPdo).toHaveBeenCalledTimes(3);
        expect(spiedPdo).toHaveBeenCalledTimes(2);
        session.useWriteConnectionWhenReading(false);
        await session.selectColumn(0, 'select * from users');
        expect(spiedReadPdo).toHaveBeenCalledTimes(4);
        expect(spiedPdo).toHaveBeenCalledTimes(2);
    });

    it('Works Begin Transaction', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedBegin = jest.spyOn(pdo, 'beginTransaction');
        const spiedEnsured = jest.spyOn(session, 'getEnsuredPdo').mockReturnValueOnce(pdo);
        await session.beginTransaction();
        expect(spiedBegin).toHaveBeenCalledTimes(1);
        expect(spiedEnsured).toHaveBeenCalledTimes(1);
        await session.rollBack();
        await pdo.disconnect();
    });

    it('Works Begin Transaction With Lost Connection Will Retry Begin Transaction', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const spiedBegin = jest
            .spyOn(pdo, 'beginTransaction')
            .mockImplementationOnce(() => {
                throw new Error('Generic Error');
            })
            .mockImplementationOnce(() => {
                throw new Error('server has gone away');
            });
        const spiedEnsured = jest.spyOn(session, 'getEnsuredPdo').mockReturnValue(pdo);
        await expect(session.beginTransaction()).rejects.toThrow('Generic Error');
        await session.beginTransaction();
        expect(spiedBegin).toHaveBeenCalledTimes(3);
        expect(spiedEnsured).toHaveBeenCalledTimes(3);
        await session.rollBack();
        await pdo.disconnect();
    });

    it('Works Begin Transaction Compile Save Points', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        let spiedExec!: jest.SpyInstance;
        let spiedRollback!: jest.SpyInstance;
        const spiedBegin = jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            spiedExec = jest.spyOn(trx, 'exec');
            spiedRollback = jest.spyOn(trx, 'rollback');
            return trx;
        });
        const spiedEnsured = jest.spyOn(session, 'getEnsuredPdo').mockReturnValue(pdo);
        const spiedEnTransaction = jest.spyOn(session, 'getEnsuredPdoTransaction');
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(1);
        expect(spiedBegin).toHaveBeenCalledTimes(1);
        expect(spiedEnsured).toHaveBeenCalledTimes(1);
        // another transaction generate save point
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(2);
        expect(spiedExec).toHaveBeenCalledWith('SAVEPOINT trans2');
        expect(spiedBegin).toHaveBeenCalledTimes(1);
        expect(spiedEnsured).toHaveBeenCalledTimes(1);
        expect(spiedEnTransaction).toHaveBeenCalledTimes(1);
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(3);
        expect(spiedExec).toHaveBeenCalledWith('SAVEPOINT trans3');
        // first rollback to save points
        await session.rollBack();
        expect(session.transactionLevel()).toBe(2);
        expect(spiedExec).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT trans3');
        expect(spiedRollback).not.toHaveBeenCalled();
        await session.rollBack();
        expect(session.transactionLevel()).toBe(1);
        expect(spiedExec).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT trans2');
        expect(spiedRollback).not.toHaveBeenCalled();
        // last rollback within pdo
        await session.rollBack();
        expect(session.transactionLevel()).toBe(0);
        expect(spiedRollback).toHaveBeenCalledTimes(1);
        await pdo.disconnect();
    });

    it('Works Begin Transaction On Save Point Throw An Error', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            jest.spyOn(trx, 'exec')
                .mockImplementationOnce(async () => {
                    throw new Error('server has gone away');
                })
                .mockImplementationOnce(async () => {
                    throw new Error('Generic Error');
                });
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValueOnce(pdo);
        await session.beginTransaction();
        await session.select('select * from "users"');
        await expect(session.beginTransaction()).rejects.toThrow('server has gone away');
        expect(session.transactionLevel()).toBe(1);
        await expect(session.beginTransaction()).rejects.toThrow('Generic Error');
        expect(session.transactionLevel()).toBe(1);
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(2);
        await session.rollBack(0);
        await pdo.disconnect();
    });

    it('Works Commit Transaction Commit Only Once', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        let spiedCommit!: jest.SpyInstance;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            spiedCommit = jest.spyOn(trx, 'commit');
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValue(pdo);
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.commit();
        expect(spiedCommit).not.toHaveBeenCalled();
        await session.commit();
        expect(spiedCommit).not.toHaveBeenCalled();
        await session.commit();
        expect(spiedCommit).toHaveBeenCalledTimes(1);
        expect(session.transactionLevel()).toBe(0);
        await pdo.disconnect();
    });

    it('Works Transaction Events', async () => {
        const connection = getConnection();
        const dispatcher = new EventEmitter();
        const spiedEmit = jest
            .spyOn(dispatcher, 'emit')
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['foo']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['bar']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['baz']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionRolledBack.eventName);
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitted.eventName);
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitting.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['foo']);
                expect(qE.inTransaction).toBeFalsy();
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['bar']);
                expect(qE.inTransaction).toBeFalsy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitted.eventName);
                return true;
            });

        connection.setEventDispatcher(dispatcher);
        const session = new MockedConnectionSession(connection);
        await session.beginTransaction();
        await session.insert('insert into "users" ("email") values (?)', ['foo']);
        await session.beginTransaction();
        await session.insert('insert into "users" ("email") values (?)', ['bar']);
        await session.beginTransaction();
        await session.insert('insert into "users" ("email") values (?)', ['baz']);
        await session.rollBack();
        await session.commit();
        await session.commit();
        expect(spiedEmit).toHaveBeenCalledTimes(12);
    });

    it('Works Commit Error Reset Transaction And Events', async () => {
        const connection = getConnection();
        const dispatcher = new EventEmitter();
        const spiedEmitter = jest
            .spyOn(dispatcher, 'emit')
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['foo']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['baz']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitted.eventName);
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitting.eventName);
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['foo']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionBeginning.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['baz']);
                expect(qE.inTransaction).toBeTruthy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitted.eventName);
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitting.eventName);
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['foo']);
                expect(qE.inTransaction).toBeFalsy();
                return true;
            })
            .mockImplementationOnce((name, ...args) => {
                const qE = args[0] as QueryExecuted;
                expect(name).toBe(QueryExecuted.eventName);
                expect(qE.sql).toBe('insert into "users" ("email") values (?)');
                expect(qE.bindings).toEqual(['baz']);
                expect(qE.inTransaction).toBeFalsy();
                return true;
            })
            .mockImplementationOnce(name => {
                expect(name).toBe(TransactionCommitted.eventName);
                return true;
            });
        connection.setEventDispatcher(dispatcher);
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        let called = false;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            const originalCommit = trx.commit;
            jest.spyOn(trx, 'commit').mockImplementation(async () => {
                await originalCommit.call(trx);
                if (!called) {
                    called = true;
                    throw new Error('server has gone away');
                }
            });
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValue(pdo);

        const retryable = async (): Promise<void> => {
            await session.beginTransaction();
            await session.insert('insert into "users" ("email") values (?)', ['foo']);
            await session.beginTransaction();
            await session.insert('insert into "users" ("email") values (?)', ['baz']);
            await session.commit();
            await session.commit();
        };

        await expect(retryable()).rejects.toThrow('server has gone away');
        await retryable();
        expect(spiedEmitter).toHaveBeenCalledTimes(15);
        await pdo.disconnect();
    });

    it('Works RollBack Error Will Call Rollback Pdo', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        let spiedRollback!: jest.SpyInstance;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            spiedRollback = jest.spyOn(trx, 'rollback');
            jest.spyOn(trx, 'exec').mockImplementation(async sql => {
                if (sql === 'ROLLBACK TO SAVEPOINT trans4') {
                    throw new Error('server has gone away');
                }
                return 1;
            });
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValueOnce(pdo);
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(4);
        await expect(session.rollBack()).rejects.toThrow('server has gone away');
        expect(session.transactionLevel()).toBe(0);
        expect(spiedRollback).toHaveBeenCalledTimes(1);
        await pdo.disconnect();
    });

    it('Works RollBack Error Will Reset Transaction Level On Connection Lost', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            jest.spyOn(trx, 'exec').mockImplementation(async sql => {
                if (sql === 'ROLLBACK TO SAVEPOINT trans4') {
                    throw new Error('server has gone away');
                }
                return 1;
            });
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValueOnce(pdo);
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(4);
        await expect(session.rollBack()).rejects.toThrow('server has gone away');
        expect(session.transactionLevel()).toBe(0);
        await pdo.disconnect();
    });

    it('Works RollBack Error Will Not Reset On General Error', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        let called = false;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            jest.spyOn(trx, 'exec').mockImplementation(async sql => {
                if (!called && sql === 'ROLLBACK TO SAVEPOINT trans4') {
                    called = true;
                    throw new Error('unknown error');
                }
                return 1;
            });
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValueOnce(pdo);
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(4);
        await expect(session.rollBack()).rejects.toThrow('unknown error');
        expect(session.transactionLevel()).toBe(4);
        await session.rollBack();
        expect(session.transactionLevel()).toBe(3);
        await session.rollBack(0);
        await pdo.disconnect();
    });

    it('Works RollBack With Level', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        await session.beginTransaction();
        expect(session.transactionLevel()).toBe(6);
        await session.rollBack(7);
        expect(session.transactionLevel()).toBe(6);
        await session.rollBack(-1);
        expect(session.transactionLevel()).toBe(6);
        await session.rollBack(3);
        expect(session.transactionLevel()).toBe(3);
        await session.rollBack(0);
        expect(session.transactionLevel()).toBe(0);
    });

    it('Works Transaction Call Callback With Connection Session', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const callback = jest.fn();
        await session.transaction(callback);
        expect(callback).toHaveBeenCalledWith(session);
    });

    it('Works Transaction Call Begin Transaction', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedBeginTransaction = jest.spyOn(session, 'beginTransaction');

        await session.transaction(() => {});
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(1);
    });

    it('Works Transaction Attempts On Transaction Error', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedBeginTransaction = jest.spyOn(session, 'beginTransaction');
        const spiedRollback = jest.spyOn(session, 'rollBack');
        await session.transaction(() => {}, -1);
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(0);
        expect(spiedRollback).toHaveBeenCalledTimes(0);

        await expect(
            session.transaction(async () => {
                throw new Error('server has gone away');
            }, 5)
        ).rejects.toThrow('server has gone away');
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(1);
        expect(spiedRollback).toHaveBeenCalledTimes(1);

        await expect(
            session.transaction(async () => {
                throw new Error('deadlock detected');
            }, 5)
        ).rejects.toThrow('deadlock detected');
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(6);
        expect(spiedRollback).toHaveBeenCalledTimes(6);
    });

    it('Works Transaction Attempts On Commit Error', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedBeginTransaction = jest.spyOn(session, 'beginTransaction');
        const spiedCommit = jest.spyOn(session, 'performCommit');
        const pdo = new Pdo('fake', {}, {}, {});
        const originalTransaction = pdo.beginTransaction;
        let called = false;
        jest.spyOn(pdo, 'beginTransaction').mockImplementation(async () => {
            const trx = await originalTransaction.call(pdo);
            const originalCommit = trx.commit;
            jest.spyOn(trx, 'commit').mockImplementation(async () => {
                await originalCommit.call(trx);
                if (!called) {
                    called = true;
                    throw new Error('server has gone away');
                } else {
                    throw new Error('deadlock detected');
                }
            });
            return trx;
        });
        jest.spyOn(session, 'getEnsuredPdo').mockReturnValue(pdo);
        await expect(session.transaction(async () => {}, 5)).rejects.toThrow('server has gone away');
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(1);
        expect(spiedCommit).toHaveBeenCalledTimes(1);
        await expect(session.transaction(async () => {}, 5)).rejects.toThrow('deadlock detected');
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(6);
        expect(spiedCommit).toHaveBeenCalledTimes(6);
        await pdo.disconnect();
    });

    it('Works Nested Transaction DeadLock Will Throw Without Retry Current Level', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedBeginTransaction = jest.spyOn(session, 'beginTransaction');
        const spiedRollback = jest.spyOn(session, 'rollBack');
        await session.transaction(() => {}, -1);

        await expect(
            session.transaction(async ses => {
                await ses.transaction(async () => {
                    throw new Error('deadlock detected');
                }, 5);
            }, 2)
        ).rejects.toThrow(DeadlockError);
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(4);
        expect(spiedRollback).toHaveBeenCalledTimes(2);
    });

    it('Works Nested Transaction Lost Connection Will Throw Without Retry Any Level', async () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const spiedBeginTransaction = jest.spyOn(session, 'beginTransaction');
        const spiedRollback = jest.spyOn(session, 'rollBack');
        await session.transaction(() => {}, -1);

        await expect(
            session.transaction(async ses => {
                await ses.transaction(async () => {
                    throw new Error('server has gone away');
                }, 5);
            }, 5)
        ).rejects.toThrow('server has gone away');
        expect(spiedBeginTransaction).toHaveBeenCalledTimes(2);
        expect(spiedRollback).toHaveBeenCalledTimes(2);
    });

    it('Works Raw Return Expression', () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const raw = session.raw('rawValue');
        expect(raw).toBeInstanceOf(Expression);
    });

    it('Works Bind To', () => {
        const connection = getConnection();
        const session = new MockedConnectionSession(connection);
        const typed = session.bindTo.bigInteger('934342342342343232');
        expect(typed).toBeInstanceOf(TypedBinding);
    });
});
