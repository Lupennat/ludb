import { Pdo } from 'lupdo';
import { rm, writeFile } from 'node:fs/promises';
import PostgresConnector from '../../../connectors/postgres-connector';
import { FakeConnection, pdo } from '../fixtures/mocked';

describe('Postgres Connector', () => {
    beforeAll(async () => {
        await writeFile(__dirname + '/sslcert', 'sslcert content');
        await writeFile(__dirname + '/sslkey', 'sslkey content');
        await writeFile(__dirname + '/sslrootcert', 'sslrootcert content');
    });

    afterAll(async () => {
        await pdo.disconnect();
        await rm(__dirname + '/sslcert');
        await rm(__dirname + '/sslkey');
        await rm(__dirname + '/sslrootcert');
    });

    it('Works Postgres Connector', async () => {
        const connector = new PostgresConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: undefined,
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works Ssl', () => {
        const connector = new PostgresConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslcert: __dirname + '/sslcert',
            sslkey: __dirname + '/sslkey',
            sslrootcert: __dirname + '/sslrootcert'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: {
                    ca: 'sslrootcert content',
                    cert: 'sslcert content',
                    key: 'sslkey content'
                },
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'disable',
            sslcert: __dirname + '/sslcert',
            sslkey: __dirname + '/sslkey',
            sslrootcert: __dirname + '/sslrootcert'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: false,
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'verify-full',
            sslcert: __dirname + '/sslcert',
            sslkey: __dirname + '/sslkey',
            sslrootcert: __dirname + '/sslrootcert'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: {
                    ca: 'sslrootcert content',
                    cert: 'sslcert content',
                    key: 'sslkey content'
                },
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'verify-full'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: true,
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'verify-ca'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: true,
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'prefer'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: true,
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'require'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: true,
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'no-verify',
            sslcert: __dirname + '/sslcert',
            sslkey: __dirname + '/sslkey',
            sslrootcert: __dirname + '/sslrootcert'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: {
                    ca: 'sslrootcert content',
                    cert: 'sslcert content',
                    key: 'sslkey content',
                    rejectUnauthorized: false
                },
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            sslmode: 'no-verify'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'pgsql',
            {
                application_name: 'test',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                ssl: {
                    rejectUnauthorized: false
                },
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works Ssl Throw An Error When Wrong Path', () => {
        const connector = new PostgresConnector();
        expect(() => {
            connector.connect({
                username: 'username',
                password: 'secret',
                driver: 'pgsql',
                host: 'foo',
                database: 'bar',
                port: 111,
                application_name: 'test',
                sslcert: './not-exists-sslcert'
            });
        }).toThrowError();
        expect(() => {
            connector.connect({
                username: 'username',
                password: 'secret',
                driver: 'pgsql',
                host: 'foo',
                database: 'bar',
                port: 111,
                application_name: 'test',
                sslkey: './not-exists-sslkey'
            });
        }).toThrowError();
        expect(() => {
            connector.connect({
                username: 'username',
                password: 'secret',
                driver: 'pgsql',
                host: 'foo',
                database: 'bar',
                port: 111,
                application_name: 'test',
                sslrootcert: './not-exists-sslrootcert'
            });
        }).toThrowError();
    });

    it('Works Created Callback', async () => {
        let connector = new PostgresConnector();
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
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test',
            pool: {
                created: callback
            }
        });
        await pdo.query('SELECT 1');
        expect(spiedCallback[0]).toBeCalledTimes(1);
        expect(callback).toBeCalledTimes(1);
        await pdo.disconnect();

        connector = new PostgresConnector();
        spiedCallback = [];
        jest.spyOn(connector, 'createConnection').mockImplementationOnce(
            (_driver, options, poolOptions, attributes) => {
                spiedCallback.push(jest.spyOn(poolOptions, 'created'));
                return new Pdo('fake', options, poolOptions, attributes);
            }
        );

        pdo = connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'pgsql',
            host: 'foo',
            database: 'bar',
            port: 111,
            application_name: 'test'
        });
        await pdo.query('SELECT 1');
        expect(spiedCallback[0]).toBeCalledTimes(1);
        await pdo.disconnect();
    });

    it('Works Postgres Configure Isolation Level', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new PostgresConnector();
        await connector.configureIsolationLevel(fakeConnection, { driver: 'pgsql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureIsolationLevel(fakeConnection, { driver: 'pgsql', isolation_level: 'READ COMMITTED' });
        expect(spiedPdoFake).toHaveBeenLastCalledWith(
            'set session characteristics as transaction isolation level READ COMMITTED'
        );
    });

    it('Works Postgres Configure Encoding', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new PostgresConnector();
        await connector.configureEncoding(fakeConnection, { driver: 'pgsql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureEncoding(fakeConnection, { driver: 'pgsql', charset: 'UTF8' });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set names 'UTF8'");
    });

    it('Works Postgres Configure Timezone', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new PostgresConnector();
        await connector.configureTimezone(fakeConnection, { driver: 'pgsql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureTimezone(fakeConnection, { driver: 'pgsql', timezone: 'Europe/Rome' });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set time zone 'Europe/Rome'");
    });

    it('Works Postgres Configure Synchronous Commit', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new PostgresConnector();
        await connector.configureSynchronousCommit(fakeConnection, { driver: 'pgsql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureSynchronousCommit(fakeConnection, {
            driver: 'pgsql',
            synchronous_commit: 'remote_write'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set synchronous_commit to 'remote_write'");
    });

    it('Works Postgres Configure Search Path', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new PostgresConnector();
        await connector.configureSearchPath(fakeConnection, { driver: 'pgsql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: 'public'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: 'Public'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "Public"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: '¡foo_bar-Baz!.Áüõß'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "¡foo_bar-Baz!.Áüõß"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: "'public'"
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: '"public"'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: '$user'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "$user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: 'public user'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: 'public\nuser\r\n\ttest'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user", "test"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: 'public,user'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: 'public, user'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: "'public', 'user'"
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: '"public", "user"'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: '"public user"'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: ['public', 'user']
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: ['public', '$user']
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "$user"');
        await connector.configureSearchPath(fakeConnection, {
            driver: 'pgsql',
            search_path: ['public', '"user"', "'test'", 'spaced schema']
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set search_path to "public", "user", "test", "spaced schema"');
    });
});
