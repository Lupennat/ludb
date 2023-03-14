import get from 'get-value';
import { Pdo, PdoPreparedStatementI, PdoTransactionPreparedStatementI } from 'lupdo';
import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import EventEmitter from 'node:events';
import { bindTo } from '../bindings';
import QueryExecuted from '../events/query-executed';
import ExpressionContract from '../query/expression-contract';
import Grammar from '../query/grammars/grammar';
import SchemaBuilder from '../schema/builders/builder';
import SchemaGrammar from '../schema/grammars/grammar';
import { BindToI } from '../types';
import { DriverFLattedConfig, FlattedConnectionConfig, ReadWriteType } from '../types/config';
import DriverConnectionI, {
    BeforeExecutingCallback,
    ConnectionResolver,
    ConnectionSessionI,
    LoggedQuery,
    PretendingCallback,
    QueryExecutedCallback,
    TransactionCallback
} from '../types/connection';
import BuilderI, {
    Binding,
    BindingObject,
    NotExpressionBinding,
    NotExpressionBindingObject,
    SubQuery
} from '../types/query/builder';
import GrammarI from '../types/query/grammar';
import SchemaBuilderI from '../types/schema/builder';
import SchemaGrammarI from '../types/schema/grammar';
import { raw } from '../utils';
import ConnectionSession from './connection-session';

class Connection implements DriverConnectionI {
    /**
     * The active PDO connection used for reads.
     */
    protected readPdo: Pdo | null = null;

    /**
     * The type of the connection.
     */
    protected readWriteType: ReadWriteType | null = null;

    /**
     * The query grammar implementation.
     */
    protected queryGrammar!: GrammarI;

    /**
     * The schema grammar implementation.
     */
    protected schemaGrammar!: SchemaGrammarI;

    /**
     * The event dispatcher instance.
     */
    protected dispatcher?: EventEmitter;

    /**
     * All of the callbacks that should be invoked before a query is executed.
     */
    protected beforeExecutingCallbacks: BeforeExecutingCallback[] = [];

    /**
     * The connection resolvers.
     */
    protected static resolvers: { [key: string]: ConnectionResolver } = {};

    /**
     * Create a new database connection instance.
     */
    public constructor(
        protected pdo: Pdo,
        protected schemaPdo: Pdo,
        protected config: DriverFLattedConfig,
        protected database: string,
        protected tablePrefix: string
    ) {
        // We need to initialize a query grammar and the schema grammar
        // which are both very important parts of the database abstractions
        // so we initialize these to their default values while starting.
        this.useDefaultQueryGrammar().useDefaultSchemaGrammar();
    }

    /**
     * Start Connection session for Builder
     */
    public session(): ConnectionSessionI {
        return new ConnectionSession(this);
    }

    /**
     * Start Connection session for SchemaBuilder
     */
    public sessionSchema(): ConnectionSessionI {
        return new ConnectionSession(this, true);
    }

