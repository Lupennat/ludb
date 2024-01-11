/* eslint-disable @typescript-eslint/no-unused-vars */

import { Pdo, PdoPreparedStatementI, PdoTransactionI, PdoTransactionPreparedStatementI } from 'lupdo';
import PdoRowData from 'lupdo/dist/typings/types/pdo-raw-data';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import CacheManager from '../../../cache-manager';
import ConnectionSession, { RunCallback } from '../../../connections/connection-session';
import DatabaseManager from '../../../database-manager';
import { ExpressionContract, GrammarBuilder } from '../../../query';
import JoinClause from '../../../query/join-clause';
import QueryBuilder from '../../../query/query-builder';
import Blueprint from '../../../schema/blueprint';
import SchemaBuilder from '../../../schema/builders/builder';
import { default as SqliteSchemaBuilder } from '../../../schema/builders/sqlite-builder';
import ColumnDefinition from '../../../schema/definitions/column-definition';
import SchemaGrammar from '../../../schema/grammars/grammar';
import MysqlSchemaGrammar from '../../../schema/grammars/mysql-grammar';
import PostgresSchemaGrammar from '../../../schema/grammars/postgres-grammar';
import SqliteSchemaGrammar from '../../../schema/grammars/sqlite-grammar';
import SqlserverSchemaGrammar from '../../../schema/grammars/sqlserver-grammar';
import {
    CacheConfiguration,
    CacheDriverI,
    QueryCache,
    QueryCacheConnection,
    QueryCacheManager,
    QueryCacheResponse,
    QueryCacheStore
} from '../../../types/cache';
import DriverConnectionI from '../../../types/connection';
import { DBConfig } from '../../../types/database-manager';
import { Binding, BindingExclude, BindingExcludeObject } from '../../../types/generics';
import GrammarBuilderI, { Arrayable } from '../../../types/query/grammar-builder';
import JoinClauseI from '../../../types/query/join-clause';
import BlueprintI from '../../../types/schema/blueprint';
import { BlueprintCallback } from '../../../types/schema/builder/schema-builder';
import {
    MockedConnection,
    MockedMysqlConnection,
    MockedPostgresConnection,
    MockedSqliteConnection,
    MockedSqlserverConnection
} from './mocked-connections';

export class MockedBuilder extends QueryBuilder {
    public getBeforeQueryCallbacks(): any[] {
        return this.beforeQueryCallbacks;
    }
}

export function getSqliteConnection(prefix = 'prefix_'): MockedSqliteConnection {
    return new MockedSqliteConnection('fake', {
        database: 'database',
        prefix: prefix,
        pool: {
            killResource: false
        }
    });
}

export function getPostgresConnection(prefix = 'prefix_'): MockedPostgresConnection {
    return new MockedPostgresConnection('fake', {
        database: 'database',
        prefix: prefix,
        pool: {
            killResource: false
        }
    });
}

export function getSqlserverConnection(prefix = 'prefix_'): MockedSqlserverConnection {
    return new MockedSqlserverConnection('fake', {
        database: 'database',
        prefix: prefix,
        pool: {
            killResource: false
        }
    });
}

export function getMysqlConnection(prefix = 'prefix_'): MockedMysqlConnection {
    return new MockedMysqlConnection('fake', {
        database: 'database',
        prefix: prefix,
        pool: {
            killResource: false
        }
    });
}

export function getConnection(prefix = 'prefix_'): MockedConnection {
    return new MockedConnection('fake', {
        database: 'database',
        prefix: prefix,
        pool: {
            killResource: false
        }
    });
}

export function getConnection2(): MockedConnection {
    return new MockedConnection('fake2', {
        database: 'database2',
        prefix: 'prefix2_',
        pool: {
            killResource: false
        }
    });
}

export function getGrammarBuilder(): GrammarBuilderI {
    return new GrammarBuilder(getConnection('').session());
}

export function getBuilder(): MockedBuilder {
    return new MockedBuilder(getConnection('').session());
}

export function getJoin(table?: string): JoinClauseI {
    return new JoinClause(getBuilder(), 'inner', table ?? 'table');
}

export function getBuilderAlternative(): MockedBuilder {
    const connection = new MockedConnection('fake', {
        database: 'alternative',
        prefix: 'prefix2_',
        pool: {
            killResource: false
        }
    });
    return new MockedBuilder(connection.session());
}

export function getPostgresBuilder(): MockedBuilder {
    return new MockedBuilder(getPostgresConnection('').session());
}

export function getSqlserverBuilder(): MockedBuilder {
    return new MockedBuilder(getSqlserverConnection('').session());
}

export function getMysqlBuilder(): MockedBuilder {
    return new MockedBuilder(getMysqlConnection('').session());
}

export function getSqliteBuilder(): MockedBuilder {
    return new MockedBuilder(getSqliteConnection('').session());
}

export function getPostgresBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new PostgresSchemaGrammar(), callback, prefix);
}

