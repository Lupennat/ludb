import Expression from '../query/expression';

import { Binding, Stringable } from './query/builder';

export interface KeyValues {
    [key: string]: Binding;
}

export default interface BaseGrammarI {
    /**
     * Wrap an array of values.
     */
    wrapArray(values: Stringable[]): string[];

    /**
     * Wrap a table in keyword identifiers.
     */
    wrapTable(table: Stringable): string;

    /**
     * Wrap a value in keyword identifiers.
     */
    wrap(value: Stringable, prefixAlias?: boolean): string;

    /**
     * Convert an array of column names into a delimited string.
     */
    columnize(columns: Stringable[]): string;

    /**
     * Create query parameter place-holders for an array.
     */
    parameterize(values: Binding[]): string;

    /**
     * Get the appropriate query parameter place-holder for a value.
     */
    parameter(value: Binding | Binding[]): string;

    /**
     * Quote the given string literal.
     */
    quoteString(value: string | string[]): string;

    /**
     * Determine if the given value is a raw expression.
     */
    isExpression(value: any): boolean;

    /**
     * Get the value of a raw expression.
     */
    getValue(expression: Expression): string;

    /**
     * Get the format for database stored dates.
     */
    getDateFormat(): string;

    /**
     * Get the grammar's table prefix.
     */
    getTablePrefix(): string;

    /**
     * Set the grammar's table prefix.
     */
    setTablePrefix(prefix: string): this;
}
