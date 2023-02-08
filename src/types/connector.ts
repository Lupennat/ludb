import { Pdo } from 'lupdo';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import { PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';
import { FlattedConnectionConfig } from './config';

export type ConnectorResolver = () => ConnectorI;

export interface ConnectorI {
    /**
     * Establish a database connection.
     *
     */
    connect(config: FlattedConnectionConfig): Pdo;
    /**
     * Get the default PDO attributes.
     */
    getDefaultAttributes(): PdoAttributes;

    /**
     * Set the default PDO connection attributes.
     */
    setDefaultAttributes(attributes: PdoAttributes): void;

    /**
     * Get the default PDO pool options.
     */
    getDefaultPoolOptions(): PoolOptions;

    /**
     * Set the default PDO pool options.
     */
    setDefaultPoolOptions(poolOptions: PoolOptions): void;
}
