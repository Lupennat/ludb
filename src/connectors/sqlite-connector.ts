import { Pdo, PdoConnectionI } from 'lupdo';
import 'lupdo-sqlite';
import { SqliteOptions } from 'lupdo-sqlite';
import { existsSync } from 'node:fs';
import { SQliteFlattedConfig } from '../types/config';
import { ConnectorI } from '../types/connector';
import Connector from './connector';

class SQLiteConnector extends Connector implements ConnectorI {
    /**
     * Establish a database connection.
     */
    public connect<T extends SQliteFlattedConfig>(config: T): Pdo {
        const attributes = this.getAttributes<SQliteFlattedConfig>(config);
        const poolOptions = this.getPoolOptions<SQliteFlattedConfig>(config);

        poolOptions.created = async (_uuid: string, connection: PdoConnectionI) => {
            await this.configureForeignKeyConstraints(connection, config);
        };

        const options = Object.assign({ path: config.database }, config.lupdo_options ?? {});

        if (!options.path) {
            throw new Error(`"Database file path is required.`);
        }

        // SQLite supports "in-memory" databases that only last as long as the owning
        // connection does. These are useful for tests or for short lifetime store
        // querying. In-memory databases may only have a single open connection.
        if (options.path === ':memory:')
            return this.createConnection<SqliteOptions>('sqlite', options as SqliteOptions, poolOptions, attributes);

        const path = existsSync(options.path);

        // Here we'll verify that the SQLite database exists before going any further
        // as the developer probably wants to know if the database exists and this
        // SQLite driver will not throw any exception if it does not by default.
        if (path === false) {
            throw new Error(
                `"Database file at path [${path}] does not exist. Ensure this is an absolute path to the database.`
            );
        }

        return this.createConnection<SqliteOptions>('sqlite', options as SqliteOptions, poolOptions, attributes);
    }

    /**
     * Configure the foreign_key_constraints setting.
     */
    protected async configureForeignKeyConstraints(
        connection: PdoConnectionI,
        config: SQliteFlattedConfig
    ): Promise<void> {
        if (typeof config.foreign_key_constraints === 'boolean') {
            await connection.query(`foreign_keys = ${config.foreign_key_constraints ? 'ON' : 'OFF'}`);
        }
    }
}

export default SQLiteConnector;
