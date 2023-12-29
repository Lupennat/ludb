import SQLiteGrammar from '../query/grammars/sqlite-grammar';
import SchemaBuilder from '../schema/builders/sqlite-builder';
import SchemaGrammar from '../schema/grammars/sqlite-grammar';
import SQLiteConnectionI from '../types/connection/sqlite-connection';
import Connection from './connection';

class SQLiteConnection extends Connection implements SQLiteConnectionI {
    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): SQLiteGrammar {
        return this.withTablePrefix(new SQLiteGrammar());
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

export default SQLiteConnection;
