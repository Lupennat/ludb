import { Pdo, PdoConnectionI } from 'lupdo';

import { existsSync } from 'node:fs';
import { FlattedConnectionConfig, SqliteConfig } from '../types/config';
import { LupdoSqliteOptions } from '../types/lupdo-drivers/sqlite';
import { merge } from '../utils';
import Connector from './connector';

class SqliteConnector extends Connector {
    /**
     * Establish a database connection.
     */
    public connect(config: FlattedConnectionConfig<SqliteConfig>): Pdo {
        const attributes = this.getAttributes<SqliteConfig>(config);
        const poolOptions = this.getPoolOptions<SqliteConfig>(config);

        const originalCreated = poolOptions.created;

        poolOptions.created = async (uuid: string, connection: PdoConnectionI) => {
            const promises = [this.configureForeignKeyConstraints(connection, config)];

            if (typeof originalCreated === 'function') {
                const promise = originalCreated(uuid, connection);
                if (promise !== undefined) {
                    promises.push(promise);
                }
            }
            await Promise.all(promises);
        };

        const options: LupdoSqliteOptions = merge(
            {
                readonly: config.readonly ?? false,
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

        // Sqlite supports "in-memory" databases that only last as long as the owning
        // connection does. These are useful for tests or for short lifetime store
        // querying. In-memory databases may only have a single open connection.
        if (options.path === ':memory:') return this.createConnection('sqlite', options, poolOptions, attributes);

        const path = existsSync(options.path);

        // Here we'll verify that the Sqlite database exists before going any further
        // as the developer probably wants to know if the database exists and this
        // Sqlite driver will not throw any exception if it does not by default.
        if (path === false) {
            throw new Error(
                `Database file at path [${options.path}] does not exist. Ensure this is an absolute path to the database.`
            );
        }

        return this.createConnection('sqlite', options, poolOptions, attributes);
    }

    /**
     * Configure the foreign_key_constraints setting.
     */
    public async configureForeignKeyConstraints(connection: PdoConnectionI, config: SqliteConfig): Promise<void> {
        if (typeof config.foreign_key_constraints === 'boolean') {
            connection.query(`foreign_keys = ${Boolean(config.foreign_key_constraints) ? 'ON' : 'OFF'}`);
        }
    }
}

export default SqliteConnector;
