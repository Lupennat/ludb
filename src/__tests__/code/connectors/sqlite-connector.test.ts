import { Pdo } from 'lupdo';
import { rm, writeFile } from 'node:fs/promises';
import SQLiteConnector from '../../../connectors/sqlite-connector';
import { FakeConnection, pdo } from '../fixtures/mocked';

describe('SQLite Connector', () => {
    beforeAll(async () => {
        await writeFile(__dirname + '/test.sql', '');
    });

    afterAll(async () => {
        await pdo.disconnect();
        await rm(__dirname + '/test.sql');
    });

    it('Works SQLite Connector', async () => {
        const connector = new SQLiteConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({ driver: 'sqlite', database: ':memory:', foreign_key_constraints: false });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'sqlite',
            { path: ':memory:' },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works Created Callback', async () => {
        let connector = new SQLiteConnector();
        let spiedCallback: jest.SpyInstance[] = [];
        jest.spyOn(connector, 'createConnection').mockImplementationOnce(
            (_driver, options, poolOptions, attributes) => {
                spiedCallback.push(jest.spyOn(poolOptions, 'created'));
                return new Pdo('fake', options, poolOptions, attributes);
            }
        );

        const callback = jest.fn(async (uuid, connection) => {
            expect(typeof uuid).toBe('string');
            expect(connection).toBeInstanceOf(FakeConnection);
        });

        let pdo = connector.connect({
            driver: 'sqlite',
            database: ':memory:',
            foreign_key_constraints: false,
            pool: {
                created: callback
            }
        });
        await pdo.query('SELECT 1');
        expect(spiedCallback[0]).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledTimes(1);
        await pdo.disconnect();

        connector = new SQLiteConnector();
        spiedCallback = [];
        jest.spyOn(connector, 'createConnection').mockImplementationOnce(
            (_driver, options, poolOptions, attributes) => {
                spiedCallback.push(jest.spyOn(poolOptions, 'created'));
                return new Pdo('fake', options, poolOptions, attributes);
            }
        );

        pdo = connector.connect({
            driver: 'sqlite',
            database: ':memory:',
            foreign_key_constraints: false
        });
        await pdo.query('SELECT 1');
        expect(spiedCallback[0]).toHaveBeenCalledTimes(1);
        await pdo.disconnect();
    });

    it('Works SQLite Foreign Key Constraints', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new SQLiteConnector();

        await connector.configureForeignKeyConstraints(fakeConnection, {
            driver: 'sqlite',
            database: ':memory:'
        });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureForeignKeyConstraints(fakeConnection, {
            driver: 'sqlite',
            database: ':memory:',
            foreign_key_constraints: false
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('foreign_keys = OFF');
        await connector.configureForeignKeyConstraints(fakeConnection, {
            driver: 'sqlite',
            database: ':memory:',
            foreign_key_constraints: true
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('foreign_keys = ON');
    });

    it('Works SQLite Connector With Real Path', () => {
        const connector = new SQLiteConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({ driver: 'sqlite', database: __dirname + '/test.sql', foreign_key_constraints: false });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'sqlite',
            { path: __dirname + '/test.sql' },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works Missing Database Throw An Error', () => {
        const connector = new SQLiteConnector();
        expect(() => {
            // @ts-expect-error test missing database
            connector.connect({ driver: 'sqlite' });
        }).toThrow('Database file path is required.');
    });

    it('Works Path Not Found Throw An Error', () => {
        const connector = new SQLiteConnector();
        expect(() => {
            connector.connect({ driver: 'sqlite', database: './not-exists.sql' });
        }).toThrow(
            'Database file at path [./not-exists.sql] does not exist. Ensure this is an absolute path to the database.'
        );
    });
});