export function getSqlserverBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new SqlserverSchemaGrammar(), callback, prefix);
}

export function getMysqlBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new MysqlSchemaGrammar(), callback, prefix);
}

export function getSqliteBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new SqliteSchemaGrammar(), callback, prefix);
}

export class MockedSchemaBuilder extends SchemaBuilder {
    public createBlueprint(table: string, callback?: BlueprintCallback): BlueprintI {
        return super.createBlueprint(table, callback);
    }
}

export function blueprintResolver(
    table: string,
    grammar: SchemaGrammar,
    callback?: BlueprintCallback,
    prefix?: string
): BlueprintI {
    return new Blueprint(table, grammar, callback, prefix);
}

export class MockedCacheManager extends CacheManager {
    public generateQueryCache(
        connectionName: string,
        queryCacheConnection: QueryCacheConnection
    ): QueryCacheManager | undefined {
        return super.generateQueryCache(connectionName, queryCacheConnection);
    }

    public getCacheConfigs(): any {
        return this.cacheConfig;
    }

    public getCachemap(): any {
        return this.cacheMap;
    }

    public getCaches(): any {
        return this.caches;
    }

    public generateHash(
        query: string,
        bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>
    ): string {
        return super.generateHash(query, bindings);
    }

    public getCacheConfig(connectionName: string): Omit<CacheConfiguration, 'resolver'> {
        return super.getCacheConfig(connectionName);
    }

    public getCacheName(connectionName: string): string | undefined {
        return super.getCacheName(connectionName);
    }

    public getCache(connectionName: string): CacheDriverI | undefined {
        return super.getCache(connectionName);
    }
}

export class MockedCacheDriver implements CacheDriverI {
    async connect(): Promise<boolean> {
        return true;
    }

    async disconnect(): Promise<void> {}

    async isExpired(_time: number, _duration: number): Promise<boolean> {
        return false;
    }

    async get(_queryCache: QueryCache): Promise<QueryCacheResponse | undefined> {
        return undefined;
    }

    async store(_queryCacheStore: QueryCacheStore): Promise<void> {}
}

export class MockedConnectionSession extends ConnectionSession {
    public referenceId: string = '';

    public hasPdoTransaction(): boolean {
        return this.pdoTransaction != null;
    }

    public setPdoTransaction(pdoTransaction: PdoTransactionI): void {
        this.pdoTransaction = pdoTransaction;
    }

    public incrementTransaction(): void {
        this.transactions++;
    }

    public decrementTransaction(): void {
        this.transactions--;
    }

    public getPdoForSelect(useReadPdo?: boolean): Pdo | PdoTransactionI {
        return super.getPdoForSelect(useReadPdo);
    }

    public enableQueryLog(): void {
        super.enableQueryLog();
    }

    public disableQueryLog(): void {
        super.disableQueryLog();
    }

    public logQuery(query: string, bindings: Binding[], time: number): void {
        return super.logQuery(query, bindings, time);
    }

    public async run<T>(query: string, bindings: Binding[], callback: RunCallback<T>): Promise<T> {
        return super.run<T>(query, bindings, callback);
    }

    public prepared(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI
    ): PdoPreparedStatementI | PdoTransactionPreparedStatementI {
        return super.prepared(statement);
    }

    public async performCommit(): Promise<void> {
        return super.performCommit();
    }

    public pretending(): boolean {
        return super.pretending();
    }

    public getEnsuredPdo(): Pdo {
        return super.getEnsuredPdo();
    }

    public getEnsuredPdoTransaction(): PdoTransactionI {
        return super.getEnsuredPdoTransaction();
    }
}

export class MockedConnectionSessionWithResults extends MockedConnectionSession {
    protected __results: PdoRowData[] = [];
    protected __columns: string[] = [];
    protected __dictionary: Dictionary[] = [];

    constructor(driverConnection: DriverConnectionI, results: PdoRowData[], columns: string[]) {
        super(driverConnection, false);
        this.__results = results;
        this.__columns = columns;
        this.generateDictionary();
    }

    protected generateDictionary(): void {
        this.__dictionary = this.__results.map(row => {
            const obj: Dictionary = {};
            for (let x = 0; x < row.length; x++) {
                const col = this.__columns[x];
                if (col) {
                    obj[col] = row[x];
                }
            }
            return obj;
        });
    }

