import { Pdo } from 'lupdo';
import { EventEmitter } from 'stream';
import { bindTo } from './bindings';
import CacheManager from './cache-manager';
import MysqlConnection from './connections/mysql-connection';
import PostgresConnection from './connections/postgres-connection';
import SqliteConnection from './connections/sqlite-connection';
import SqlserverConnection from './connections/sqlserver-connection';
import ExpressionContract from './query/expression-contract';
import BindToI from './types/bind-to';
import DriverConnectionI from './types/connection';
import { DBConfig, ExtractConnection } from './types/database-manager';
import { raw } from './utils';

class DatabaseManager<const Config extends DBConfig> {
    /**
     * The active connection instances.
     */
    protected connections: Record<string, DriverConnectionI> = {};

    /**
     * The event dispatcher instance.
     */
    protected dispatcher: EventEmitter;

    /**
     * The cache manager instance.
     */
    protected cacheManager: CacheManager;

    constructor(
        protected config: Config,
        dispatcher?: EventEmitter
    ) {
        this.dispatcher = dispatcher || new EventEmitter();
        this.cacheManager = new CacheManager(config);
    }

    public connection<const T extends keyof Config['connections'] & string>(
        name: T
    ): ExtractConnection<Config['connections'][T]> {
        if (!(name in this.connections)) {
            this.connections[name] = this.createConnection(name);
        }
        return this.connections[name] as ExtractConnection<Config['connections'][T]>;
    }

    protected loadDriver(driver: string): void {
        switch (driver) {
            case 'mysql':
                require('lupdo-mysql');
                break;
            case 'sqlite':
                require('lupdo-sqlite');
                break;
            case 'pgsql':
                require('lupdo-postgres');
                break;
            case 'sqlsrv':
                require('lupdo-mssql');
                break;
            default:
                throw new Error('unsupported lupdo driver');
        }
    }

    protected createConnection<const T extends keyof Config['connections'] & string>(name: T): any {
        const config = this.config.connections[name];
        const driver = config.driver;

        if (!this.availableDrivers().includes(driver)) {
            try {
                this.loadDriver(driver);
            } catch (error) {
                throw new Error(`Lupdo driver is missing, please install driver for "${driver}"`);
            }
        }

        switch (driver) {
            case 'mysql':
                return this.configure(new MysqlConnection(name, config));
            case 'sqlite':
                return this.configure(new SqliteConnection(name, config));
            case 'pgsql':
                return this.configure(new PostgresConnection(name, config));
            case 'sqlsrv':
                return this.configure(new SqlserverConnection(name, config));
        }
    }

    protected configure<T extends DriverConnectionI>(connection: T): T {
        return connection.setEventDispatcher(this.dispatcher).setCacheManager(this.cacheManager);
    }

    /**
     * Disconnect from the given database and remove from local cache.
     */
    public async purge<const T extends keyof Config['connections'] & string>(name: T): Promise<void> {
        await this.disconnect(name);
        delete this.connections[name];
    }

    /**
     * Disconnect from the given database.
     */
    public async disconnect<const T extends keyof Config['connections'] & string>(name: T): Promise<void> {
        if (name in this.connections) {
            await this.connections[name].disconnect();
        }
    }

    /**
     * Reconnect to the given database.
     */
    public async reconnect<const T extends keyof Config['connections'] & string>(
        name: T
    ): Promise<ExtractConnection<Config['connections'][T]>> {
        await this.disconnect(name);

        if (!(name in this.connections)) {
            return this.connection(name);
        }

        return this.connections[name].reconnect() as Promise<ExtractConnection<Config['connections'][T]>>;
    }

    /**
     * Return all of the created connections.
     */
    public getConnections(): Record<string, DriverConnectionI> {
        return this.connections;
    }

    /**
     * Get all of the support drivers.
     */
    public supportedDrivers(): string[] {
        return ['mysql', 'pgsql', 'sqlite', 'sqlsrv'];
    }

    /**
     * Get all of the drivers that are actually available.
     */
    public availableDrivers(): string[] {
        const pdoDrivers = Pdo.getAvailableDrivers();
        return this.supportedDrivers().filter(value => pdoDrivers.includes(value));
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

    /**
     * Return all of the created connections.
     */
    public async terminate(): Promise<void> {
        const promises = [];
        for (const name in this.connections) {
            promises.push(this.connections[name].disconnect());
        }

        await Promise.allSettled(promises);
        await this.cacheManager.terminate();
    }
}

export default DatabaseManager;
