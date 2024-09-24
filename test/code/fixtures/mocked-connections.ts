import { Pdo } from 'lupdo';

import { Connection } from '../../../src/connections';
import MysqlConnection from '../../../src/connections/mysql-connection';
import PostgresConnection from '../../../src/connections/postgres-connection';
import SqliteConnection from '../../../src/connections/sqlite-connection';
import SqlserverConnection from '../../../src/connections/sqlserver-connection';
import Connector from '../../../src/connectors/connector';
import MysqlConnector from '../../../src/connectors/mysql-connectors';
import PostgresConnector from '../../../src/connectors/postgres-connector';
import SqliteConnector from '../../../src/connectors/sqlite-connector';
import SqlserverConnector from '../../../src/connectors/sqlserver-connector';
import { Grammar } from '../../../src/query';
import { SchemaBuilder, SchemaGrammar } from '../../../src/schema';
import ConnectionConfig from '../../../src/types/config';

export class MockedConnector extends Connector {
  public connect(config: ConnectionConfig): Pdo {
    return new Pdo('fake', config);
  }
}

export class MockedSqliteConnector extends SqliteConnector {
  public connect(config: ConnectionConfig): Pdo {
    return new Pdo('fake', config);
  }
}

export class MockedSqliteConnection extends SqliteConnection {
  protected createConnector(): MockedSqliteConnector {
    return new MockedSqliteConnector();
  }
}

export class MockedMysqlConnector extends MysqlConnector {
  public connect(config: ConnectionConfig): Pdo {
    return new Pdo('fake', config);
  }
}

export class MockedMysqlConnection extends MysqlConnection {
  protected createConnector(): MockedMysqlConnector {
    return new MockedMysqlConnector();
  }
}

export class MockedPostgresConnector extends PostgresConnector {
  public connect(config: ConnectionConfig): Pdo {
    return new Pdo('fake', config);
  }
}

export class MockedPostgresConnection extends PostgresConnection {
  protected createConnector(): MockedPostgresConnector {
    return new MockedPostgresConnector();
  }
}

export class MockedSqlserverConnector extends SqlserverConnector {
  public connect(config: ConnectionConfig): Pdo {
    return new Pdo('fake', config);
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
