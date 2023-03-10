import { Pdo, PdoPreparedStatementI, PdoTransactionI, PdoTransactionPreparedStatementI } from 'lupdo';
import PdoRowData from 'lupdo/dist/typings/types/pdo-raw-data';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Connection from '../../../connections/connection';
import ConnectionSession, { RunCallback } from '../../../connections/connection-session';
import ConnectionFactory from '../../../connectors/connection-factory';
import Builder from '../../../query/builder';
import Grammar from '../../../query/grammars/grammar';
import MySqlGrammar from '../../../query/grammars/mysql-grammar';
import PostgresGrammar from '../../../query/grammars/postgres-grammar';
import SQLiteGrammar from '../../../query/grammars/sqlite-grammar';
import SqlServerGrammar from '../../../query/grammars/sqlserver-grammar';
import JoinClause from '../../../query/join-clause';
import Blueprint from '../../../schema/blueprint';
import SchemaBuilder from '../../../schema/builders/builder';
import { default as SQLiteSchemaBuilder } from '../../../schema/builders/sqlite-builder';
import ColumnDefinition from '../../../schema/definitions/column-definition';
import SchemaGrammar from '../../../schema/grammars/grammar';
import MySqlSchemaGrammar from '../../../schema/grammars/mysql-grammar';
import PostgresSchemaGrammar from '../../../schema/grammars/postgres-grammar';
import SQLiteSchemaGrammar from '../../../schema/grammars/sqlite-grammar';
import SqlServerSchemaGrammar from '../../../schema/grammars/sqlserver-grammar';
import { DriverFLattedConfig } from '../../../types/config';
import DriverConnectionI from '../../../types/connection';
import ConnectorI from '../../../types/connector';
import BuilderI, { Arrayable, Binding } from '../../../types/query/builder';
import JoinClauseI from '../../../types/query/join-clause';
import BlueprintI from '../../../types/schema/blueprint';
import { BlueprintCallback } from '../../../types/schema/builder';
import GrammarI from '../../../types/schema/grammar';
import FakePdo from './fake-pdo';
export { FakeConnection } from './fake-pdo';

Pdo.addDriver('fake', FakePdo);

export const pdo = new Pdo('fake', {});
export const schemaPdo = new Pdo('fake', {});

export function getConnection(): Connection {
    return new Connection(
        pdo,
        schemaPdo,
        {
            driver: 'fake',
            name: 'fake',
            database: 'database',
            prefix: 'prefix',
            pool: {
                killResource: false
            }
        },
        'database',
        'prefix'
    );
}
export function getConnection2(): Connection {
    return new Connection(
        pdo,
        schemaPdo,
        {
            driver: 'fake',
            name: 'fake2',
            database: 'database2',
            prefix: 'prefix2',
            pool: {
                killResource: false
            }
        },
        'database2',
        'prefix2'
    );
}

const connection = getConnection();

export function getBuilder(): BuilderI {
    return new Builder(connection.session(), new Grammar());
}

export function getJoin(table?: string): JoinClauseI {
    return new JoinClause(getBuilder(), 'inner', table ?? 'table');
}

export function getBuilderAlternative(): BuilderI {
    const connection = new Connection(
        pdo,
        schemaPdo,
        {
            driver: 'fake',
            name: 'fake',
            database: 'alternative',
            prefix: 'prefix',
            pool: {
                killResource: false
            }
        },
        'alternative',
        'prefix'
    );
    return new Builder(connection.session(), new Grammar());
}

export function getPostgresBuilder(): BuilderI {
    return new Builder(connection.session(), new PostgresGrammar());
}

export function getSqlServerBuilder(): BuilderI {
    return new Builder(connection.session(), new SqlServerGrammar());
}

export function getMySqlBuilder(): BuilderI {
    return new Builder(connection.session(), new MySqlGrammar());
}

export function getSQLiteBuilder(): BuilderI {
    return new Builder(connection.session(), new SQLiteGrammar());
}

export function getPostgresBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new PostgresSchemaGrammar(), callback, prefix);
}

export function getSqlServerBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new SqlServerSchemaGrammar(), callback, prefix);
}

export function getMySqlBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new MySqlSchemaGrammar(), callback, prefix);
}

export function getSQLiteBlueprint(table: string, callback?: BlueprintCallback, prefix?: string): BlueprintI {
    return new Blueprint(table, new SQLiteSchemaGrammar(), callback, prefix);
}

export class MockedFactory extends ConnectionFactory {
    public createConnector(config: DriverFLattedConfig): ConnectorI {
        return super.createConnector(config);
    }
    public createConnection(
        driver: string,
        connection: Pdo,
        schemaConnection: Pdo,
        config: DriverFLattedConfig,
        database: string,
        prefix: string
    ): DriverConnectionI {
        return super.createConnection(driver, connection, schemaConnection, config, database, prefix);
    }
}

export class MockedSchemaBuilder extends SchemaBuilder {
    public createBlueprint(table: string, callback?: BlueprintCallback): BlueprintI {
        return super.createBlueprint(table, callback);
    }
}

export function blueprintResolver(
    table: string,
    grammar: GrammarI,
    callback?: BlueprintCallback,
    prefix?: string
): BlueprintI {
    return new Blueprint(table, grammar, callback, prefix);
}

export class MockedConnectionSession extends ConnectionSession {
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

export function mockedSessionWithResults(
    connection: Connection,
    results: PdoRowData[],
    columns: string[]
): MockedConnectionSession {
    class MockedConnectionSessionWithResults extends MockedConnectionSession {
        public prepared(
            statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI
        ): PdoPreparedStatementI | PdoTransactionPreparedStatementI {
            statement = super.prepared(statement);
            const dictionary = results.map(row => {
                const obj: Dictionary = {};
                for (let x = 0; x < row.length; x++) {
                    const col = columns[x];
                    if (col) {
                        obj[col] = row[x];
                    }
                }
                return obj;
            });
            jest.spyOn(statement, 'fetchDictionary').mockImplementation(() => {
                return {
                    get: () => {
                        return dictionary.shift() ?? null;
                    },
                    all: () => {
                        return dictionary;
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
                        const val = results.shift();
                        return val ? val[column] : null;
                    },
                    all: () => {
                        return results.map(row => {
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
    return new MockedConnectionSessionWithResults(connection);
}

export class MockedSQLiteSchemaBuilder extends SQLiteSchemaBuilder {
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
