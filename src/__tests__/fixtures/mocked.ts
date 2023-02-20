import { Pdo, PdoPreparedStatementI, PdoTransactionI, PdoTransactionPreparedStatementI } from 'lupdo';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Connection from '../../connections/connection';
import ConnectionSession, { RunCallback } from '../../connections/connection-session';
import ConnectionFactory from '../../connectors/connection-factory';
import Builder from '../../query/builder';
import Grammar from '../../query/grammars/grammar';
import MySqlGrammar from '../../query/grammars/mysql-grammar';
import PostgresGrammar from '../../query/grammars/postgres-grammar';
import SQLiteGrammar from '../../query/grammars/sqlite-grammar';
import SqlServerGrammar from '../../query/grammars/sqlserver-grammar';
import MySqlProcessor from '../../query/processors/mysql-processor';
import PostgresProcessor from '../../query/processors/postgres-processor';
import Processor from '../../query/processors/processor';
import { DriverFLattedConfig } from '../../types/config';
import DriverConnectionI from '../../types/connection';
import { ConnectorI } from '../../types/connector';
import BuilderI, { Binding } from '../../types/query/builder';
import FakePdo from './fake-pdo';
export { FakeConnection } from './fake-pdo';

Pdo.addDriver('fake', FakePdo);

export const pdo = new Pdo('fake', {});

export function getConnection(): Connection {
    return new Connection(
        pdo,
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

const connection = getConnection();

export function getBuilder(): BuilderI {
    return new Builder(connection.session(), new Grammar(), new Processor());
}

export function getMySqlBuilderWithProcessor(): BuilderI {
    return new Builder(connection.session(), new MySqlGrammar(), new MySqlProcessor());
}

export function getPostgresBuilderWithProcessor(): BuilderI {
    return new Builder(connection.session(), new PostgresGrammar(), new PostgresProcessor());
}

export function getPostgresBuilder(): BuilderI {
    return new Builder(connection.session(), new PostgresGrammar(), new Processor());
}

export function getSqlServerBuilder(): BuilderI {
    return new Builder(connection.session(), new SqlServerGrammar(), new Processor());
}

export function getMySqlBuilder(): BuilderI {
    return new Builder(connection.session(), new MySqlGrammar(), new Processor());
}

export function getSQLiteBuilder(): BuilderI {
    return new Builder(connection.session(), new SQLiteGrammar(), new Processor());
}

export class MockedFactory extends ConnectionFactory {
    public createConnector(config: DriverFLattedConfig): ConnectorI {
        return super.createConnector(config);
    }
    public createConnection(
        driver: string,
        connection: Pdo,
        config: DriverFLattedConfig,
        database: string,
        prefix: string
    ): DriverConnectionI {
        return super.createConnection(driver, connection, config, database, prefix);
    }
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

export function mockedSessionWithResults(connection: Connection, results: Dictionary[] = []): MockedConnectionSession {
    class MockedConnectionSessionWithResults extends MockedConnectionSession {
        public prepared(
            statement: PdoPreparedStatementI | PdoTransactionPreparedStatementI
        ): PdoPreparedStatementI | PdoTransactionPreparedStatementI {
            statement = super.prepared(statement);
            jest.spyOn(statement, 'fetchDictionary').mockImplementation(() => {
                return {
                    get: () => {
                        return results.shift() ?? null;
                    },
                    all: () => {
                        return results;
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
