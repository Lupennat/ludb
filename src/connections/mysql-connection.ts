import MySqlGrammar from '../query/grammars/mysql-grammar';
import SchemaBuilder from '../schema/builders/mysql-builder';
import SchemaGrammar from '../schema/grammars/mysql-grammar';
import MysqlConnectionI from '../types/connection/mysql-connection';
import Connection from './connection';

class MySqlConnection extends Connection implements MysqlConnectionI {
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
}

export default MySqlConnection;
