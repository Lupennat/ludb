import { PdoError } from 'lupdo';
import ExpressionContract from '../query/expression-contract';
import { ConnectionSessionI } from '../types/connection';
import { BindingExclude, BindingExcludeObject } from '../types/query/builder';
import { escapeQuoteForSql, isTypedBinding } from '../utils';

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
     * Format Value
     */
    protected getStringQuoteValue(binding: BindingExclude<null | ExpressionContract>): string {
        if (isTypedBinding(binding)) {
            return binding.value === null ? 'null' : `'${escapeQuoteForSql(binding.value.toString())}'`;
        }
        return `'${escapeQuoteForSql(binding.toString())}'`;
    }

    /**
     * Format the SQL error message.
     */
    protected formatMessage(): string {
        let sql = '';
        if (Array.isArray(this.bindings)) {
            const bindings = this.bindings.slice();
            sql = this.sql.replace(/\?/g, () => {
                const binding = bindings.shift();
                return binding == null ? 'null' : this.getStringQuoteValue(binding);
            });
        } else {
            const keys = Object.keys(this.bindings).sort((a, b) => a.length - b.length);
            sql = this.sql;
            for (const key of keys) {
                const binding = this.bindings[key];
                sql = sql.replace(`:${key}`, binding == null ? 'null' : this.getStringQuoteValue(binding));
            }
        }

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
