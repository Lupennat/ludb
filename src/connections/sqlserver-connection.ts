import SqlServerGrammar from '../query/grammars/sqlserver-grammar';
import SqlServerProcessor from '../query/processors/sqlserver-processor';
import ProcessorI from '../types/processor';
import GrammarI from '../types/query/grammar';
import Connection from './connection';

class SqlServerConnection extends Connection {
    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): GrammarI {
        return this.withTablePrefix(new SqlServerGrammar());
    }

    // /**
    //  * Get a schema builder instance for the connection.
    //  *
    //  * @return \Illuminate\Database\Schema\SqlServerBuilder
    //  */
    // public function getSchemaBuilder()
    // {
    //     if (is_null($this->schemaGrammar)) {
    //         $this->useDefaultSchemaGrammar();
    //     }

    //     return new SqlServerBuilder($this);
    // }

    // /**
    //  * Get the default schema grammar instance.
    //  *
    //  * @return \Illuminate\Database\Schema\Grammars\SqlServerGrammar
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
    //     throw new RuntimeException('Schema dumping is not supported when using SQL Server.');
    // }

    /**
     * Get the default post processor instance.
     */
    protected getDefaultPostProcessor(): ProcessorI {
        return new SqlServerProcessor();
    }
}

export default SqlServerConnection;
