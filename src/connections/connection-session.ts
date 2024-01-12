import {
    Pdo,
    PdoPreparedStatement,
    PdoPreparedStatementI,
    PdoTransactionI,
    PdoTransactionPreparedStatementI
} from 'lupdo';
import PdoColumnValue from 'lupdo/dist/typings/types/pdo-column-value';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import { EventEmitter } from 'stream';
import CacheManager from '../cache-manager';
import DeadlockError from '../errors/deadlock-error';
import QueryError from '../errors/query-error';
import ConnectionEvent from '../events/connection-event';
import QueryExecuted from '../events/query-executed';
import StatementPrepared from '../events/statement-prepared';
import TransactionBeginning from '../events/transaction-beginning';
import TransactionCommitted from '../events/transaction-committed';
import TransactionCommitting from '../events/transaction-committing';
import TransactionRolledBack from '../events/transaction-rolledback';
import ExpressionContract from '../query/expression-contract';
import QueryBuilder from '../query/query-builder';
import BindToI from '../types/bind-to';
import { CacheSessionOptions } from '../types/cache';
import ConnectionConfig from '../types/config';
import DriverConnectionI, { BeforeExecutingCallback, ConnectionSessionI, LoggedQuery } from '../types/connection';
import { Binding, BindingExclude, BindingExcludeObject, BindingObject, Stringable } from '../types/generics';
import { QueryAbleCallback } from '../types/query/grammar-builder';
import QueryBuilderI from '../types/query/query-builder';
import { causedByConcurrencyError, causedByLostConnection } from '../utils';

