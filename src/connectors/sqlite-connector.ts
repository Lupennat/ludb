import { Pdo, PdoConnectionI } from 'lupdo';
import { SqliteOptions } from 'lupdo-sqlite';
import { existsSync } from 'node:fs';
import { SQLiteConfig } from '../types/config';
import ConnectorI from '../types/connector';
import { merge } from '../utils';
import Connector from './connector';

class SQLiteConnector extends Connector implements ConnectorI {
    /**
     * Establish a database connection.
     */
    public connect<T extends SQLiteConfig>(config: T): Pdo {
        const attributes = this.getAttributes<SQLiteConfig>(config);
        const poolOptions = this.getPoolOptions<SQLiteConfig>(config);

        const originalCreated = poolOptions.created;

        poolOptions.created = async (uuid: string, connection: PdoConnectionI) => {
            const promises = [this.configureForeignKeyConstraints(connection, config)];

            if (typeof originalCreated === 'function') {
                promises.push(originalCreated(uuid, connection));
            }
            await Promise.all(promises);
        };

        const options = merge(
            {
                path: config.database,
                wal: config.journal_mode_wal,
                walMaxSize: config.wal_max_size,
                walSynchronous: config.wal_synchronous,
                onWalError: config.wal_on_error
            },
            config.lupdo_options ?? {}
        );

        if (!options.path) {
            throw new Error('Database file path is required.');
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
                `Database file at path [${options.path}] does not exist. Ensure this is an absolute path to the database.`
            );
        }

        return this.createConnection<SqliteOptions>('sqlite', options as SqliteOptions, poolOptions, attributes);
    }

    /**
     * Configure the foreign_key_constraints setting.
     */
    public async configureForeignKeyConstraints(connection: PdoConnectionI, config: SQLiteConfig): Promise<void> {
        if (typeof config.foreign_key_constraints === 'boolean') {
            connection.query(`foreign_keys = ${Boolean(config.foreign_key_constraints) ? 'ON' : 'OFF'}`);
        }
    }
}

export default SQLiteConnector;
