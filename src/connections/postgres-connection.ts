import PostgresGrammar from '../query/grammars/postgres-grammar';
import SchemaBuilder from '../schema/builders/postgres-builder';
import SchemaGrammar from '../schema/grammars/postgres-grammar';
import Connection from './connection';

class PostgresConnection extends Connection {
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

    // /**
    //  * Get the schema state for the connection.
    //  *
    //  * @param  \Illuminate\Filesystem\Filesystem|null  $files
    //  * @param  callable|null  $processFactory
    //  * @return \Illuminate\Database\Schema\PostgresSchemaState
    //  */
    // public function getSchemaState(Filesystem $files = null, callable $processFactory = null)
    // {
    //     return new PostgresSchemaState($this, $files, $processFactory);
    // }
}

export default PostgresConnection;
