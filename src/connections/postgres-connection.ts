import PostgresGrammar from '../query/grammars/postgres-grammar';
import SchemaBuilder from '../schema/builders/postgres-builder';
import SchemaGrammar from '../schema/grammars/postgres-grammar';
import PostgresConnectionI from '../types/connection/postgres-connection';
import Connection from './connection';

class PostgresConnection extends Connection implements PostgresConnectionI {
    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): PostgresGrammar {
        return this.withTablePrefix(new PostgresGrammar());
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

export default PostgresConnection;
