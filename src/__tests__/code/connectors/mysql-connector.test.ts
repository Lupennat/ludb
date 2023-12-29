import { Pdo } from 'lupdo';
import MySqlConnector from '../../../connectors/mysql-connectors';
import { FakeConnection, pdo } from '../fixtures/mocked';

describe('MySql Connector', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works MySql Connector', async () => {
        const connector = new MySqlConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({
            username: 'username',
            password: 'secret',
            driver: 'mysql',
            host: 'foo',
            database: 'bar',
            port: 111,
            unix_socket: 'baz',
            charset: 'utf8'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'mysql',
            {
                charset: 'utf8',
                database: 'bar',
                host: 'foo',
                password: 'secret',
                port: 111,
                socketPath: 'baz',
                user: 'username'
            },
            { created: expect.any(Function), max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works Created Callback', async () => {
        let connector = new MySqlConnector();
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
            driver: 'mysql',
            host: 'foo',
            database: 'bar',
            port: 111,
            unix_socket: 'baz',
            charset: 'utf8',
            pool: {
                created: callback
            }
        });
        await pdo.query('SELECT 1');
        expect(spiedCallback[0]).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledTimes(1);
        await pdo.disconnect();

        connector = new MySqlConnector();
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
            driver: 'mysql',
            host: 'foo',
            database: 'bar',
            port: 111,
            unix_socket: 'baz',
            charset: 'utf8'
        });
        await pdo.query('SELECT 1');
        expect(spiedCallback[0]).toHaveBeenCalledTimes(1);
        await pdo.disconnect();
    });

    it('Works MySql Configure Isolation Level', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new MySqlConnector();
        await connector.configureIsolationLevel(fakeConnection, { driver: 'mysql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureIsolationLevel(fakeConnection, { driver: 'mysql', isolation_level: 'READ COMMITTED' });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set session transaction isolation level READ COMMITTED');
    });

    it('Works MySql Configure Encoding', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new MySqlConnector();
        await connector.configureEncoding(fakeConnection, { driver: 'mysql', collation: 'utf8_unicode_ci' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureEncoding(fakeConnection, { driver: 'mysql', charset: 'utf8' });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set names 'utf8'");
        await connector.configureEncoding(fakeConnection, {
            driver: 'mysql',
            charset: 'utf8',
            collation: 'utf8_unicode_ci'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set names 'utf8' collate 'utf8_unicode_ci'");
    });

    it('Works MySql Configure Timezone', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new MySqlConnector();
        await connector.configureTimezone(fakeConnection, { driver: 'mysql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.configureTimezone(fakeConnection, { driver: 'mysql', timezone: 'Europe/Rome' });
        expect(spiedPdoFake).toHaveBeenLastCalledWith('set time_zone="Europe/Rome"');
    });

    it('Works MySql Set Modes', async () => {
        const fakeConnection = new FakeConnection();
        const spiedPdoFake = jest.spyOn(fakeConnection, 'query');
        const connector = new MySqlConnector();
        await connector.setModes(fakeConnection, { driver: 'mysql' });
        expect(spiedPdoFake).not.toHaveBeenLastCalledWith();
        await connector.setModes(fakeConnection, {
            driver: 'mysql',
            modes: ['ONLY_FULL_GROUP_BY', 'STRICT_TRANS_TABLES']
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set session sql_mode='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES'");
        await connector.setModes(fakeConnection, {
            driver: 'mysql',
            strict: false
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith("set session sql_mode='NO_ENGINE_SUBSTITUTION'");
        await connector.setModes(fakeConnection, {
            driver: 'mysql',
            strict: true,
            version: '8.0.11'
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith(
            "set session sql_mode='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'"
        );
        await connector.setModes(fakeConnection, {
            driver: 'mysql',
            strict: true
        });
        expect(spiedPdoFake).toHaveBeenLastCalledWith(
            "set session sql_mode='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'"
        );
    });
});
