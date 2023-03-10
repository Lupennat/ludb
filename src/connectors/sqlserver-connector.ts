import { Pdo } from 'lupdo';
import { MssqlOptions } from 'lupdo-mssql';
import { SqlServerConfig } from '../types/config';
import ConnectorI from '../types/connector';
import { merge } from '../utils';
import Connector from './connector';

class SqlServerConnector extends Connector implements ConnectorI {
    /**
     * Establish a database connection.
     */
    public connect<T extends SqlServerConfig>(config: T): Pdo {
        const attributes = this.getAttributes<SqlServerConfig>(config);
        const poolOptions = this.getPoolOptions<SqlServerConfig>(config);

        const options: MssqlOptions = {
            server: config.host,
            options: {
                encrypt: config.encrypt,
                columnEncryptionSetting: config.column_encryption,
                port: config.port,
                database: config.database,
                trustServerCertificate: config.trust_server_certificate,
                connectionIsolationLevel: config.isolation_level,
                multiSubnetFailover: config.multi_subnet_failover,
                appName: config.appname,
                tdsVersion: config.version,
                readOnlyIntent: config.readonly
            }
        };

        if (config.username || config.password) {
            options.authentication = {
                type: 'default',
                options: {
                    userName: config.username,
                    password: config.password
                }
            };
        }

        return this.createConnection<MssqlOptions>(
            'mssql',
            merge(options, config.lupdo_options ?? {}),
            poolOptions,
            attributes
        );
    }
}

export default SqlServerConnector;