export type RunCallback<T> = (query: string, bindings: Binding[] | BindingObject) => Promise<T>;
export type AfterCommitEvent = {
    level: number;
    query: QueryExecuted;
};
class ConnectionSession<DriverConnection extends DriverConnectionI = DriverConnectionI>
    implements ConnectionSessionI<DriverConnection>
{
    /**
     * Indicates if the connection is in a "dry run".
     */
    protected isPretending = false;

    /**
     * Indicates whether queries are being logged.
     */
    protected loggingQueries = false;

    /**
     * Indicates if the connection should use the "write" PDO connection.
     */
    protected readOnWriteConnection = false;

    /**
     * All of the session queries run against the connection.
     */
    protected queryLog: LoggedQuery[] = [];

    /**
     * The duration of all executed queries in milliseconds.
     */
    protected totalQueryDuration = 0.0;

    /**
     * The number of active transactions.
     */
    protected transactions = 0;

    /**
     * The active transaction connection used.
     */
    protected pdoTransaction?: PdoTransactionI;

    /**
     * After Commit QueryExecuted events
     */
    protected afterCommit: AfterCommitEvent[] = [];

    /**
     * The Query Executed Reference
     */
    protected referenceId: string = '';

    /**
     * Cache session Object
     */
    protected cacheSessionOptions: CacheSessionOptions = {
        key: undefined,
        cache: undefined,
        options: undefined
    };

    /**
     * Create a new connection session instance.
     */
    constructor(
        protected driverConnection: DriverConnection,
        protected isSchemaConnection = false
    ) {}

    /**
     * Define Cache Strategy for current session
     */
    public cache(cache: CacheSessionOptions): this {
        this.cacheSessionOptions = cache;

        return this;
    }

    /**
     * Set Reference for current session
     */
    public reference(reference: string): this {
        this.referenceId = reference;

        return this;
    }

    /**
     * Get Reference for current session
     */
    public getReference(): string {
        return this.referenceId;
    }

    /**
     * Begin a fluent query against a database table.
     */
    public table(table: QueryAbleCallback<QueryBuilderI> | QueryBuilderI | Stringable, as?: string): QueryBuilderI {
        return this.query().from(table, as);
    }

    /**
     * Get a new query builder instance.
     */
    public query(): QueryBuilderI {
        return new QueryBuilder(this);
    }

    /**
     * Run a select statement and return a single result.
     */
    public async selectOne<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T | null> {
        const records = await this.select<T>(query, bindings, useReadPdo);
        return records.shift() ?? null;
    }

    /**
     * Run a select statement and return the first column of the first row.
     */
    public async scalar<T>(
        query: string,
        bindings?: Binding[] | BindingObject,
        useReadPdo?: boolean
    ): Promise<T | null> {
        const record = await this.selectOne<Dictionary>(query, bindings, useReadPdo);

        if (record === null) {
            return null;
        }

        const recordKeys = Object.keys(record);

        if (recordKeys.length > 1) {
            throw new Error('Multiple columns found.');
        }

        return record[recordKeys[0]] as T;
    }

    /**
     * Run a select statement against the database.
     */
    public async selectFromWriteConnection<T = Dictionary>(
        query: string,
        bindings?: Binding[] | BindingObject
    ): Promise<T[]> {
        return await this.select<T>(query, bindings, false);
    }

    /**
     * Run a select statement against the database.
     */
    public async select<T = Dictionary>(
        query: string,
        bindings: Binding[] | BindingObject = [],
        useReadPdo?: boolean
    ): Promise<T[]> {
        return await this.run<T[]>(query, bindings, async (query, bindings) => {
            if (this.pretending()) {
                return [];
            }

            const preparedBindings = this.prepareBindings(bindings);

            const cache = await this.getCacheManager()?.get<T[]>(this.getDriverConnection().getName(), {
                ...this.cacheSessionOptions,
                query,
                bindings: preparedBindings
            });

            if (
                cache &&
                cache.result !== undefined &&
                !(await this.getCacheManager()?.isExpired(
                    this.getDriverConnection().getName(),
                    cache.time,
                    cache.duration,
                    cache.options
                ))
            ) {
                return cache.result;
            }

            // For select statements, we'll simply execute the query and return an array
            // of the database result set. Each element in the array will be a single
            // row from the database table, and will either be an array or objects.
            const statement = this.prepared(await this.getPdoForSelect(useReadPdo).prepare(query));

            this.bindValues(statement, preparedBindings);

            await statement.execute();

            if ('close' in statement && typeof statement.close === 'function') {
                await statement.close();
            }

            const result = statement.fetchDictionary<T>().all();

            if (cache) {
                await this.getCacheManager()?.store<T[]>(this.getDriverConnection().getName(), {
                    ...cache,
                    result
                });
            }

            return result;
        });
    }

    /**
     * Run a select statement against the database.
     */
    public async selectResultSets<T = Dictionary>(
        query: string,
        bindings: Binding[] | BindingObject = [],
        useReadPdo?: boolean
    ): Promise<T[][]> {
        return this.run<T[][]>(query, bindings, async (query, bindings) => {
            if (this.pretending()) {
                return [];
            }

            const statement = this.prepared(await this.getPdoForSelect(useReadPdo).prepare(query));

            this.bindValues(statement, this.prepareBindings(bindings));

            await statement.execute();

            if ('close' in statement && typeof statement.close === 'function') {
                await statement.close();
            }

            const sets: T[][] = [];

            do {
                sets.push(statement.fetchDictionary<T>().all());
            } while (statement.nextRowset());

            return sets;
        });
    }

    /**
     * Run a select statement against the database.
     */
    public async selectColumn<T extends PdoColumnValue>(
        column: number,
        query: string,
        bindings: Binding[] | BindingObject = [],
        useReadPdo?: boolean
    ): Promise<T[]> {
        return await this.run<T[]>(query, bindings, async (query, bindings) => {
            if (this.pretending()) {
                return [];
            }

            // For select statements, we'll simply execute the query and return an array
            // of the database result set. Each element in the array will be a single
            // row from the database table, and will either be an array or objects.
            const statement = this.prepared(await this.getPdoForSelect(useReadPdo).prepare(query));

            this.bindValues(statement, this.prepareBindings(bindings));

            await statement.execute();

            if ('close' in statement && typeof statement.close === 'function') {
                await statement.close();
            }

            return statement.fetchColumn<T>(column).all();
        });
    }

    /**
     * Run a select statement against the database and returns a generator.
     */
    public async cursor<T = Dictionary>(
        query: string,
        bindings: Binding[] | BindingObject = [],
        useReadPdo?: boolean
    ): Promise<Generator<T>> {
        const statement = await this.run<PdoPreparedStatementI | PdoTransactionPreparedStatementI | never[]>(
            query,
            bindings,
            async (query, bindings) => {
                if (this.pretending()) {
                    return [];
                }

                // First we will create a statement for the query. Then, we will set the fetch
                // mode and prepare the bindings for the query. Once that's done we will be
                // ready to execute the query against the database and return the cursor.
                const statement = this.prepared(await this.getPdoForSelect(useReadPdo).prepare(query));

                this.bindValues(statement, this.prepareBindings(bindings));

                // Next, we'll execute the query against the database and return the statement
                // so we can return the cursor. The cursor will use a PHP generator to give
                // back one row at a time without using a bunch of memory to render them.
                await statement.execute();

                if ('close' in statement && typeof statement.close === 'function') {
                    await statement.close();
                }

                return statement;
            }
        );

        return (function* (): Generator<T> {
            if (statement instanceof PdoPreparedStatement) {
                let record: T | undefined;
                while ((record = statement.fetchDictionary<T>().get())) {
                    yield record;
                }
            }
        })();
    }

    /**
     * Configure the PDO prepared statement.
     */
    protected prepared(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI
    ): PdoPreparedStatementI | PdoTransactionPreparedStatementI {
        this.getEventDispatcher()?.emit(StatementPrepared.eventName, new StatementPrepared(this, statement));

        return statement;
    }

    /**
     * Get the PDO connection to use for a select query.
     */
    protected getPdoForSelect(useReadPdo = true): Pdo | PdoTransactionI {
        return useReadPdo ? this.getReadPdo() : this.getPdo();
    }

    /**
     * Run an insert statement against the database.
     */
    public async insert(query: string, bindings?: Binding[] | BindingObject): Promise<boolean> {
        return this.statement(query, bindings);
    }

    /**
     * Run an insert get id statement against the database.
     */
    public async insertGetId<T = number | bigint | string>(
        query: string,
        bindings: Binding[] = [],
        sequence?: string | null
    ): Promise<T | null> {
        return this.run<T | null>(query, bindings, async (query, bindings) => {
            if (this.pretending()) {
                return null;
            }

            const statement = await this.getPdo().prepare(query);

            this.bindValues(statement, this.prepareBindings(bindings));

            await statement.execute();

            const id = (await statement.lastInsertId(sequence ? sequence : undefined)) as T;

            if ('close' in statement && typeof statement.close === 'function') {
                await statement.close();
            }

            return id;
        });
    }

    /**
     * Run an update statement against the database.
     */
    public async update(query: string, bindings?: Binding[] | BindingObject): Promise<number> {
        return this.affectingStatement(query, bindings);
    }

    /**
     * Run a delete statement against the database.
     */
    public async delete(query: string, bindings?: Binding[] | BindingObject): Promise<number> {
        return this.affectingStatement(query, bindings);
    }

    /**
     * Execute an SQL statement and return the boolean result.
     */
    public async statement(query: string, bindings: Binding[] | BindingObject = []): Promise<boolean> {
        return this.run<boolean>(query, bindings, async (query, bindings) => {
            if (this.pretending()) {
                return true;
            }

            const statement = await this.getPdo().prepare(query);

            this.bindValues(statement, this.prepareBindings(bindings));

            await statement.execute();

            if ('close' in statement && typeof statement.close === 'function') {
                await statement.close();
            }

            return true;
        });
    }

    /**
     * Run an SQL statement and get the number of rows affected.
     */
    public async affectingStatement(query: string, bindings: Binding[] | BindingObject = []): Promise<number> {
        return this.run(query, bindings, async (query, bindings) => {
            if (this.pretending()) {
                return 0;
            }

            // For update or delete statements, we want to get the number of rows affected
            // by the statement and return that back to the developer. We'll first need
            // to execute the statement and then we'll use PDO to fetch the affected.
            const statement = await this.getPdo().prepare(query);

            this.bindValues(statement, this.prepareBindings(bindings));

            await statement.execute();

            if ('close' in statement && typeof statement.close === 'function') {
                await statement.close();
            }

            return statement.rowCount();
        });
    }

    /**
     * Run a raw, unprepared query against the PDO connection.
     */
    public async unprepared(query: string): Promise<boolean> {
        return this.run(query, [], async query => {
            if (this.pretending()) {
                return true;
            }
            await this.getPdo().exec(query);
            return true;
        });
    }

    /**
     * Execute the given callback in "dry run" mode.
     */
    public async pretend(callback: (session: this) => void | Promise<void>): Promise<LoggedQuery[]> {
        return await this.withFreshQueryLog<LoggedQuery[]>(async () => {
            this.isPretending = true;

            // Basically to make the database connection "pretend", we will just return
            // the default values for all the query methods, then we will return an
            // array of queries that were "executed" within the Closure callback.
            await callback(this);

            this.isPretending = false;

            return this.queryLog;
        });
    }

    /**
     * Execute the given callback without "pretending".
     */
    public async withoutPretending<T>(callback: () => T | Promise<T>): Promise<T> {
        if (!this.pretending()) {
            return callback();
        }

        this.isPretending = false;

        this.disableQueryLog();

        const result = await callback();

        this.isPretending = true;

        this.enableQueryLog();

        return result;
    }

    /**
     * Execute the given callback in "dry run" mode.
     */
    protected async withFreshQueryLog<T>(callback: () => Promise<T>): Promise<T> {
        const loggingQueries = this.loggingQueries;

        // First we will back up the value of the logging queries property and then
        // we'll be ready to run callbacks. This query log will also get cleared
        // so we will have a new log of all the queries that are executed now.
        this.enableQueryLog();

        this.queryLog = [];

        // Now we'll execute this callback and capture the result. Once it has been
        // executed we will restore the value of query logging and give back the
        // value of the callback so the original callers can have the results.
        const result = await callback();

        this.loggingQueries = loggingQueries;

        return result;
    }

    /**
     * Run a SQL statement and log its execution context.
     */
    protected async run<T>(query: string, bindings: Binding[] | BindingObject, callback: RunCallback<T>): Promise<T> {
        for (const beforeExecutingCallback of this.getBeforeExecuting()) {
            await beforeExecutingCallback(query, bindings, this);
        }

        const start = Date.now();

        // Here we will run this query. If an error occurs we'll determine if it was
        // caused by a connection that has been lost. If that is the cause, we'll try
        // to re-establish connection and re-run the query with a fresh connection.
        let result: T;
        try {
            result = await this.runQueryCallback<T>(query, bindings, callback);
        } catch (error) {
            try {
                result = await this.handleQueryError<T>(error as QueryError, query, bindings, callback);
            } catch (err) {
                throw err;
            }
        }

        // Once we have run the query we will calculate the time that it took to run and
        // then log the query, bindings, and execution time so we will report them on
        // the event that the developer needs them. We'll log time in milliseconds.
        this.logQuery(query, bindings, this.getElapsedTime(start));

        return result;
    }

    /**
     * Run a SQL statement.
     */
    protected async runQueryCallback<T>(
        query: string,
        bindings: Binding[] | BindingObject,
        callback: RunCallback<T>
    ): Promise<T> {
        // To execute the statement, we'll simply call the callback, which will actually
        // run the SQL against the PDO connection. Then we can calculate the time it
        // took to execute and log the query SQL, bindings and time in our memory.
        try {
            return await callback(query, bindings);
        } catch (error: any) {
            // If an error occurs when attempting to run a query, we'll format the error
            // message to include the bindings with SQL, which will make this error a
            // lot more helpful to the developer instead of just the database's errors.
            throw new QueryError(this, query, this.prepareBindings(bindings), error);
        }
    }

    /**
     * Log a query in the connection's query log.
     */
    protected logQuery(query: string, bindings: Binding[] | BindingObject, time: number): void {
        this.totalQueryDuration += time;

        if (this.transactionLevel() > 0) {
            this.afterCommit.push({
                level: this.transactionLevel(),
                query: new QueryExecuted(this, query, bindings, time, this.totalQueryDuration, false)
            });
        }

        this.getEventDispatcher()?.emit(
            QueryExecuted.eventName,
            new QueryExecuted(this, query, bindings, time, this.totalQueryDuration, this.transactionLevel() > 0)
        );

        if (this.loggingQueries) {
            this.queryLog.push({
                query: this.getQueryGrammar().substituteBindingsIntoRawSql(query, this.prepareBindings(bindings)),
                bindings
            });
        }
    }

    /**
     * Enable the query log on the connection.
     */
    protected enableQueryLog(): void {
        this.loggingQueries = true;
    }

    /**
     * Disable the query log on the connection.
     */
    protected disableQueryLog(): void {
        this.loggingQueries = false;
    }

    /**
     * Execute a Closure within a transaction.
     */
    public async transaction(callback: (session: this) => void | Promise<void>, attempts = 1): Promise<void> {
        for (let currentAttempt = 1; currentAttempt <= attempts; currentAttempt++) {
            await this.beginTransaction();

            // We'll simply execute the given callback within a try / catch block and if we
            // catch any error we can rollback this transaction so that none of this
            // gets actually persisted to a database or stored in a permanent fashion.
            try {
                await callback(this);
            } catch (error: any) {
                // If we catch an error we'll rollback this transaction and try again if we
                // are not out of attempts. If we are out of attempts we will just throw the
                // error back out, and let the developer handle an uncaught error.
                await this.handleTransactionError(error, currentAttempt, attempts);

                continue;
            }

            try {
                await this.performCommit();
            } catch (error) {
                await this.handleCommitTransactionError(error, currentAttempt, attempts);
                continue;
            }

            this.fireConnectionEvent('committed');

            return;
        }
    }

    /**
     * Fire registered after commit QueryExectued.
     */
    protected fireAfterCommitEvent(): void {
        if (this.transactionLevel() === 0) {
            let event: AfterCommitEvent | undefined;
            while ((event = this.afterCommit.shift())) {
                this.getEventDispatcher()?.emit(QueryExecuted.eventName, event.query);
            }
        }
    }

    /**
     * Handle an error encountered when running a transacted statement.
     */
    protected async handleTransactionError(error: Error, currentAttempt: number, maxAttempts: number): Promise<void> {
        // On a deadlock, MySQL rolls back the entire transaction so we can't just
        // retry the query. We have to throw this error all the way out and
        // let the developer handle it in another way. We will decrement too.
        if (causedByConcurrencyError(error) && this.transactionLevel() > 1) {
            this.transactions--;

            throw new DeadlockError(error);
        }

        // If there was an error we will rollback this transaction and then we
        // can check if we have exceeded the maximum attempt count for this and
        // if we haven't we will return and try this query again in our loop.
        await this.rollBack();

        if (causedByConcurrencyError(error) && currentAttempt < maxAttempts) {
            return;
        }

        throw error;
    }

    /**
     * Start a new database transaction.
     */
    public async beginTransaction(): Promise<this> {
        await this.createTransaction();

        this.transactions++;

        this.fireConnectionEvent('beganTransaction');

        return this;
    }

    /**
     * Create a transaction within the database.
     */
    protected async createTransaction(): Promise<void> {
        if (this.transactionLevel() === 0) {
            try {
                this.pdoTransaction = await this.getEnsuredPdo().beginTransaction();
            } catch (error) {
                await this.handleBeginTransactionError(error);
            }
        } else if (this.transactionLevel() >= 1 && this.getQueryGrammar().supportsSavepoints()) {
            await this.createSavepoint();
        }
    }

    /**
     * Create a save point within the database.
     */
    protected async createSavepoint(): Promise<void> {
        await this.getEnsuredPdoTransaction().exec(
            this.getQueryGrammar().compileSavepoint(`trans${this.transactionLevel() + 1}`)
        );
    }

    /**
     * Handle an error from a transaction beginning.
     */
    protected async handleBeginTransactionError(error: any): Promise<void> {
        if (causedByLostConnection(error)) {
            this.pdoTransaction = await this.getEnsuredPdo().beginTransaction();
        } else {
            throw error;
        }
    }

    /**
     * Perform a commit within the database When Necessary.
     */
    protected async performCommit(): Promise<void> {
        if (this.transactionLevel() === 1) {
            this.fireConnectionEvent('committing');
            await this.doRealCommit();
        }

        this.transactions = Math.max(0, this.transactionLevel() - 1);
        this.fireAfterCommitEvent();
    }

    /**
     * Commit the active database transaction Within Pdo.
     */
    protected async doRealCommit(): Promise<void> {
        try {
            await this.getEnsuredPdoTransaction().commit();
        } catch (error) {
            this.handleCommitError(error);
        }
    }

    /**
     * Commit the active database transaction.
     */
    public async commit(): Promise<void> {
        await this.performCommit();

        this.fireConnectionEvent('committed');
    }

    /**
     * Handle an error from a commit.
     */
    protected handleCommitError(error: any): Promise<void> {
        // lupdo will release connection to the pool when an error raised on commit
        // we need to reset transaction, user must retry manually the transaction
        this.transactions = 0;
        this.filterAfterCommit();

        throw error;
    }

    /**
     * Handle an error encountered when committing a transaction.
     */
    protected async handleCommitTransactionError(
        error: any,
        currentAttempt: number,
        maxAttempts: number
    ): Promise<void> {
        this.transactions = Math.max(0, this.transactionLevel() - 1);

        if (causedByConcurrencyError(error) && currentAttempt < maxAttempts) {
            return;
        }

        if (causedByLostConnection(error)) {
            this.transactions = 0;
            this.filterAfterCommit();
        }

        throw error;
    }

    /**
     * filter AfterCommit based on new transactionLevel
     */
    protected filterAfterCommit(): void {
        this.afterCommit = this.afterCommit.filter(
            afterCommitEvent => afterCommitEvent.level <= this.transactionLevel()
        );
    }

    /**
     * Rollback the active database transaction.
     */
    public async rollBack(toLevel?: number): Promise<void> {
        // We allow developers to rollback to a certain transaction level. We will verify
        // that this given transaction level is valid before attempting to rollback to
        // that level. If it's not we will just return out and not attempt anything.
        toLevel = toLevel == null ? this.transactionLevel() - 1 : toLevel;

        if (toLevel < 0 || toLevel >= this.transactionLevel()) {
            return;
        }

        // Next, we will actually perform this rollback within this database and fire the
        // rollback event. We will also set the current transaction level to the given
        // level that was passed into this method so it will be right from here out.
        try {
            await this.performRollBack(toLevel);
        } catch (error) {
            await this.handleRollBackError(error);
        }

        this.transactions = toLevel;

        this.filterAfterCommit();

        this.fireConnectionEvent('rollingBack');
    }

    /**
     * Rollback the active database transaction Within Pdo When Necessary.
     */
    protected async doRealRollback(): Promise<void> {
        await this.getEnsuredPdoTransaction().rollback();
    }

    /**
     * Perform a rollback within the database.
     */
    protected async performRollBack(toLevel: number): Promise<void> {
        if (toLevel === 0) {
            await this.doRealRollback();
        } else if (this.getQueryGrammar().supportsSavepoints()) {
            await this.getEnsuredPdoTransaction().exec(
                this.getQueryGrammar().compileSavepointRollBack(`trans${toLevel + 1}`)
            );
        }
    }

    /**
     * Handle an error from a rollback.
     */
    protected async handleRollBackError(error: any): Promise<void> {
        if (causedByLostConnection(error)) {
            // calling exec to rollback savepoint will not release connection to the pool
            // lupdo need to real close transaction otherwise connection
            // even if will be an error calling real rollback will release the connection
            if (this.transactionLevel() > 1) {
                try {
                    await this.doRealRollback();
                } catch (err) {}
            }
            this.transactions = 0;
            this.filterAfterCommit();
        }

        throw error;
    }

    /**
     * Get the number of active transactions.
     */
    public transactionLevel(): number {
        return this.transactions;
    }

    /**
     * Get the elapsed time since a given starting point.
     */
    protected getElapsedTime(start: number): number {
        return Math.round(((Date.now() - start) / 1000 + Number.EPSILON) * 100) / 100;
    }

    /**
     * Handle a query error.
     */
    protected async handleQueryError<T>(
        error: QueryError,
        query: string,
        bindings: Binding[] | BindingObject,
        callback: RunCallback<T>
    ): Promise<T> {
        if (this.transactionLevel() >= 1) {
            throw error;
        }

        return this.tryAgainIfCausedByLostConnection(error, query, bindings, callback);
    }

    /**
     * Handle a query error that occurred during query execution.
     */
    protected tryAgainIfCausedByLostConnection<T>(
        error: QueryError,
        query: string,
        bindings: Binding[] | BindingObject,
        callback: RunCallback<T>
    ): Promise<T> {
        if (causedByLostConnection(error.cause)) {
            return this.runQueryCallback<T>(query, bindings, callback);
        }

        throw error;
    }

    /**
     * Fire an event for this connection.
     */
    protected fireConnectionEvent(event: string): void {
        let eventModel: ConnectionEvent | null = null;
        switch (event) {
            case 'beganTransaction':
                event = TransactionBeginning.eventName;
                eventModel = new TransactionBeginning(this);
                break;
            case 'committed':
                event = TransactionCommitted.eventName;
                eventModel = new TransactionCommitted(this);
                break;
            case 'committing':
                event = TransactionCommitting.eventName;
                eventModel = new TransactionCommitting(this);
                break;
            case 'rollingBack':
                event = TransactionRolledBack.eventName;
                eventModel = new TransactionRolledBack(this);
                break;
        }

        if (eventModel !== null) {
            this.getEventDispatcher()?.emit(event, eventModel);
        }
    }

    /**
     * Indicate that the connection should use the write PDO connection for reads.
     */
    public useWriteConnectionWhenReading(value = true): this {
        this.readOnWriteConnection = value;

        return this;
    }

    /**
     * Determine if the connection is in a "dry run".
     */
    protected pretending(): boolean {
        return this.isPretending === true;
    }

    /**
     * Bind values to their parameters in the given statement.
     */
    public bindValues(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): void {
        this.getDriverConnection().bindValues(statement, bindings);
    }

    /**
     * Prepare the query bindings for execution.
     */
    public prepareBindings(
        bindings: Binding[] | BindingObject
    ): BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract> {
        return this.getDriverConnection().prepareBindings(bindings);
    }

    /**
     * Ensure using PdoTransaction
     */
    protected getEnsuredPdoTransaction(): PdoTransactionI {
        if (!this.pdoTransaction) {
            throw new Error('You should be inside a Transaction.');
        }

        return this.pdoTransaction;
    }

    /**
     * Ensure using Pdo
     */
    protected getEnsuredPdo(): Pdo {
        return this.isSchemaConnection ? this.getSchemaPdo() : this.getDriverConnection().getPdo();
    }

    /**
     * Get the current Schema PDO connection.
     */
    public getSchemaPdo(): Pdo {
        return this.getDriverConnection().getSchemaPdo();
    }

    /**
     * Get the current PDO connection.
     */
    public getPdo(): Pdo | PdoTransactionI {
        return this.transactionLevel() > 0 ? this.getEnsuredPdoTransaction() : this.getEnsuredPdo();
    }

    /**
     * Get the current PDO connection used for reading.
     */
    public getReadPdo(): Pdo | PdoTransactionI {
        if (this.transactionLevel() > 0 || this.readOnWriteConnection) {
            return this.getPdo();
        }

        return this.isSchemaConnection ? this.getSchemaPdo() : this.getDriverConnection().getReadPdo();
    }

    /**
     * Get the database connection name.
     */
    public getName(): string {
        return this.getDriverConnection().getName();
    }

    /**
     * Return all hook to be run just before a database query is executed.
     */
    public getBeforeExecuting(): BeforeExecutingCallback[] {
        return this.getDriverConnection().getBeforeExecuting();
    }

    /**
     * Get an option from the configuration options.
     */
    public getConfig<T extends ConnectionConfig>(): T;
    public getConfig<T>(option: string): T;
    public getConfig<T>(option: string, defaultValue: T): T;
    public getConfig<T>(option?: string, defaultValue?: T): T {
        // it's safe to force any to avoid type error
        // at least one overload is always matched
        return this.getDriverConnection().getConfig<T>(option as any, defaultValue as any);
    }

    /**
     * Detect if session is for Schema QueryBuilder
     */
    public isSchema(): boolean {
        return this.isSchemaConnection;
    }

    /**
     * Get the schema grammar used by the connection.
     */
    public getSchemaGrammar(): ReturnType<DriverConnection['getSchemaGrammar']> {
        return this.getDriverConnection().getSchemaGrammar() as ReturnType<DriverConnection['getSchemaGrammar']>;
    }

    /**
     * Get the query grammar used by the connection.
     */
    public getQueryGrammar(): ReturnType<DriverConnection['getQueryGrammar']> {
        return this.getDriverConnection().getQueryGrammar() as ReturnType<DriverConnection['getQueryGrammar']>;
    }

    /**
     * Get the event dispatcher used by the connection.
     */
    public getEventDispatcher(): EventEmitter | undefined {
        return this.getDriverConnection().getEventDispatcher();
    }

    /**
     * Get the cache manager used by the connection.
     */
    public getCacheManager(): CacheManager | undefined {
        return this.getDriverConnection().getCacheManager();
    }

    /**
     * Get the name of the connected database.
     */
    public getDatabaseName(): string {
        return this.getDriverConnection().getDatabaseName();
    }

    /**
     * Get the table prefix for the connection.
     */
    public getTablePrefix(): string {
        return this.getDriverConnection().getTablePrefix();
    }

    /**
     * Get the Driver Connection of current session
     */
    public getDriverConnection(): DriverConnection {
        return this.driverConnection;
    }

    /**
     * Get a new raw query expression.
     */
    public raw(value: string | bigint | number): ExpressionContract {
        return this.getDriverConnection().raw(value);
    }

    /**
     * Get the bind to object.
     */
    public get bindTo(): BindToI {
        return this.getDriverConnection().bindTo;
    }
}

export default ConnectionSession;
