import MySqlGrammar from '../query/grammars/mysql-grammar';
import MySqlProcessor from '../query/processors/mysql-processor';
import ProcessorI from '../types/processor';
import GrammarI from '../types/query/grammar';
import Connection from './connection';

class MySqlConnection extends Connection {
    /**
     * Determine if the connected database is a MariaDB database.
     */
    public isMaria(): boolean {
        return this.config.driver === 'mariadb';
    }

    /**
     * Get the default query grammar instance.
     */
    protected getDefaultQueryGrammar(): GrammarI {
        return this.withTablePrefix(new MySqlGrammar());
    }

    // /**
    //  * Get a schema builder instance for the connection.
    //  *
    //  * @return \Illuminate\Database\Schema\MySqlBuilder
    //  */
    // public function getSchemaBuilder()
    // {
    //     if (is_null($this->schemaGrammar)) {
    //         $this->useDefaultSchemaGrammar();
    //     }

    //     return new MySqlBuilder($this);
    // }

    /**
    //  * Get the default schema grammar instance.
    //  *
    //  * @return \Illuminate\Database\Schema\Grammars\MySqlGrammar
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
    //  * @return \Illuminate\Database\Schema\MySqlSchemaState
    //  */
    // public function getSchemaState(Filesystem $files = null, callable $processFactory = null)
    // {
    //     return new MySqlSchemaState($this, $files, $processFactory);
    // }

    /**
     * Get the default post processor instance.
     */
    protected getDefaultPostProcessor(): ProcessorI {
        return new MySqlProcessor();
    }
}

export default MySqlConnection;
