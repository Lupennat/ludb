import get from 'get-value';
import { Pdo, PdoPreparedStatementI, PdoTransactionPreparedStatementI } from 'lupdo';
import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import EventEmitter from 'node:events';
import { bindTo } from '../bindings';
import QueryExecuted from '../events/query-executed';
import ExpressionContract from '../query/expression-contract';
import Grammar from '../query/grammars/grammar';
import SchemaGrammar from '../schema/grammars/grammar';
import BindToI from '../types/bind-to';
import DatabaseConfig, { DatabaseConnectionOptions, ReadWriteType } from '../types/config';
import DriverConnectionI, { BeforeExecutingCallback, ConnectionSessionI, LoggedQuery } from '../types/connection';
import ConnectorI from '../types/connector';
import { Binding, BindingExclude, BindingExcludeObject, BindingObject, Stringable } from '../types/generics';
import { QueryAbleCallback } from '../types/query/grammar-builder';
import QueryBuilderI from '../types/query/query-builder';
import SchemaBuilderI from '../types/schema/builder/schema-builder';
import { merge, raw } from '../utils';
import ConnectionSession from './connection-session';

abstract class Connection<Config extends DatabaseConfig = DatabaseConfig> implements DriverConnectionI {
    /**
     * The active PDO connection used for reads.
     */
    protected readPdo: Pdo | null = null;

    /**
     * The active PDO connection used.
     */
    protected pdo!: Pdo;

    /**
     * The active Schema PDO connection used.
     */
    protected schemaPdo!: Pdo;

    /**
     * The event dispatcher instance.
     */
    protected dispatcher?: EventEmitter;

    /**
     * All of the callbacks that should be invoked before a query is executed.
     */
    protected beforeExecutingCallbacks: BeforeExecutingCallback[] = [];

    /**
     * the connection table prefix
     */
    protected tablePrefix: string;

    /**
     * the connection database
     */
    protected database: string;

    /**
     * Create a new database connection instance.
     */
    public constructor(protected name: string, protected config: Config) {
        this.config.prefix = this.config.prefix || '';
        this.config.database = this.config.database || '';
        this.tablePrefix = this.config.prefix;
        this.database = this.config.database;
        this.setDefaultQueryGrammar();
        this.setDefaultSchemaGrammar();
        if ('read' in this.config || 'write' in this.config) {
            this.createReadWriteConnection();
        } else {
            this.createSingleConnection(this.config);
        }
    }

    /**
     * create Connector
     */
    protected abstract createConnector(): ConnectorI;

    /**
     * set Default Query Grammar
     */
    protected abstract setDefaultQueryGrammar(): void;

    /**
     * set Default Schema Grammar
     */
    protected abstract setDefaultSchemaGrammar(): void;

    /**
     * Get a schema builder instance for the connection.
     */
    public abstract getSchemaBuilder(): SchemaBuilderI<ConnectionSessionI<DriverConnectionI>>;

    /**
     * Get the schema grammar used by the connection.
     */
    public abstract getSchemaGrammar(): SchemaGrammar;

    /**
     * Get the query grammar used by the connection.
     */
    public abstract getQueryGrammar(): Grammar;

    /**
     * Create a single database connection instance.
     */
    protected createSingleConnection(config: DatabaseConfig): void {
        this.pdo = this.createPdoResolver(config);
        this.schemaPdo = this.createPdoSchemaResolver(config);
    }

    /**
     * Create a read / write database connection instance.
     */
    protected createReadWriteConnection(): void {
        this.createSingleConnection(this.getWriteConfig());
        this.readPdo = this.createReadPdo();
    }

    /**
     * Create a new PDO instance for reading.
     */
    protected createReadPdo(): Pdo {
        return this.createPdoResolver(this.getReadConfig());
    }

    /**
     * Get the read configuration for a read / write connection.
     */
    protected getReadConfig(): DatabaseConfig {
        return this.mergeReadWriteConfig(this.getReadWriteConfig('read'));
    }

    /**
     * Get the write configuration for a read / write connection.
     */
    protected getWriteConfig(): DatabaseConfig {
        return this.mergeReadWriteConfig(this.getReadWriteConfig('write'));
    }

    /**
     * Get a read / write level configuration.
     */
    protected getReadWriteConfig(type: ReadWriteType): DatabaseConnectionOptions | undefined {
        if (type in this.config) {
            const options = { ...this.config[type] };
            if (Array.isArray(options)) {
                return options[Math.floor(Math.random() * options.length)];
            } else {
                return options;
            }
        }
        return undefined;
    }

    /**
     * Merge a configuration for a read / write connection.
     */
    protected mergeReadWriteConfig(toMerge?: DatabaseConnectionOptions): DatabaseConfig {
        const merged = merge<DatabaseConfig>(this.config, toMerge ?? {});
        delete merged.read;
        delete merged.write;

        return merged;
    }

