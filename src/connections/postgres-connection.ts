import PostgresConnector from '../connectors/postgres-connector';
import PostgresGrammar from '../query/grammars/postgres-grammar';
import SchemaBuilder from '../schema/builders/postgres-builder';
import SchemaGrammar from '../schema/grammars/postgres-grammar';
import { PostgresConfig } from '../types/config';
import Connection from './connection';

class PostgresConnection extends Connection<PostgresConfig> {
    /**
     * The query grammar implementation.
     */
    protected queryGrammar!: PostgresGrammar;

    /**
     * The schema grammar implementation.
     */
    protected schemaGrammar!: SchemaGrammar;

    /**
     * create Connector
     */
    protected createConnector(): PostgresConnector {
        return new PostgresConnector();
    }

    /**
     * set Default Query Grammar
     */
    protected setDefaultQueryGrammar(): void {
        this.queryGrammar = new PostgresGrammar().setTablePrefix(this.tablePrefix);
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
    public getQueryGrammar(): PostgresGrammar {
        return this.queryGrammar;
    }
}

export default PostgresConnection;
