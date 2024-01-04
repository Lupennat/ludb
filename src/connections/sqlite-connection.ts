import SqliteConnector from '../connectors/sqlite-connector';
import SqliteGrammar from '../query/grammars/sqlite-grammar';
import SchemaBuilder from '../schema/builders/sqlite-builder';
import SchemaGrammar from '../schema/grammars/sqlite-grammar';
import { SqliteConfig } from '../types/config';
import Connection from './connection';

class SqliteConnection extends Connection<SqliteConfig> {
    /**
     * The query grammar implementation.
     */
    protected queryGrammar!: SqliteGrammar;

    /**
     * The schema grammar implementation.
     */
    protected schemaGrammar!: SchemaGrammar;

    /**
     * create Connector
     */
    protected createConnector(): SqliteConnector {
        return new SqliteConnector();
    }

    /**
     * set Default Query Grammar
     */
    protected setDefaultQueryGrammar(): void {
        this.queryGrammar = new SqliteGrammar().setTablePrefix(this.tablePrefix);
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
    public getQueryGrammar(): SqliteGrammar {
        return this.queryGrammar;
    }
}

export default SqliteConnection;
