import { Pdo, PdoPreparedStatementI, PdoTransactionI, PdoTransactionPreparedStatementI } from 'lupdo';
import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import EventEmitter from 'node:events';
import QueryExecuted from '../events/query-executed';
import { Grammar } from '../query';
import ExpressionContract from '../query/expression-contract';
import { SchemaGrammar } from '../schema';
import BindToI from './bind-to';
import DatabaseConfig from './config';
import { Binding, BindingExclude, BindingExcludeObject, BindingObject, Stringable } from './generics';
import { QueryAbleCallback } from './query/grammar-builder';
import QueryBuilderI from './query/query-builder';
import SchemaBuilderI from './schema/builder/schema-builder';

export type BeforeExecutingCallback = (
    query: string,
    bindings: Binding[] | BindingObject,
    connection: unknown
) => void | Promise<void>;

export interface LoggedQuery {
    query: string;
    bindings: Binding[] | BindingObject;
}

interface BaseConnection {
    /**
     * Begin a fluent query against a database table.
     */
    table(table: QueryAbleCallback<QueryBuilderI> | QueryBuilderI | Stringable, as?: string): QueryBuilderI;

    /**
     * Get a new query builder instance.
     */
    query(): QueryBuilderI;

    /**
     * Run a select statement and return a single result.
     */
    selectOne<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T | null>;

    /**
     * Run a select statement and return the first column of the first row.
     */
    scalar<T>(query: string, bindings?: Binding[] | BindingObject, useReadPdo?: boolean): Promise<T | null>;

    /**
     * Run a select statement against the database.
     */
    selectFromWriteConnection<T = Dictionary>(query: string, bindings?: Binding[] | BindingObject): Promise<T[]>;

    /**
     * Run a select statement against the database.
     */
    select<T = Dictionary>(query: string, bindings?: Binding[] | BindingObject, useReadPdo?: boolean): Promise<T[]>;

    /**
     * Run a select statement against the database.
     */
    selectResultSets<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T[][]>;

    /**
     * Run a select statement against the database and get Column.
     */
    selectColumn<T extends PdoColumnValue>(
        column: number,
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T[]>;

    /**
     * Run a select statement against the database and returns a generator.
     */
    cursor<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<Generator<T>>;

    /**
     * Run an insert statement against the database.
     */
    insert(query: string, bindings?: Binding[] | BindingObject): Promise<boolean>;

    /**
     * Run an insert get id statement against the database.
     */
    insertGetId<T = number | bigint | string>(
        query: string,
        bindings?: Binding[] | BindingObject,
        sequence?: Stringable | null
    ): Promise<T | null>;

    /**
     * Run an update statement against the database.
     */
    update(query: string, bindings?: Binding[] | BindingObject): Promise<number>;

    /**
     * Run a delete statement against the database.
     */
    delete(query: string, bindings?: Binding[] | BindingObject): Promise<number>;

    /**
     * Execute an SQL statement and return the boolean result.
     */
    statement(query: string, bindings?: Binding[] | BindingObject): Promise<boolean>;

    /**
     * Run an SQL statement and get the number of rows affected.
     */
    affectingStatement(query: string, bindings?: Binding[] | BindingObject): Promise<number>;

    /**
     * Run a raw, unprepared query against the PDO connection.
     */
    unprepared(query: string): Promise<boolean>;

    /**
     * Bind values to their parameters in the given statement.
     */
    bindValues(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): void;

    /**
     * Prepare the query bindings for execution.
     */
    prepareBindings(
        bindings: Binding[] | BindingObject
    ): BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>;

    /**
     * Get the current Schema PDO connection.
     */
    getSchemaPdo(): Pdo;

    /**
     * Get the current PDO connection.
     */
    getPdo(): Pdo | PdoTransactionI;

    /**
     * Get the current PDO connection used for reading.
     */
    getReadPdo(): Pdo | PdoTransactionI;

    /**
     * Get the database connection name.
     */
    getName(): string;

    /**
     * Return all hook to be run just before a database query is executed.
     */
    getBeforeExecuting(): BeforeExecutingCallback[];

    /**
     * Get an option from the configuration options.
     */
    getConfig<T extends DatabaseConfig>(): T;
    getConfig<T>(option?: string, defaultValue?: T): T;
    getConfig<T>(option?: string, defaultValue?: T): T;

    /**
     * Get the event dispatcher used by the connection.
     */
    getEventDispatcher(): EventEmitter | undefined;

    /**
     * Get the name of the connected database.
     */
    getDatabaseName(): string;

    /**
     * Get the table prefix for the connection.
     */
    getTablePrefix(): string;

    /**
     * Get a new raw query expression.
     */
    raw(value: string | bigint | number): ExpressionContract;

    /**
     * Get the bind to object.
     */
    get bindTo(): BindToI;
}

export default interface DriverConnectionI extends BaseConnection {
    /**
     * Get the current PDO connection.
     */
    getPdo(): Pdo;

