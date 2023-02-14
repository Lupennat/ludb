import deepmerge from 'deepmerge';
import { Pdo, PdoConnectionI } from 'lupdo';
import 'lupdo-postgres';
import { PostgresOptions } from 'lupdo-postgres';
import { readFileSync } from 'node:fs';
import { PostgresFlattedConfig } from '../types/config';
import { ConnectorI } from '../types/connector';
import Connector from './connector';

class PostgresConnector extends Connector implements ConnectorI {
    /**
     * Establish a database connection.
     */
    public connect<T extends PostgresFlattedConfig>(config: T): Pdo {
        const attributes = this.getAttributes<PostgresFlattedConfig>(config);
        const poolOptions = this.getPoolOptions<PostgresFlattedConfig>(config);

        poolOptions.created = async (_uuid: string, connection: PdoConnectionI) => {
            await this.configureIsolationLevel(connection, config);
            await this.configureEncoding(connection, config);
            // Next, we will check to see if a timezone has been specified in this config
            // and if it has we will issue a statement to modify the timezone with the
            // database. Setting this DB timezone is an optional configuration item.
            await this.configureTimezone(connection, config);

            await this.configureSearchPath(connection, config);

            await this.configureSynchronousCommit(connection, config);
        };

        let ssl: undefined | { [key: string]: string | undefined } = {
            sslmode: config.sslmode,
            cert: config.sslcert ? readFileSync(config.sslcert).toString() : undefined,
            key: config.sslkey ? readFileSync(config.sslkey).toString() : undefined,
            ca: config.sslrootcert ? readFileSync(config.sslrootcert).toString() : undefined
        };

        if (Object.values(ssl).filter(Boolean).length === 0) {
            ssl = undefined;
        }

        const options: PostgresOptions = deepmerge(
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
    protected async configureIsolationLevel(connection: PdoConnectionI, config: PostgresFlattedConfig): Promise<void> {
        if (config.isolation_level) {
            await connection.query(
                `set session characteristics as transaction isolation level ${config.isolation_level}`
            );
        }
    }

    /**
     * Set the connection character.
     */
    protected async configureEncoding(connection: PdoConnectionI, config: PostgresFlattedConfig): Promise<void> {
        if (config.charset) {
            await connection.query(`set names '${config.charset}'`);
        }
    }

    /**
     * Set the timezone on the connection.
     */
    protected async configureTimezone(connection: PdoConnectionI, config: PostgresFlattedConfig): Promise<void> {
        if (config.timezone) {
            await connection.query(`set time zone "${config.timezone}"`);
        }
    }

    /**
     * Set the "search_path" on the database connection.
     */
    protected async configureSearchPath(connection: PdoConnectionI, config: PostgresFlattedConfig): Promise<void> {
        const search = config.search_path ?? config.schema;

        if (search) {
            await connection.query(`set search_path to ${this.quoteSearchPath(this.parseSearchPath(search))}`);
        }
    }

    /**
     * Parse the Postgres "search_path" configuration value into an array.
     */
    protected parseSearchPath(searchPath: string): string[] {
        const regex = new RegExp(/[^\s,"\']+/, 'g');
        return [...searchPath.matchAll(regex)].map(match => {
            const trimStartRegex = new RegExp(`^['"]+`, 'g');
            const trimEndRegex = new RegExp(`['"]+$`, 'g');
            return match[0].replace(trimStartRegex, '').replace(trimEndRegex, '');
        });
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
    protected async configureSynchronousCommit(
        connection: PdoConnectionI,
        config: PostgresFlattedConfig
    ): Promise<void> {
        if (config.synchronous_commit) {
            await connection.query(`set synchronous_commit to '${config.synchronous_commit}'`);
        }
    }
}

export default PostgresConnector;
