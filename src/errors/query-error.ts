import { PdoError } from 'lupdo';
import { Binding } from '../types/query/builder';

class QueryError extends PdoError {
    /**
     * Create a new query exception instance.
     */
    constructor(protected connectionName: string, protected sql: string, protected bindings: Binding[], error: Error) {
        super(error);
        this.message = this.formatMessage();
    }

    /**
     * Format the SQL error message.
     */
    protected formatMessage(): string {
        const bindings = this.bindings.slice();
        const sql = this.sql.replace(/\?/g, () => {
            const binding = bindings.shift();
            return binding == null ? 'null' : binding.toString();
        });

        return `${this.cause.message} (Connection: ${this.connectionName}, SQL: ${sql})`;
    }

    /**
     * Get the connection name for the query.
     */
    public getConnectionName(): string {
        return this.connectionName;
    }

    /**
     * Get the SQL for the query.
     */
    public getSql(): string {
        return this.sql;
    }

    /**
     * Get the bindings for the query.
     */
    public getBindings(): Binding[] {
        return this.bindings;
    }
}

export default QueryError;
