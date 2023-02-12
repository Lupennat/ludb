import ExpressionContract from '../query/expression-contract';
import { ConnectionConfig } from './config';
import DriverConnectionI from './connection';

export type Extension = (config: ConnectionConfig, name: string) => DriverConnectionI;

export type UsingConnectionCallback<T> = (connection: DriverConnectionI) => Promise<T>;

export type ReconnectorCallback = (connection: DriverConnectionI) => Promise<void>;

export interface DatabaseI {
    /**
     * Get a database connection instance.
     */
    connection(name?: string): DriverConnectionI;

    /**
     * Get a new raw query expression.
     */
    raw(value: string): ExpressionContract;

    /**
     * Disconnect from the given database and remove from local cache.
     */
    purge(name?: string): Promise<void>;

    /**
     * Disconnect from the given database.
     */
    disconnect(name?: string): Promise<void>;

    /**
     * Reconnect to the given database.
     */
    reconnect(name?: string): Promise<DriverConnectionI>;

    /**
     * Get the default connection name.
     */
    getDefaultConnection(): string;

    /**
     * Set the default connection name.
     */
    setDefaultConnection(name: string): void;

    /**
     * Get all of the support drivers.
     */
    supportedDrivers(): string[];

    /**
     * Get all of the drivers that are actually available.
     */
    availableDrivers(): string[];

    /**
     * Register an extension connection resolver.
     */
    extend(name: string, resolver: Extension): void;

    /**
     * Remove an extension connection resolver.
     */
    forgetExtension(name: string): void;

    /**
     * Return all of the created connections.
     */
    getConnections(): { [key: string]: DriverConnectionI };
}