    /**
     * Set the query grammar to the default implementation.
     */
    public useDefaultQueryGrammar(): this {
        this.queryGrammar = this.getDefaultQueryGrammar();
        return this;
    }

    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): GrammarI {
        return new Grammar();
    }

    /**
     * Set the schema grammar to the default implementation.
     */
    public useDefaultSchemaGrammar(): this {
        this.schemaGrammar = this.getDefaultSchemaGrammar();
        return this;
    }

    /**
     * Get the default schema grammar instance.
     */
    protected getDefaultSchemaGrammar(): SchemaGrammarI {
        return new SchemaGrammar();
    }

    /**
     * Get a schema builder instance for the connection.
     */
    public getSchemaBuilder(): SchemaBuilderI {
        return new SchemaBuilder(this.sessionSchema());
    }

    /**
     * Bind values to their parameters in the given statement.
     */
    public bindValues(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI,
        bindings: NotExpressionBinding[] | NotExpressionBindingObject
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
        binding: NotExpressionBinding
    ): void {
        if (binding instanceof ExpressionContract) {
            throw new Error('Expression binding can not be binded directly to statement.');
        }
        statement.bindValue(key, binding);
    }

    /**
     * Prepare the query bindings for execution.
     */
    public prepareBindings(bindings: Binding[] | BindingObject): NotExpressionBinding[] | NotExpressionBindingObject {
        if (Array.isArray(bindings)) {
            return bindings.map(binding => {
                return this.prepareBinding(binding);
            });
        } else {
            return Object.keys(bindings).reduce((carry: NotExpressionBindingObject, key) => {
                carry[key] = this.prepareBinding(bindings[key]);
                return carry;
            }, {});
        }
    }

    protected prepareBinding(binding: Binding): NotExpressionBinding {
        if (this.queryGrammar.isExpression(binding)) {
            return this.queryGrammar.getValue(binding).toString();
        }

        return binding;
    }

    /**
     * Reconnect to the database.
     */
    public async reconnect(): Promise<this> {
        const promises = [this.pdo.reconnect(), this.schemaPdo.reconnect()];
        if (this.readPdo !== null) {
            promises.push(this.readPdo.reconnect());
        }
        await Promise.all(promises);
        return this;
    }

    /**
     * Disconnect from the underlying PDO connection.
     */
    public async disconnect(): Promise<void> {
        const promises = [this.pdo.disconnect(), this.schemaPdo.disconnect()];
        if (this.readPdo !== null) {
            promises.push(this.readPdo.disconnect());
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
    public listen(callback: QueryExecutedCallback): void {
        this.dispatcher?.on(QueryExecuted.eventName, callback);
    }

    /**
     * Remove a database query listener with the connection.
     */
    public unlisten(callback: QueryExecutedCallback): void {
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
        return this.getConfig<string>('name');
    }

    /**
     * Get the database connection full name.
     */
    public getNameWithReadWriteType(): string {
        return `${this.getName()}${this.readWriteType ? '::' + this.readWriteType : ''}`;
    }

    /**
     * Get an option from the configuration options.
     */
    public getConfig<T extends FlattedConnectionConfig>(): T;
    public getConfig<T>(option?: string, defaultValue?: T): T;
    public getConfig<T>(option?: string, defaultValue?: T): T {
        if (option == null) {
            return this.config as T;
        }
        return (get(this.config, option) ?? defaultValue) as T;
    }

    /**
     * Get the PDO driver name.
     */
    public getDriverName(): string {
        return this.getConfig<string>('driver');
    }

    /**
     * Get the query grammar used by the connection.
     */
    public getQueryGrammar(): GrammarI {
        return this.queryGrammar;
    }

    /**
     * Set the query grammar used by the connection.
     */
    public setQueryGrammar(grammar: GrammarI): this {
        this.queryGrammar = grammar;

        return this;
    }

    /**
     * Get the schema grammar used by the connection.
     */
    public getSchemaGrammar(): SchemaGrammarI {
        return this.schemaGrammar;
    }

    /**
     * Set the schema grammar used by the connection.
     */
    public setSchemaGrammar(grammar: SchemaGrammarI): this {
        this.schemaGrammar = grammar;

        return this;
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
     * Set the name of the connected database.
     */
    public setDatabaseName(database: string): this {
        this.database = database;

        return this;
    }

    /**
     * Set the read / write type of the connection.
     */
    public setReadWriteType(readWriteType: ReadWriteType | null): this {
        this.readWriteType = readWriteType;

        return this;
    }

    /**
     * Get the table prefix for the connection.
     */
    public getTablePrefix(): string {
        return this.tablePrefix;
    }

    /**
     * Set the table prefix in use by the connection.
     */
    public setTablePrefix(prefix: string): this {
        this.tablePrefix = prefix;

        this.getQueryGrammar().setTablePrefix(prefix);

        return this;
    }

    /**
     * Set the table prefix and return the grammar.
     */
    public withTablePrefix<T extends GrammarI>(grammar: T): T {
        grammar.setTablePrefix(this.tablePrefix);

        return grammar;
    }

    /**
     * Register a connection resolver.
     */
    public static resolverFor(driver: string, callback: ConnectionResolver): void {
        Connection.resolvers[driver] = callback;
    }

    /**
     * Get the connection resolver for the given driver.
     */
    public static getResolver(driver: string): ConnectionResolver | null {
        return driver in Connection.resolvers ? Connection.resolvers[driver] : null;
    }

    /**
     * Begin a fluent query against a database table.
     */
    public table(table: SubQuery<BuilderI>, as?: string): BuilderI {
        return this.session().table(table, as);
    }

    /**
     * Get a new query builder instance.
     */
    public query(): BuilderI {
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
    public async pretend(callback: PretendingCallback): Promise<LoggedQuery[]> {
        return this.session().pretend(callback);
    }

    /**
     * Execute a Closure within a transaction.
     */
    public async transaction(callback: TransactionCallback, attempts?: number): Promise<void> {
        return this.session().transaction(callback, attempts);
    }

    /**
     * Start a new database transaction.
     */
    public async beginTransaction(): Promise<ConnectionSessionI> {
        return this.session().beginTransaction();
    }

    /**
     * Indicate that the connection should use the write PDO connection for reads.
     */
    public useWriteConnectionWhenReading(value?: boolean): ConnectionSessionI {
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
