import MysqlConnector from '../connectors/mysql-connectors';
import MysqlGrammar from '../query/grammars/mysql-grammar';
import SchemaBuilder from '../schema/builders/mysql-builder';
import SchemaGrammar from '../schema/grammars/mysql-grammar';
import { MysqlConfig } from '../types/config';
import Connection from './connection';

class MysqlConnection extends Connection<MysqlConfig> {
    /**
     * The query grammar implementation.
     */
    protected queryGrammar!: MysqlGrammar;

    /**
     * The schema grammar implementation.
     */
    protected schemaGrammar!: SchemaGrammar;

    /**
     * create Connector
     */
    protected createConnector(): MysqlConnector {
        return new MysqlConnector();
    }

    /**
     * set Default Query Grammar
     */
    protected setDefaultQueryGrammar(): void {
        this.queryGrammar = new MysqlGrammar().setTablePrefix(this.tablePrefix);
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
    public getQueryGrammar(): MysqlGrammar {
        return this.queryGrammar;
    }
}

export default MysqlConnection;
