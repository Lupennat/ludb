import deepmerge from 'deepmerge';
import { Pdo, PdoConnectionI } from 'lupdo';
import { MysqlOptions } from 'lupdo-mysql';
import { MySqlConfig, MySqlStrict } from '../types/config';
import ConnectorI from '../types/connector';
import Connector from './connector';

class MySqlConnector extends Connector implements ConnectorI {
    /**
     * Establish a database connection.
     */
    public connect(config: MySqlConfig): Pdo {
        const attributes = this.getAttributes<MySqlConfig>(config);
        const poolOptions = this.getPoolOptions<MySqlConfig>(config);

        const originalCreated = poolOptions.created;

        poolOptions.created = async (uuid: string, connection: PdoConnectionI) => {
            const promises = [
                this.configureIsolationLevel(connection, config),
                this.configureEncoding(connection, config),
                // Next, we will check to see if a timezone has been specified in this config
                // and if it has we will issue a statement to modify the timezone with the
                // database. Setting this DB timezone is an optional configuration item.
                this.configureTimezone(connection, config),
                this.setModes(connection, config)
            ];
            if (typeof originalCreated === 'function') {
                promises.push(originalCreated(uuid, connection));
            }
            await Promise.all(promises);
        };

        const options: MysqlOptions = deepmerge(
            {
                user: config.username,
                password: config.password,
                database: config.database,
                charset: config.charset,
                socketPath: config.unix_socket,
                host: config.host,
                port: config.port
            },
            config.lupdo_options ?? {}
        );

        // We need to grab the PDO options that should be used while making the brand
        // new connection instance. The PDO options control various aspects of the
        // connection's behavior, and some might be specified by the developers.
        return this.createConnection<MysqlOptions>('mysql', options, poolOptions, attributes);
    }

    /**
     * Set the connection transaction isolation level.
     */
    public async configureIsolationLevel(connection: PdoConnectionI, config: MySqlConfig): Promise<void> {
        if (config.isolation_level) {
            connection.query(`set session transaction isolation level ${config.isolation_level}`);
        }
    }

    /**
     * Set the connection character set and collation.
     */
    public async configureEncoding(connection: PdoConnectionI, config: MySqlConfig): Promise<void> {
        if (config.charset) {
            connection.query(`set names '${config.charset}'${this.getCollation(config)}`);
        }
    }

    /**
     * Get the collation for the configuration.
     */
    protected getCollation(config: MySqlConfig): string {
        return config.collation ? ` collate '${config.collation}'` : '';
    }

    /**
     * Set the timezone on the connection.
     */
    public async configureTimezone(connection: PdoConnectionI, config: MySqlConfig): Promise<void> {
        if (config.timezone) {
            connection.query(`set time_zone="${config.timezone}"`);
        }
    }

    /**
     * Set the modes for the connection.
     */
    public async setModes(connection: PdoConnectionI, config: MySqlConfig): Promise<void> {
        if (config.modes && config.modes.length > 0) {
            connection.query(`set session sql_mode='${config.modes.join(',')}'`);
        } else if (config.strict !== undefined) {
            if (config.strict) {
                connection.query(this.strictMode(config.strict));
            } else {
                connection.query("set session sql_mode='NO_ENGINE_SUBSTITUTION'");
            }
        }
    }

    /**
     * Get the query to enable strict mode.
     */
    protected strictMode(strict: MySqlStrict): string {
        if (strict.toLowerCase() === 'new') {
            return "set session sql_mode='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'";
        }

        return "set session sql_mode='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'";
    }
}

export default MySqlConnector;
