import PostgresGrammar from '../query/grammars/postgres-grammar';
import GrammarI from '../types/query/grammar';
import Connection from './connection';

class PostgresConnection extends Connection {
    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): GrammarI {
        return this.withTablePrefix(new PostgresGrammar());
    }

    // /**
    //  * Get a schema builder instance for the connection.
    //  *
    //  * @return \Illuminate\Database\Schema\PostgresBuilder
    //  */
    // public function getSchemaBuilder()
    // {
    //     if (is_null($this->schemaGrammar)) {
    //         $this->useDefaultSchemaGrammar();
    //     }

    //     return new PostgresBuilder($this);
    // }

    // /**
    //  * Get the default schema grammar instance.
    //  *
    //  * @return \Illuminate\Database\Schema\Grammars\PostgresGrammar
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
    //  * @return \Illuminate\Database\Schema\PostgresSchemaState
    //  */
    // public function getSchemaState(Filesystem $files = null, callable $processFactory = null)
    // {
    //     return new PostgresSchemaState($this, $files, $processFactory);
    // }

    // /**
    //  * Get the default post processor instance.
    //  *
    //  * @return \Illuminate\Database\Query\Processors\PostgresProcessor
    //  */
    // protected function getDefaultPostProcessor()
    // {
    //     return new PostgresProcessor;
    // }
}

export default PostgresConnection;
