import { Pdo } from 'lupdo';
import { Connection } from '../../../connections';
import MysqlConnection from '../../../connections/mysql-connection';
import PostgresConnection from '../../../connections/postgres-connection';
import SqliteConnection from '../../../connections/sqlite-connection';
import SqlserverConnection from '../../../connections/sqlserver-connection';
import Connector from '../../../connectors/connector';
import MysqlConnector from '../../../connectors/mysql-connectors';
import PostgresConnector from '../../../connectors/postgres-connector';
import SqliteConnector from '../../../connectors/sqlite-connector';
import SqlserverConnector from '../../../connectors/sqlserver-connector';
import { Grammar } from '../../../query';
import { SchemaBuilder, SchemaGrammar } from '../../../schema';

export class MockedConnector extends Connector {
    public connect(): Pdo {
        return new Pdo('fake', {});
    }
}

export class MockedSqliteConnector extends SqliteConnector {
    public connect(): Pdo {
        return new Pdo('fake', {});
    }
}

export class MockedSqliteConnection extends SqliteConnection {
    protected createConnector(): MockedSqliteConnector {
        return new MockedSqliteConnector();
    }
}

export class MockedMysqlConnector extends MysqlConnector {
    public connect(): Pdo {
        return new Pdo('fake', {});
    }
}

export class MockedMysqlConnection extends MysqlConnection {
    protected createConnector(): MockedMysqlConnector {
        return new MockedMysqlConnector();
    }
}

export class MockedPostgresConnector extends PostgresConnector {
    public connect(): Pdo {
        return new Pdo('fake', {});
    }
}

export class MockedPostgresConnection extends PostgresConnection {
    protected createConnector(): MockedPostgresConnector {
        return new MockedPostgresConnector();
    }
}

export class MockedSqlserverConnector extends SqlserverConnector {
    public connect(): Pdo {
        return new Pdo('fake', {});
    }
}

export class MockedSqlserverConnection extends SqlserverConnection {
    protected createConnector(): MockedSqlserverConnector {
        return new MockedSqlserverConnector();
    }
}

export class MockedConnection extends Connection {
    /**
     * The query grammar implementation.
     */
    protected queryGrammar!: Grammar;

    /**
     * The schema grammar implementation.
     */
    protected schemaGrammar!: SchemaGrammar;

    protected createConnector(): MockedConnector {
        return new MockedConnector();
    }

    /**
     * set Default Query Grammar
     */
    protected setDefaultQueryGrammar(): void {
        this.queryGrammar = new Grammar().setTablePrefix(this.tablePrefix);
    }

    /**
     * set Default Schema Grammar
     */
    protected setDefaultSchemaGrammar(): void {
        this.schemaGrammar = new SchemaGrammar().setTablePrefix(this.tablePrefix);
    }

    /**
     * Get a schema builder instance for the connection.
     */
    public getSchemaBuilder(): SchemaBuilder {
        return new SchemaBuilder(this.sessionSchema());
    }

    /**
     * Get the schema grammar used by the connection.
     */
    public getSchemaGrammar(): SchemaGrammar {
        return this.schemaGrammar;
    }

    /**
     * Get the query grammar used by the connection.
     */
    public getQueryGrammar(): Grammar {
        return this.queryGrammar;
    }
}
