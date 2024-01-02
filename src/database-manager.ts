import EventEmitter from 'node:events';
import { bindTo } from './bindings';
import ConnectionFactory from './connectors/connection-factory';
import ExpressionContract from './query/expression-contract';
import BindToI from './types/bind-to';
import DatabaseConnections, { DatabaseConnectionsDrivers } from './types/config';
import DriverConnectionI from './types/connection';
import { raw } from './utils';

class DatabaseManager<T extends DatabaseConnections = DatabaseConnections> {
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
    public connections: { [key in keyof T]: DatabaseConnectionsDrivers[T[key]['driver']] };

    /**
     * Create a new database manager instance.
     */
    constructor(protected config: T, dispatcher?: EventEmitter, factory?: ConnectionFactory) {
        this.factory = factory || new ConnectionFactory();
        this.dispatcher = dispatcher || new EventEmitter();
        this.connections = {} as { [key in keyof T]: DatabaseConnectionsDrivers[T[key]['driver']] };
        for (const key in this.config) {
            this.connections[key] = this.initializeConnections(
                key as keyof DatabaseConnectionsDrivers
            ) as DatabaseConnectionsDrivers[T[Extract<keyof T, string>]['driver']];
        }
    }

    /**
     * initialize a database connection instance.
     */
    public initializeConnections(name: string): DriverConnectionI {
        return this.configure(this.makeConnection(name));
    }

    /**
     * Make the database connection instance.
     */
    protected makeConnection(name: string): DriverConnectionI {
        return this.factory.make(this.config[name], name);
    }

    /**
     * Prepare the database connection instance.
     */
    protected configure(connection: DriverConnectionI): DriverConnectionI {
        // First we'll set the fetch mode and a few other dependencies of the database
        // connection. This method basically just configures and prepares it to get
        // used by the application. Once we're finished we'll return it back out.
        return connection.setEventDispatcher(this.dispatcher);
    }

    /**
     * Get a new raw query expression.
     */
    public raw(value: string | bigint | number): ExpressionContract {
        return raw(value);
    }

    /**
     * Get the bind to object.
     */
    public get bindTo(): BindToI {
        return bindTo;
    }
}

export default DatabaseManager;
