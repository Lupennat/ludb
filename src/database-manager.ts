import { Pdo } from 'lupdo';
import EventEmitter from 'node:events';
import ConnectionFactory from './connectors/connection-factory';
import ExpressionContract from './query/expression-contract';
import { ConnectionConfig, DatabaseConfig, DriverConfig, ReadWriteType } from './types/config';
import DriverConnectionI from './types/connection';
import { DatabaseI, Extension } from './types/database';
import { raw } from './utils';

class DatabaseManager implements DatabaseI {
    /**
     * The database config.
     */
    protected config: DatabaseConfig;

    /**
     * The database connection factory instance.
     */
    protected factory: ConnectionFactory;

    /**
     * The event dispatcher instance.
     */
    protected dispatcher: EventEmitter;

    /**
     * The active connection instances.
     */
    protected connections: { [key: string]: DriverConnectionI } = {};

    /**
     * The custom connection resolvers.
     */
    protected extensions: { [key: string]: Extension } = {};

    /**
     * Create a new database manager instance.
     */
    constructor(config?: DatabaseConfig, factory?: ConnectionFactory, dispatcher?: EventEmitter) {
        this.config = config || { default: 'default', connections: {} };
        this.factory = factory || new ConnectionFactory();
        this.dispatcher = dispatcher || new EventEmitter();
    }

    /**
     * Get a database connection instance.
     */
    public connection(name?: string): DriverConnectionI {
        const [database, type] = this.parseConnectionName(name);

        name = name || database;

        // If we haven't created this connection, we'll create it based on the config
        // provided in the application. Once we've created the connections we will
        // set the "fetch mode" for PDO which determines the query return types.
        if (!(name in this.connection)) {
            this.connections[name] = this.configure(this.makeConnection(database), type);
        }

        return this.connections[name];
    }

    /**
     * Register a connection with the manager.
     */
    public addConnection(config: DriverConfig, name = 'default'): this {
        this.config.connections[name] = config;

        return this;
    }

    /**
     * Parse the connection into an array of the name and read / write type.
     */
    protected parseConnectionName(name?: string): [string, ReadWriteType | null] {
        name = name || this.getDefaultConnection();

        if (name.endsWith('::read') || name.endsWith('::write')) {
            const exploded = name.split('::');
            const type = exploded.pop() as ReadWriteType;
            const database = exploded.join('::');
            return [database, type];
        }
        return [name, null];
    }

    /**
     * Make the database connection instance.
     */
    protected makeConnection(name: string): DriverConnectionI {
        const config = this.configuration(name);

        // First we will check by the connection name to see if an extension has been
        // registered specifically for that connection. If it has we will call the
        // Closure and pass it the config allowing it to resolve the connection.
        if (name in this.extensions) {
            return this.extensions[name](config, name);
        }

        // Next we will check to see if an extension has been registered for a driver
        // and will call the Closure if so, which allows us to have a more generic
        // resolver for the drivers themselves which applies to all connections.
        const driver = config.driver;
        if (driver in this.extensions) {
            return this.extensions[driver](config, name);
        }

        return this.factory.make(config, name);
    }

    /**
     * Get the configuration for a connection.
     */
    protected configuration(name: string): ConnectionConfig {
        // To get the database connection configuration, we will just pull each of the
        // connection configurations and get the configurations for the given name.
        // If the configuration doesn't exist, we'll throw an exception and bail.
        const connections = this.config.connections;

        if (!(name in connections)) {
            throw new Error(`Database connection [${name}] not configured.`);
        }

        return connections[name];
    }

    /**
     * Prepare the database connection instance.
     */
    protected configure(connection: DriverConnectionI, type: ReadWriteType | null): DriverConnectionI {
        connection = this.setPdoForType(connection, type).setReadWriteType(type);

        // First we'll set the fetch mode and a few other dependencies of the database
        // connection. This method basically just configures and prepares it to get
        // used by the application. Once we're finished we'll return it back out.
        connection.setEventDispatcher(this.dispatcher);

        return connection;
    }

    /**
     * Prepare the read / write mode for database connection instance.
     */
    protected setPdoForType(connection: DriverConnectionI, type: ReadWriteType | null): DriverConnectionI {
        if (type === 'read') {
            connection.setPdo(connection.getReadPdo());
        } else if (type === 'write') {
            connection.setReadPdo(connection.getPdo());
        }

        return connection;
    }

    /**
     * Get a new raw query expression.
     */
    public raw(value: string | bigint | number): ExpressionContract {
        return raw(value);
    }

    /**
     * Disconnect from the given database and remove from local cache.
     */
    public async purge(name?: string): Promise<void> {
        name = name || this.getDefaultConnection();

        await this.disconnect(name);
        delete this.connections[name];
    }

    /**
     * Disconnect from the given database.
     */
    public async disconnect(name?: string): Promise<void> {
        name = name || this.getDefaultConnection();
        if (name in this.connections) {
            await this.connections[name].disconnect();
        }
    }

    /**
     * Reconnect to the given database.
     */
    public async reconnect(name?: string): Promise<DriverConnectionI> {
        name = name || this.getDefaultConnection();

        await this.disconnect(name);

        if (!(name in this.connections)) {
            return this.connection(name);
        }

        return this.connections[name].reconnect();
    }

    /**
     * Get the default connection name.
     */
    public getDefaultConnection(): string {
        return this.config.default;
    }

    /**
     * Set the default connection name.
     */
    public setDefaultConnection(name: string): void {
        this.config.default = name;
    }

    /**
     * Get all of the support drivers.
     */
    public supportedDrivers(): string[] {
        return ['mysql', 'mariadb', 'pgsql', 'sqlite', 'sqlsrv'];
    }

    /**
     * Get all of the drivers that are actually available.
     */
    public availableDrivers(): string[] {
        return this.supportedDrivers().filter(value => Pdo.getAvailableDrivers().includes(value));
    }

    /**
     * Register an extension connection resolver.
     */
    public extend(name: string, resolver: Extension): void {
        this.extensions[name] = resolver;
    }

    /**
     * Remove an extension connection resolver.
     */
    public forgetExtension(name: string): void {
        delete this.extensions[name];
    }

    /**
     * Return all of the created connections.
     */
    public getConnections(): { [key: string]: DriverConnectionI } {
        return this.connections;
    }
}

export default DatabaseManager;
