import { Pdo } from 'lupdo';
import { rm, writeFile } from 'node:fs/promises';
import SqliteConnector from '../../../connectors/sqlite-connector';
import { FakeConnection, pdo } from '../fixtures/mocked';

describe('Sqlite Connector', () => {
    beforeAll(async () => {
        await writeFile(__dirname + '/test.sql', '');
    });

    afterAll(async () => {
        await pdo.disconnect();
        await rm(__dirname + '/test.sql');
    });

    it('Works Sqlite Connector', async () => {
        const connector = new SqliteConnector();
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
        let connector = new SqliteConnector();
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

        connector = new SqliteConnector();
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

    it('Works Sqlite Foreign Key Constraints', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new SqliteConnector();

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

    it('Works Sqlite Connector With Real Path', () => {
        const connector = new SqliteConnector();
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
        const connector = new SqliteConnector();
        expect(() => {
            connector.connect({ driver: 'sqlite' });
        }).toThrow('Database file path is required.');
    });

    it('Works Path Not Found Throw An Error', () => {
        const connector = new SqliteConnector();
        expect(() => {
            connector.connect({ driver: 'sqlite', database: './not-exists.sql' });
        }).toThrow(
            'Database file at path [./not-exists.sql] does not exist. Ensure this is an absolute path to the database.'
        );
    });
});
