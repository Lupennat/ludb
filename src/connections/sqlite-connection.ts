import SQLiteGrammar from '../query/grammars/sqlite-grammar';
import SchemaBuilder from '../schema/builders/sqlite-builder';
import SchemaGrammar from '../schema/grammars/sqlite-grammar';
import Connection from './connection';

class SQLiteConnection extends Connection {
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

    // /**
    //  * Get the schema state for the connection.
    //  *
    //  * @param  \Illuminate\Filesystem\Filesystem|null  $files
    //  * @param  callable|null  $processFactory
    //  *
    //  * @throws \RuntimeException
    //  */
    // public function getSchemaState(Filesystem $files = null, callable $processFactory = null)
    // {
    //     return new SqliteSchemaState($this, $files, $processFactory);
    // }
}

export default SQLiteConnection;