    public prepared(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI
    ): PdoPreparedStatementI | PdoTransactionPreparedStatementI {
        statement = super.prepared(statement);

        jest.spyOn(statement, 'fetchDictionary').mockImplementation(() => {
            return {
                get: () => {
                    return this.__dictionary.shift() ?? null;
                },
                all: () => {
                    return this.__dictionary;
                },
                group: () => {
                    const map = new Map();
                    return map;
                },
                unique: () => {
                    const map = new Map();
                    return map;
                },
                [Symbol.iterator]() {
                    return {
                        next: () => {
                            return { done: true, value: undefined };
                        },
                        return: () => {
                            return { done: true, value: undefined };
                        }
                    };
                }
            };
        });
        jest.spyOn(statement, 'fetchColumn').mockImplementation((column: number) => {
            return {
                get: () => {
                    const val = this.__results.shift();
                    return val ? val[column] : null;
                },
                all: () => {
                    return this.__results.map(row => {
                        return row[column];
                    });
                },
                group: () => {
                    const map = new Map();
                    return map;
                },
                unique: () => {
                    const map = new Map();
                    return map;
                },
                [Symbol.iterator]() {
                    return {
                        next: () => {
                            return { done: true, value: undefined };
                        },
                        return: () => {
                            return { done: true, value: undefined };
                        }
                    };
                }
            };
        });
        return statement;
    }
}
export class MockedConnectionSessionWithResultsSets extends MockedConnectionSessionWithResults {
    protected __cursor = 0;
    protected __resultsSet: PdoRowData[][] = [];
    protected __columnsSet: string[][] = [];

    constructor(driverConnection: DriverConnectionI, results: PdoRowData[][], columns: string[][]) {
        super(driverConnection, results[0], columns[0]);
        this.__resultsSet = results;
        this.__columnsSet = columns;
    }

    public prepared(
        statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI
    ): PdoPreparedStatementI | PdoTransactionPreparedStatementI {
        const stmt = super.prepared(statement);
        jest.spyOn(stmt, 'nextRowset').mockImplementation(() => {
            if (this.__columnsSet.length - 1 < this.__cursor + 1) {
                return false;
            }
            this.__cursor++;
            this.__results = this.__resultsSet[this.__cursor];
            this.__columns = this.__columnsSet[this.__cursor];
            this.generateDictionary();

            return true;
        });
        return stmt;
    }
}

export class MockedSqliteSchemaBuilder extends SqliteSchemaBuilder {
    /**
     * write file on FileSystem
     */
    public async writeFile(path: string): Promise<void> {
        return super.writeFile(path);
    }

    /**
     * Remove file on FileSystem
     */
    public async removeFile(path: string): Promise<void> {
        return super.removeFile(path);
    }

    /**
     * Remove file on FileSystem
     */
    public existFile(path: string): boolean {
        return super.existFile(path);
    }
}

export class ObjectArrayable<Item> implements Arrayable<Item> {
    constructor(protected items: Item[]) {}
    toArray(): Item[] {
        return this.items;
    }
}

export class MockedGrammar extends SchemaGrammar {
    /**
     * Get the SQL for an after column modifier.
     */
    public compileModifyAfter(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyAfter(blueprint, column);
    }

    /**
     * Get the SQL for a charset column modifier.
     */
    public compileModifyCharset(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyCharset(blueprint, column);
    }

    /**
     * Get the SQL for a collate column modifier.
     */
    public compileModifyCollate(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyCollate(blueprint, column);
    }

    /**
     * Get the SQL for a comment column modifier.
     */
    public compileModifyComment(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyComment(blueprint, column);
    }

    /**
     * Get the SQL for a default column modifier.
     */
    public compileModifyDefault(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyDefault(blueprint, column);
    }

    /**
     * Get the SQL for a first column modifier.
     */
    public compileModifyFirst(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyFirst(blueprint, column);
    }

    /**
     * Get the SQL for a generated as column modifier.
     */
    public compileModifyGeneratedAs(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyGeneratedAs(blueprint, column);
    }

    /**
     * Get the SQL for an increment column modifier.
     */
    public compileModifyIncrement(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyIncrement(blueprint, column);
    }

    /**
     * Get the SQL for an invisible column modifier.
     */
    public compileModifyInvisible(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyInvisible(blueprint, column);
    }

    /**
     * Get the SQL for a nullable column modifier.
     */
    public compileModifyNullable(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyNullable(blueprint, column);
    }

    /**
     * Get the SQL for an on update column modifier.
     */
    public compileModifyOnUpdate(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyOnUpdate(blueprint, column);
    }

    /**
     * Get the SQL for a persisted column modifier.
     */
    public compileModifyPersisted(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyPersisted(blueprint, column);
    }

    /**
     * Get the SQL for a srid column modifier.
     */
    public compileModifySrid(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifySrid(blueprint, column);
    }

    /**
     * Get the SQL for a stored as column modifier.
     */
    public compileModifyStoredAs(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyStoredAs(blueprint, column);
    }

    /**
     * Get the SQL for an unsigned column modifier.
     */
    public compileModifyUnsigned(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyUnsigned(blueprint, column);
    }

    /**
     * Get the SQL for a virtual as column modifier.
     */
    public compileModifyVirtualAs(blueprint: BlueprintI, column: ColumnDefinition): string {
        return super.compileModifyVirtualAs(blueprint, column);
    }
}

export class MockedDatabaseManager<const Config extends DBConfig> extends DatabaseManager<Config> {
    public createConnection<const T extends keyof Config['connections'] & string>(name: T): any {
        return super.createConnection(name);
    }
}
