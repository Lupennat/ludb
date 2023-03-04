import { Pdo, PdoPreparedStatementI, PdoTransactionI, PdoTransactionPreparedStatementI } from 'lupdo';
import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import EventEmitter from 'node:events';
import QueryExecuted from '../events/query-executed';
import BuilderContract from '../query/builder-contract';
import { FlattedConnectionConfig, ReadWriteType } from './config';
import { Binding, NotExpressionBinding, Stringable, SubQuery } from './query/builder';
import GrammarI from './query/grammar';
import SchemaBuilderI from './schema/builder';
import SchemaGrammarI from './schema/grammar';

export type ConnectionResolver = <T extends FlattedConnectionConfig>(
    pdo: Pdo,
    schemaPdo: Pdo,
    config: T,
    database: string,
    tablePrefix: string
) => DriverConnectionI;

export type BeforeExecutingCallback = (query: string, bindings: Binding[], connection: unknown) => void | Promise<void>;

export type QueryExecutedCallback = (event: QueryExecuted) => void | Promise<void>;

export type PretendingCallback = (session: ConnectionSessionI) => void | Promise<void>;

export type TransactionCallback = (session: ConnectionSessionI) => void | Promise<void>;

export interface LoggedQuery {
    query: string;
    bindings: Binding[];
}

export default interface DriverConnectionI
    extends Omit<ConnectionSessionI, 'isSchema' | 'transactionLevel' | 'commit' | 'rollBack' | 'getDriverConnection'> {
    /**
     * Get the current PDO connection.
     */
    getPdo(): Pdo;

    /**
     * Get the current PDO connection used for reading.
     */
    getReadPdo(): Pdo;

    /**
     * Set the query grammar to the default implementation.
     */
    useDefaultQueryGrammar(): this;

    /**
     * Start Connection session for Builder
     */
    session(): ConnectionSessionI;

    /**
     * Start Connection session for SchemaBuilder
     */
    sessionSchema(): ConnectionSessionI;

    /**
     * Reconnect to the database.
     */
    reconnect(): Promise<this>;

    /**
     * Disconnect from the underlying PDO connection.
     */
    disconnect(): Promise<void>;

    /**
     * Set the schema grammar to the default implementation.
     */
    useDefaultSchemaGrammar(): this;

    /**
     * Get a schema builder instance for the connection.
     */
    getSchemaBuilder(): SchemaBuilderI;

    /**
     * Register a hook to be run just before a database query is executed.
     */
    beforeExecuting(callback: BeforeExecutingCallback): this;

    /**
     * Register a database query listener with the connection.
     */
    listen(callback: QueryExecutedCallback): void;

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
     * Set the query grammar used by the connection.
     */
    setQueryGrammar(grammar: GrammarI): this;

    /**
     * Set the schema grammar used by the connection.
     */
    setSchemaGrammar(grammar: SchemaGrammarI): this;

    /**
     * Set the event dispatcher instance on the connection.
     */
    setEventDispatcher(dispatcher: EventEmitter): this;

    /**
     * Unset the event dispatcher for this connection.
     */
    unsetEventDispatcher(): this;

    /**
     * Set the name of the connected database.
     */
    setDatabaseName(database: string): this;

    /**
     * Set the read / write type of the connection.
     */
    setReadWriteType(readWriteType: ReadWriteType | null): this;

    /**
     * Set the table prefix in use by the connection.
     */
    setTablePrefix(prefix: string): this;

    /**
     * Set the table prefix and return the grammar.
     */
    withTablePrefix(grammar: GrammarI): GrammarI;
}

export interface ConnectionSessionI {
    /**
     * Begin a fluent query against a database table.
     */
    table(table: SubQuery<BuilderContract>, as?: string): BuilderContract;

    /**
     * Get a new query builder instance.
     */
    query(): BuilderContract;

    /**
     * Run a select statement and return a single result.
     */
    selectOne<T = Dictionary>(query: string, bindings?: Binding[], useReadPdo?: boolean): Promise<T | null>;