    /**
     * Create a new PDO instance for Schema.
     */
    protected createPdoSchemaResolver(config: DatabaseConfig): Pdo {
        return this.createConnector().connect(
            Object.assign({}, config, {
                pool: { min: 0, max: 1 }
            })
        );
    }

    /**
     * Create a new PDO instance.
     */
    protected createPdoResolver(config: DatabaseConfig): Pdo {
        return this.createConnector().connect(config);
    }

    /**
     * Start Connection session for QueryBuilder
     */
    public session(): ConnectionSessionI<this> {
        return new ConnectionSession(this);
    }

    /**
     * Start Connection session for SchemaBuilder
     */
    public sessionSchema(): ConnectionSessionI<this> {
        return new ConnectionSession(this, true);
    }

    /**
     * Bind values to their parameters in the given statement.
     */
    public bindValues(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): void {
        if (Array.isArray(bindings)) {
            for (let x = 0; x < bindings.length; x++) {
                this.bindValue(statement, x + 1, bindings[x]);
            }
        } else {
            for (const key in bindings) {
                this.bindValue(statement, key, bindings[key]);
            }
        }
    }

    /**
     * Bind value to their parameter in the given statement.
     */
    protected bindValue(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI,
        key: string | number,
        binding: BindingExclude<ExpressionContract>
    ): void {
        if (binding instanceof ExpressionContract) {
            throw new Error('Expression binding can not be binded directly to statement.');
        }
        statement.bindValue(key, binding);
    }

    /**
     * Prepare the query bindings for execution.
     */
    public prepareBindings(
        bindings: Binding[] | BindingObject
    ): BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract> {
        if (Array.isArray(bindings)) {
            return bindings.map(binding => {
                return this.prepareBinding(binding);
            });
        } else {
            return Object.keys(bindings).reduce((carry: BindingExcludeObject<ExpressionContract>, key) => {
                carry[key] = this.prepareBinding(bindings[key]);
                return carry;
            }, {});
        }
    }

    protected prepareBinding(binding: Binding): BindingExclude<ExpressionContract> {
        if (this.getQueryGrammar().isExpression(binding)) {
            return this.getQueryGrammar().getValue(binding).toString();
        }

        return binding;
    }

    /**
     * Reconnect to the database.
     */
    public async reconnect(): Promise<this> {
        const promises = [this.getPdo().reconnect(), this.getSchemaPdo().reconnect()];
        if (this.readPdo !== null) {
            promises.push(this.getReadPdo().reconnect());
        }
        await Promise.all(promises);
        return this;
    }

    /**
     * Disconnect from the underlying PDO connection.
     */
    public async disconnect(): Promise<void> {
        const promises = [this.getPdo().disconnect(), this.getSchemaPdo().disconnect()];
        if (this.readPdo !== null) {
            promises.push(this.getReadPdo().disconnect());
        }
        await Promise.all(promises);
    }

    /**
     * Register a hook to be run just before a database query is executed.
     */
    public beforeExecuting(callback: BeforeExecutingCallback): this {
        this.beforeExecutingCallbacks.push(callback);

        return this;
    }

    /**
     * Return all hook to be run just before a database query is executed.
     */
    public getBeforeExecuting(): BeforeExecutingCallback[] {
        return this.beforeExecutingCallbacks;
    }

    /**
     * Register a database query listener with the connection.
     */
    public listen(callback: (event: QueryExecuted) => void | Promise<void>): void {
        this.dispatcher?.on(QueryExecuted.eventName, callback);
    }

    /**
     * Remove a database query listener with the connection.
     */
    public unlisten(callback: (event: QueryExecuted) => void | Promise<void>): void {
        this.dispatcher?.off(QueryExecuted.eventName, callback);
    }

    /**
     * Get the current Schema PDO connection.
     */
    public getSchemaPdo(): Pdo {
        return this.schemaPdo;
    }

    /**
     * Get the current PDO connection.
     */
    public getPdo(): Pdo {
        return this.pdo;
    }

    /**
     * Get the current PDO connection used for reading.
     */
    public getReadPdo(): Pdo {
        return this.readPdo || this.getPdo();
    }

    /**
     * Set the PDO connection.
     */
    public setPdo(pdo: Pdo): this {
        this.pdo = pdo;

        return this;
    }

    /**
     * Set the Schema PDO connection.
     */
    public setSchemaPdo(pdo: Pdo): this {
        this.schemaPdo = pdo;

        return this;
    }

    /**
     * Set the PDO connection used for reading.
     */
    public setReadPdo(pdo: Pdo): this {
        this.readPdo = pdo;

        return this;
    }

    /**
     * Get the database connection name.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get an option from the configuration options.
     */
    /**
     * Get an option from the configuration options.
     */
    public getConfig(): Config;
    public getConfig<T>(option?: string, defaultValue?: T): T;
    public getConfig<T>(option?: string, defaultValue?: T): Config {
        if (option == null) {
            return this.config;
        }

        return get(this.config, option as string) ?? defaultValue;
    }