    /**
     * Get the current PDO connection used for reading.
     */
    getReadPdo(): Pdo;

    /**
     * Start Connection session for QueryBuilder
     */
    session(): ConnectionSessionI<DriverConnectionI>;

    /**
     * Start Connection session for SchemaBuilder
     */
    sessionSchema(): ConnectionSessionI<DriverConnectionI>;

    /**
     * Reconnect to the database.
     */
    reconnect(): Promise<this>;

    /**
     * Disconnect from the underlying PDO connection.
     */
    disconnect(): Promise<void>;

    /**
     * Get a schema builder instance for the connection.
     */
    getSchemaBuilder(): SchemaBuilderI<ConnectionSessionI<DriverConnectionI>>;

    /**
     * Register a hook to be run just before a database query is executed.
     */
    beforeExecuting(callback: BeforeExecutingCallback): this;

    /**
     * Register a database query listener with the connection.
     */
    listen(callback: (event: QueryExecuted) => void | Promise<void>): void;

    /**
     * Remove a database query listener with the connection.
     */
    unlisten(callback: (event: QueryExecuted) => void | Promise<void>): void;

    /**
     * Set the Schema PDO connection.
     */
    setSchemaPdo(pdo: Pdo): this;

    /**
     * Set the PDO connection.
     */
    setPdo(pdo: Pdo): this;

    /**
     * Set the PDO connection used for reading.
     */
    setReadPdo(pdo: Pdo): this;

    /**
     * Set the event dispatcher instance on the connection.
     */
    setEventDispatcher(dispatcher: EventEmitter): this;

    /**
     * Unset the event dispatcher for this connection.
     */
    unsetEventDispatcher(): this;

    /**
     * Get the schema grammar used by the connection.
     */
    getSchemaGrammar(): SchemaGrammar;

    /**
     * Get the query grammar used by the connection.
     */
    getQueryGrammar(): Grammar;

    /**
     * Execute the given callback in "dry run" mode.
     */
    pretend(callback: (session: ConnectionSessionI<DriverConnectionI>) => void | Promise<void>): Promise<LoggedQuery[]>;

    /**
     * Execute a Closure within a transaction.
     */
    transaction(
        callback: (session: ConnectionSessionI<DriverConnectionI>) => void | Promise<void>,
        attempts?: number
    ): Promise<void>;

    /**
     * Start a new database transaction.
     */
    beginTransaction(): Promise<ConnectionSessionI<DriverConnectionI>>;

    /**
     * Indicate that the connection should use the write PDO connection for reads.
     */
    useWriteConnectionWhenReading(value?: boolean): ConnectionSessionI<DriverConnectionI>;
}

export interface ConnectionSessionI<DriverConnection extends DriverConnectionI = DriverConnectionI>
    extends BaseConnection {
    /**
     * Get the Driver Connection of current session
     */
    getDriverConnection(): DriverConnection;
    /**
     * Detect if session is for Schema QueryBuilder
     */
    isSchema(): boolean;
    /**
     * Execute the given callback in "dry run" mode.
     */
    pretend(callback: (session: this) => void | Promise<void>): Promise<LoggedQuery[]>;

    /**
     * Execute a Closure within a transaction.
     */
    transaction(callback: (session: this) => void | Promise<void>, attempts?: number): Promise<void>;

    /**
     * Start a new database transaction.
     */
    beginTransaction(): Promise<this>;

    /**
     * Get the number of active transactions.
     */
    transactionLevel(): number;

    /**
     * Commit the active database transaction.
     */
    commit(): Promise<void>;

    /**
     * Rollback the active database transaction.
     */
    rollBack(toLevel?: number): Promise<void>;

    /**
     * Execute the given callback without "pretending".
     */
    withoutPretending<T>(callback: () => T | Promise<T>): Promise<T>;

    /**
     * Indicate that the connection should use the write PDO connection for reads.
     */
    useWriteConnectionWhenReading(value?: boolean): this;

    /**
     * Get the schema grammar used by the connection.
     */
    getSchemaGrammar(): ReturnType<DriverConnection['getSchemaGrammar']>;

    /**
     * Get the query grammar used by the connection.
     */
    getQueryGrammar(): ReturnType<DriverConnection['getQueryGrammar']>;
}
