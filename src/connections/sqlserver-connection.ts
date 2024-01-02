import SqlserverGrammar from '../query/grammars/sqlserver-grammar';
import SchemaBuilder from '../schema/builders/sqlserver-builder';
import SchemaGrammar from '../schema/grammars/sqlserver-grammar';
import Connection from './connection';

class SqlserverConnection extends Connection {
    /**
     * The query grammar implementation.
     */
    protected queryGrammar!: SqlserverGrammar;

    /**
     * The schema grammar implementation.
     */
    protected schemaGrammar!: SchemaGrammar;

    /**
     * set Default Query Grammar
     */
    protected setDefaultQueryGrammar(): void {
        this.queryGrammar = new SqlserverGrammar().setTablePrefix(this.tablePrefix);
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
    public getQueryGrammar(): SqlserverGrammar {
        return this.queryGrammar;
    }
}

export default SqlserverConnection;
