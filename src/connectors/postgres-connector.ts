import { Pdo, PdoConnectionI } from 'lupdo';
import { PostgresOptions } from 'lupdo-postgres';
import { readFileSync } from 'node:fs';
import { PostgresConfig } from '../types/config';
import ConnectorI from '../types/connector';
import { merge, parseSearchPath } from '../utils';
import Connector from './connector';

class PostgresConnector extends Connector implements ConnectorI {
    /**
     * Establish a database connection.
     */
    public connect<T extends PostgresConfig>(config: T): Pdo {
        const attributes = this.getAttributes<PostgresConfig>(config);
        const poolOptions = this.getPoolOptions<PostgresConfig>(config);

        const originalCreated = poolOptions.created;

        poolOptions.created = async (uuid: string, connection: PdoConnectionI) => {
            const promises = [
                this.configureIsolationLevel(connection, config),
                this.configureEncoding(connection, config),
                // Next, we will check to see if a timezone has been specified in this config
                // and if it has we will issue a statement to modify the timezone with the
                // database. Setting this DB timezone is an optional configuration item.
                this.configureTimezone(connection, config),
                this.configureSearchPath(connection, config),
                this.configureSynchronousCommit(connection, config)
            ];
            if (typeof originalCreated === 'function') {
                const promise = originalCreated(uuid, connection);
                if (promise !== undefined) {
                    promises.push(promise);
                }
            }
            await Promise.all(promises);
        };

        let ssl: undefined | boolean | { [key: string]: string | undefined | boolean } = {
            cert: config.sslcert ? readFileSync(config.sslcert).toString() : undefined,
            key: config.sslkey ? readFileSync(config.sslkey).toString() : undefined,
            ca: config.sslrootcert ? readFileSync(config.sslrootcert).toString() : undefined
        };

        switch (config.sslmode) {
            case 'disable':
                ssl = false;
                break;
            case 'prefer':
            case 'require':
            case 'verify-ca':
            case 'verify-full':
                ssl = Object.values(ssl).filter(Boolean).length === 0 ? true : ssl;
                break;
            case 'no-verify':
                if (Object.values(ssl).filter(Boolean).length === 0) {
                    ssl = { rejectUnauthorized: false };
                } else {
                    ssl.rejectUnauthorized = false;
                }
                break;
            default:
                ssl = Object.values(ssl).filter(Boolean).length === 0 ? undefined : ssl;
        }

        const options: PostgresOptions = merge<PostgresOptions>(
            {
                user: config.username,
                database: config.database,
                password: config.password,
                port: config.port,
                host: config.host,
                application_name: config.application_name,
                ssl: ssl
            },
            config.lupdo_options ?? {}
        );

        // First we'll create the basic DSN and connection instance connecting to the
        // using the configuration option specified by the developer. We will also
        // set the default character set on the connections to UTF-8 by default.
        return this.createConnection<PostgresOptions>('pgsql', options, poolOptions, attributes);
    }

    /**
     * Set the connection transaction isolation level.
     */
    public async configureIsolationLevel(connection: PdoConnectionI, config: PostgresConfig): Promise<void> {
        if (config.isolation_level) {
            connection.query(`set session characteristics as transaction isolation level ${config.isolation_level}`);
        }
    }

    /**
     * Set the connection character.
     */
    public async configureEncoding(connection: PdoConnectionI, config: PostgresConfig): Promise<void> {
        if (config.charset) {
            connection.query(`set names '${config.charset}'`);
        }
    }

    /**
     * Set the timezone on the connection.
     */
    public async configureTimezone(connection: PdoConnectionI, config: PostgresConfig): Promise<void> {
        if (config.timezone) {
            connection.query(`set time zone '${config.timezone}'`);
        }
    }

    /**
     * Set the "search_path" on the database connection.
     */
    public async configureSearchPath(connection: PdoConnectionI, config: PostgresConfig): Promise<void> {
        const search = config.search_path ?? config.schema;

        if (search) {
            connection.query(`set search_path to ${this.quoteSearchPath(parseSearchPath(search))}`);
        }
    }

    /**
     * Format the search path for the DSN.
     */
    protected quoteSearchPath(searchPath: string[]): string {
        return searchPath.length === 1 ? `"${searchPath[0]}"` : `"${searchPath.join('", "')}"`;
    }

    /**
     * Configure the synchronous_commit setting.
     */
    public async configureSynchronousCommit(connection: PdoConnectionI, config: PostgresConfig): Promise<void> {
        if (config.synchronous_commit) {
            connection.query(`set synchronous_commit to '${config.synchronous_commit}'`);
        }
    }
}

export default PostgresConnector;
