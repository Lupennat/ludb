import SqlServerGrammar from '../query/grammars/sqlserver-grammar';
import GrammarI from '../types/query/grammar';
import Connection from './connection';

class SqlServerConnection extends Connection {
    // /**
    //  * Execute a Closure within a transaction.
    //  *
    //  * @param  \Closure  $callback
    //  * @param  int  $attempts
    //  * @return mixed
    //  *
    //  * @throws \Throwable
    //  */
    // public function transaction(Closure $callback, $attempts = 1)
    // {
    //     for ($a = 1; $a <= $attempts; $a++) {
    //         if ($this->getDriverName() === 'sqlsrv') {
    //             return parent::transaction($callback, $attempts);
    //         }

    //         $this->getPdo()->exec('BEGIN TRAN');

    //         // We'll simply execute the given callback within a try / catch block
    //         // and if we catch any exception we can rollback the transaction
    //         // so that none of the changes are persisted to the database.
    //         try {
    //             $result = $callback($this);

    //             $this->getPdo()->exec('COMMIT TRAN');
    //         }

    //         // If we catch an exception, we will rollback so nothing gets messed
    //         // up in the database. Then we'll re-throw the exception so it can
    //         // be handled how the developer sees fit for their applications.
    //         catch (Throwable $e) {
    //             $this->getPdo()->exec('ROLLBACK TRAN');

    //             throw $e;
    //         }

    //         return $result;
    //     }
    // }

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

    // /**
    //  * Get the default post processor instance.
    //  *
    //  * @return \Illuminate\Database\Query\Processors\SqlServerProcessor
    //  */
    // protected function getDefaultPostProcessor()
    // {
    //     return new SqlServerProcessor;
    // }
}

export default SqlServerConnection;
