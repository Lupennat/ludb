import SQLiteGrammar from '../query/grammars/sqlite-grammar';
import SQLiteProcessor from '../query/processors/sqlite-processor';
import ProcessorI from '../types/processor';
import GrammarI from '../types/query/grammar';
import Connection from './connection';

class SQLiteConnection extends Connection {
    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): GrammarI {
        return this.withTablePrefix(new SQLiteGrammar());
    }

    // /**
    //  * Get a schema builder instance for the connection.
    //  *
    //  * @return \Illuminate\Database\Schema\SQLiteBuilder
    //  */
    // public function getSchemaBuilder()
    // {
    //     if (is_null($this->schemaGrammar)) {
    //         $this->useDefaultSchemaGrammar();
    //     }

    //     return new SQLiteBuilder($this);
    // }

    // /**
    //  * Get the default schema grammar instance.
    //  *
    //  * @return \Illuminate\Database\Schema\Grammars\SQLiteGrammar
    //  */
    // protected function getDefaultSchemaGrammar()
    // {
    //     return $this->withTablePrefix(new SchemaGrammar);
    // }

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

    /**
     * Get the default post processor instance.
     */
    protected getDefaultPostProcessor(): ProcessorI {
        return new SQLiteProcessor();
    }
}

export default SQLiteConnection;
