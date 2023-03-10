import SqlServerConnector from '../../../connectors/sqlserver-connector';
import { pdo } from '../fixtures/mocked';

describe('SqlServer Connector', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works SqlServer Connect Calls Create Connection With Proper Arguments', () => {
        const connector = new SqlServerConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({ driver: 'sqlsrv', host: 'foo', database: 'bar', port: 111 });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'mssql',
            {
                options: {
                    appName: undefined,
                    columnEncryptionSetting: undefined,
                    connectionIsolationLevel: undefined,
                    database: 'bar',
                    encrypt: undefined,
                    multiSubnetFailover: undefined,
                    port: 111,
                    readOnlyIntent: undefined,
                    tdsVersion: undefined,
                    trustServerCertificate: undefined
                },
                server: 'foo'
            },
            { max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works SqlServer Connect Calls Create Connection With Optional Arguments', () => {
        const connector = new SqlServerConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({
            driver: 'sqlsrv',
            host: 'foo',
            database: 'bar',
            port: 111,
            readonly: true,
            version: '7.4',
            encrypt: true,
            column_encryption: true,
            isolation_level: 1,
            appname: 'app',
            trust_server_certificate: true,
            multi_subnet_failover: true,
            username: 'sa',
            password: 'secret',
            lupdo_options: {
                domain: 'test'
            }
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'mssql',
            {
                authentication: {
                    options: {
                        password: 'secret',
                        userName: 'sa'
                    },
                    type: 'default'
                },
                domain: 'test',
                options: {
                    appName: 'app',
                    columnEncryptionSetting: true,
                    connectionIsolationLevel: 1,
                    database: 'bar',
                    encrypt: true,
                    multiSubnetFailover: true,
                    port: 111,
                    readOnlyIntent: true,
                    tdsVersion: '7.4',
                    trustServerCertificate: true
                },
                server: 'foo'
            },
            { max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });

    it('Works SqlServer Connector Authentication Options', () => {
        const connector = new SqlServerConnector();
        const spiedConnection = jest.spyOn(connector, 'createConnection').mockReturnValue(pdo);
        connector.connect({
            driver: 'sqlsrv',
            username: 'sa'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'mssql',
            {
                authentication: { options: { password: undefined, userName: 'sa' }, type: 'default' },
                options: {
                    appName: undefined,
                    columnEncryptionSetting: undefined,
                    connectionIsolationLevel: undefined,
                    database: undefined,
                    encrypt: undefined,
                    multiSubnetFailover: undefined,
                    port: undefined,
                    readOnlyIntent: undefined,
                    tdsVersion: undefined,
                    trustServerCertificate: undefined
                },
                server: undefined
            },
            { max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
        connector.connect({
            driver: 'sqlsrv',
            password: 'secret'
        });
        expect(spiedConnection).toHaveBeenLastCalledWith(
            'mssql',
            {
                authentication: { options: { password: 'secret', userName: undefined }, type: 'default' },
                options: {
                    appName: undefined,
                    columnEncryptionSetting: undefined,
                    connectionIsolationLevel: undefined,
                    database: undefined,
                    encrypt: undefined,
                    multiSubnetFailover: undefined,
                    port: undefined,
                    readOnlyIntent: undefined,
                    tdsVersion: undefined,
                    trustServerCertificate: undefined
                },
                server: undefined
            },
            { max: 5, min: 0 },
            { ATTR_CASE: 1, ATTR_DEBUG: 1, ATTR_NULLS: 1 }
        );
    });
});
