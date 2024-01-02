import { PdoError } from 'lupdo';
import ExpressionContract from '../query/expression-contract';
import { ConnectionSessionI } from '../types/connection';
import { BindingExclude, BindingExcludeObject } from '../types/generics';

class QueryError extends PdoError {
    /**
     * Create a new query exception instance.
     */
    constructor(
        protected connection: ConnectionSessionI,
        protected sql: string,
        protected bindings: BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract>,
        error: Error
    ) {
        super(error);
        this.message = this.formatMessage();
    }

    /**
     * Format the SQL error message.
     */
    protected formatMessage(): string {
        const sql = this.connection.getQueryGrammar().substituteBindingsIntoRawSql(this.sql, this.bindings);

        return `${this.cause.message} (Connection: ${this.connection.getName()}, SQL: ${sql})`;
    }

    /**
     * Get the connection name for the query.
     */
    public getConnectionName(): string {
        return this.connection.getName();
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
    public getBindings(): BindingExclude<ExpressionContract>[] | BindingExcludeObject<ExpressionContract> {
        return this.bindings;
    }
}

export default QueryError;
