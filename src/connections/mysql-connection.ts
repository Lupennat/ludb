import MySqlGrammar from '../query/grammars/mysql-grammar';
import SchemaBuilder from '../schema/builders/mysql-builder';
import SchemaGrammar from '../schema/grammars/mysql-grammar';
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
    protected getDefaultQueryGrammar(): MySqlGrammar {
        return this.withTablePrefix(new MySqlGrammar());
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
    //  * @return \Illuminate\Database\Schema\MySqlSchemaState
    //  */
    // public function getSchemaState(Filesystem $files = null, callable $processFactory = null)
    // {
    //     return new MySqlSchemaState($this, $files, $processFactory);
    // }
}

export default MySqlConnection;
