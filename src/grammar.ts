/* eslint-disable @typescript-eslint/no-unused-vars */

import Expression from './query/expression';
import BaseGrammarI from './types/base-grammar';
import { Binding, Stringable } from './types/query/builder';

abstract class Grammar implements BaseGrammarI {
    /**
     * The grammar table prefix.
     */
    protected tablePrefix = '';

    /**
     * Wrap an array of values.
     */
    public wrapArray(values: Stringable[]): string[] {
        return values.map((value: Stringable) => this.wrap(value));
    }

    /**
     * Wrap a table in keyword identifiers.
     */
    public wrapTable(table: Stringable): string {
        if (!this.isExpression(table)) {
            return this.wrap(`${this.tablePrefix}${table}`, true);
        }

        return this.getValue(table as Expression);
    }

    /**
     * Wrap a value in keyword identifiers.
     */
    public wrap(value: Stringable, prefixAlias = false): string {
        if (this.isExpression(value)) {
            return this.getValue(value as Expression);
        }

        // If the value being wrapped has a column alias we will need to separate out
        // the pieces so we can wrap each of the segments of the expression on its
        // own, and then join these both back together using the "as" connector.
        if (value.toLowerCase().includes(' as ')) {
            return this.wrapAliasedValue(value as string, prefixAlias);
        }

        // If the given value is a JSON selector we will wrap it differently than a
        // traditional value. We will need to split this path and wrap each part
        // wrapped, etc. Otherwise, we will simply wrap the value as a string.
        if (this.isJsonSelector(value)) {
            return this.wrapJsonSelector(value);
        }

        return this.wrapSegments((value as string).split('.'));
    }

    /**
     * Wrap a value that has an alias.
     */
    protected wrapAliasedValue(value: string, prefixAlias = false): string {
        const segments = value.split(new RegExp(/\s+as\s+/, 'gmi'));

        // If we are wrapping a table we need to prefix the alias with the table prefix
        // as well in order to generate proper syntax. If this is a column of course
        // no prefix is necessary. The condition will be true when from wrapTable.
        if (prefixAlias) {
            segments[1] = `${this.tablePrefix}${segments[1] ?? ''}`;
        }

        return `${this.wrap(segments[0])} as ${this.wrapValue(segments[1] ?? '')}`;
    }

    /**
     * Wrap the given value segments.
     */
    protected wrapSegments(segments: string[]): string {
        return segments
            .reduce((carry: string[], segment: string, index: number) => {
                carry.push(index === 0 && segments.length > 1 ? this.wrapTable(segment) : this.wrapValue(segment));
                return carry;
            }, [])
            .join('.');
    }

    /**
     * Wrap a single string in keyword identifiers.
     */
    protected wrapValue(value: string): string {
        if (value !== '*') {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }

    /**
     * Wrap the given JSON selector.
     */
    protected wrapJsonSelector(_value: Stringable): string {
        throw new Error('This database engine does not support JSON operations.');
    }

    /**
     * Determine if the given string is a JSON selector.
     */
    protected isJsonSelector(value: Stringable): boolean {
        return value.toString().includes('->');
    }

    /**
     * Convert an array of column names into a delimited string.
     */
    public columnize(columns: Stringable[]): string {
        return columns.map((column: Stringable) => this.wrap(column)).join(', ');
    }

    /**
     * Create query parameter place-holders for an array.
     */
    public parameterize(values: Binding[]): string {
        return values.map((value: Binding) => this.parameter(value)).join(', ');
    }

    /**
     * Get the appropriate query parameter place-holder for a value.
     */
    public parameter(value: Binding | Binding[]): string {
        return this.isExpression(value) ? this.getValue(value as Expression) : '?';
    }

    /**
     * Quote the given string literal.
     */
    public quoteString(value: string | string[]): string {
        if (Array.isArray(value)) {
            return value.map((val: string) => this.quoteString(val)).join(', ');
        }

        return `'${value}'`;
    }

    /**
     * Determine if the given value is a raw expression.
     */
    public isExpression(value: any): boolean {
        return typeof value === 'object' && value instanceof Expression;
    }

    /**
     * Get the value of a raw expression.
     */
    public getValue(expression: Expression): string {
        return expression.toString();
    }

    /**
     * Get the format for database stored dates.
     */
    public getDateFormat(): string {
        return 'Y-m-d H:i:s';
    }

    /**
     * Get the grammar's table prefix.
     */
    public getTablePrefix(): string {
        return this.tablePrefix;
    }

    /**
     * Set the grammar's table prefix.
     */
    public setTablePrefix(prefix: string): this {
        this.tablePrefix = prefix;
        return this;
    }
}

export default Grammar;