    /**
     * Run a select statement and return the first column of the first row.
     */
    scalar<T>(query: string, bindings?: Binding[], useReadPdo?: boolean): Promise<T | null>;

    /**
     * Run a select statement against the database.
     */
    selectFromWriteConnection<T = Dictionary>(query: string, bindings?: Binding[]): Promise<T[]>;

    /**
     * Run a select statement against the database.
     */
    select<T = Dictionary>(query: string, bindings?: Binding[], useReadPdo?: boolean): Promise<T[]>;

    /**
     * Run a select statement against the database and get Column.
     */
    selectColumn<T extends PdoColumnValue>(
        column: number,
        query: string,
        bindings?: Binding[],
        useReadPdo?: boolean
    ): Promise<T[]>;

    /**
     * Run a select statement against the database and returns a generator.
     */
    cursor<T = Dictionary>(query: string, bindings?: Binding[], useReadPdo?: boolean): Promise<Generator<T>>;

    /**
     * Run an insert statement against the database.
     */
    insert(query: string, bindings?: Binding[]): Promise<boolean>;

    /**
     * Run an insert get id statement against the database.
     */
    insertGetId<T = number | bigint | string>(
        query: string,
        bindings?: Binding[],
        sequence?: Stringable | null
    ): Promise<T | null>;

    /**
     * Run an update statement against the database.
     */
    update(query: string, bindings?: Binding[]): Promise<number>;

    /**
     * Run a delete statement against the database.
     */
    delete(query: string, bindings?: Binding[]): Promise<number>;

    /**
     * Execute an SQL statement and return the boolean result.
     */
    statement(query: string, bindings?: Binding[]): Promise<boolean>;

    /**
     * Run an SQL statement and get the number of rows affected.
     */
    affectingStatement(query: string, bindings?: Binding[]): Promise<number>;

    /**
     * Run a raw, unprepared query against the PDO connection.
     */
    unprepared(query: string): Promise<boolean>;

    /**
     * Execute the given callback in "dry run" mode.
     */
    pretend(callback: PretendingCallback): Promise<LoggedQuery[]>;

    /**
     * Execute a Closure within a transaction.
     */
    transaction(callback: TransactionCallback, attempts?: number): Promise<void>;

    /**
     * Start a new database transaction.
     */
    beginTransaction(): Promise<this>;

    /**
     * Commit the active database transaction.
     */
    commit(): Promise<void>;

    /**
     * Rollback the active database transaction.
     */
    rollBack(toLevel?: number): Promise<void>;

    /**
     * Get the number of active transactions.
     */
    transactionLevel(): number;

    /**
     * Indicate that the connection should use the write PDO connection for reads.
     */
    useWriteConnectionWhenReading(value?: boolean): this;

    /**
     * Bind values to their parameters in the given statement.
     */
    bindValues(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI,
        bindings: NotExpressionBinding[]
    ): void;

    /**
     * Prepare the query bindings for execution.
     */
    prepareBindings(bindings: Binding[]): NotExpressionBinding[];

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
     * Get the database connection full name.
     */
    getNameWithReadWriteType(): string;

    /**
     * Return all hook to be run just before a database query is executed.
     */
    getBeforeExecuting(): BeforeExecutingCallback[];

    /**
     * Get an option from the configuration options.
     */
    getConfig<T extends FlattedConnectionConfig>(): T;
    getConfig<T>(option?: string, defaultValue?: T): T;
    getConfig<T>(option?: string, defaultValue?: T): T;

    /**
     * Detect if session is for Schema Builder
     */
    isSchema(): boolean;

    /**
     * Get the PDO driver name.
     */
    getDriverName(): string;

    /**
     * Get the schema grammar used by the connection.
     */
    getSchemaGrammar(): SchemaGrammarI;

    /**
     * Get the query grammar used by the connection.
     */
    getQueryGrammar(): GrammarI;

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
     * Get the Driver Connection of current session
     */
    getDriverConnection(): DriverConnectionI;
}
