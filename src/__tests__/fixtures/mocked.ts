import { Pdo } from 'lupdo';
import Connection from '../../connections/connection';
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
import BuilderI from '../../types/query/builder';
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
