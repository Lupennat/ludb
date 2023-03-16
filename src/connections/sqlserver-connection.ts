import SqlServerGrammar from '../query/grammars/sqlserver-grammar';
import SchemaBuilder from '../schema/builders/sqlserver-builder';
import SchemaGrammar from '../schema/grammars/sqlserver-grammar';
import Connection from './connection';

class SqlServerConnection extends Connection {
    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): SqlServerGrammar {
        return this.withTablePrefix(new SqlServerGrammar());
    }

    /**
     * Get a schema builder instance for the connection.
     */
    public getSchemaBuilder(): SchemaBuilder {
        return new SchemaBuilder(this.sessionSchema());
    }

    /**
     * Get the default schema grammar instance.
     */
    protected getDefaultSchemaGrammar(): SchemaGrammar {
        return new SchemaGrammar();
    }
}

export default SqlServerConnection;