    /**
     * Get the event dispatcher used by the connection.
     */
    public getEventDispatcher(): EventEmitter | undefined {
        return this.dispatcher;
    }

    /**
     * Set the event dispatcher instance on the connection.
     */
    public setEventDispatcher(dispatcher: EventEmitter): this {
        this.dispatcher = dispatcher;

        return this;
    }

    /**
     * Unset the event dispatcher for this connection.
     */
    public unsetEventDispatcher(): this {
        this.dispatcher = undefined;

        return this;
    }

    /**
     * Get the name of the connected database.
     */
    public getDatabaseName(): string {
        return this.database;
    }

    /**
     * Get the table prefix for the connection.
     */
    public getTablePrefix(): string {
        return this.tablePrefix;
    }

    /**
     * Begin a fluent query against a database table.
     */
    public table(table: QueryAbleCallback<QueryBuilderI> | QueryBuilderI | Stringable, as?: string): QueryBuilderI {
        return this.session().table(table, as);
    }

    /**
     * Get a new query builder instance.
     */
    public query(): QueryBuilderI {
        return this.session().query();
    }

    /**
     * Run a select statement and return a single result.
     */
    public async selectOne<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T | null> {
        return this.session().selectOne<T>(query, bindings, useReadPdo);
    }

    /**
     * Run a select statement and return the first column of the first row.
     */
    public async scalar<T>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T | null> {
        return this.session().scalar<T>(query, bindings, useReadPdo);
    }

    /**
     * Run a select statement against the database.
     */
    public async select<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T[]> {
        return this.session().select<T>(query, bindings, useReadPdo);
    }

    /**
     * Run a select statement against the database.
     */
    public async selectResultSets<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T[][]> {
        return this.session().selectResultSets<T>(query, bindings, useReadPdo);
    }

    /**
     * Run a select statement against the database.
     */
    public async selectColumn<T extends PdoColumnValue>(
        column: number,
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T[]> {
        return this.session().selectColumn<T>(column, query, bindings, useReadPdo);
    }

    /**
     * Run a select statement against the database.
     */
    public async selectFromWriteConnection<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject
    ): Promise<T[]> {
        return this.session().selectFromWriteConnection<T>(query, bindings);
    }

    /**
     * Run a select statement against the database and returns a generator.
     */
    public async cursor<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<Generator<T>> {
        return this.session().cursor<T>(query, bindings, useReadPdo);
    }

    /**
     * Run an insert statement against the database.
     */
    public async insert(query: string, bindings?: Binding[] | BindingObject): Promise<boolean> {
        return this.session().insert(query, bindings);
    }

    /**
     * Run an insert statement get id against the database.
     */
    public async insertGetId<T = number | bigint | string>(
        query: string,
        bindings?: Binding[] | BindingObject,
        sequence?: string | null
    ): Promise<T | null> {
        return this.session().insertGetId(query, bindings, sequence);
    }

    /**
     * Run an update statement against the databasxe.
     */
    public async update(query: string, bindings?: Binding[] | BindingObject): Promise<number> {
        return this.session().update(query, bindings);
    }

    /**
     * Run a delete statement against the database.
     */
    public async delete(query: string, bindings?: Binding[] | BindingObject): Promise<number> {
        return this.session().delete(query, bindings);
    }

    /**
     * Execute an SQL statement and return the boolean result.
     */
    public async statement(query: string, bindings?: Binding[] | BindingObject): Promise<boolean> {
        return this.session().statement(query, bindings);
    }

    /**
     * Run an SQL statement and get the number of rows affected.
     */
    public async affectingStatement(query: string, bindings?: Binding[] | BindingObject): Promise<number> {
        return this.session().affectingStatement(query, bindings);
    }

    /**
     * Run a raw, unprepared query against the PDO connection.
     */
    public async unprepared(query: string): Promise<boolean> {
        return this.session().unprepared(query);
    }

    /**
     * Execute the given callback in "dry run" mode.
     */
    public async pretend(
        callback: (session: ConnectionSessionI<this>) => void | Promise<void>
    ): Promise<LoggedQuery[]> {
        return this.session().pretend(callback);
    }

    /**
     * Execute a Closure within a transaction.
     */
    public async transaction(
        callback: (session: ConnectionSessionI<this>) => void | Promise<void>,
        attempts?: number
    ): Promise<void> {
        return this.session().transaction(callback, attempts);
    }

    /**
     * Start a new database transaction.
     */
    public async beginTransaction(): Promise<ConnectionSessionI<this>> {
        return this.session().beginTransaction();
    }

    /**
     * Indicate that the connection should use the write PDO connection for reads.
     */
    public useWriteConnectionWhenReading(value?: boolean): ConnectionSessionI<this> {
        return this.session().useWriteConnectionWhenReading(value);
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

export default Connection;
