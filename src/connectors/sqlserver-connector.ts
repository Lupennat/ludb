import { Pdo } from 'lupdo';
import { MssqlOptions } from 'lupdo-mssql';
import { SqlserverConfig } from '../types/config';
import { merge } from '../utils';
import Connector from './connector';

class SqlserverConnector extends Connector {
    /**
     * Establish a database connection.
     */
    public connect(config: SqlserverConfig): Pdo {
        const attributes = this.getAttributes(config);
        const poolOptions = this.getPoolOptions(config);

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

        return this.createConnection(
            'mssql',
            merge<MssqlOptions>(options, config.lupdo_options ?? {}),
            poolOptions,
            attributes
        );
    }
}

export default SqlserverConnector;
