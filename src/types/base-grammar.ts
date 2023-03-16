import ExpressionContract from '../query/expression-contract';
import { Stringable } from './query/builder';

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
    parameterize(values: any[]): string;

    /**
     * Get the appropriate query parameter place-holder for a value.
     */
    parameter(value: any): string;

    /**
     * Quote the given string literal.
     */
    quoteString(value: string | string[]): string;

    /**
     * Determine if the given value is a raw expression.
     */
    isExpression(value: any): value is ExpressionContract;

    /**
     * Get the value of a raw expression.
     */
    getValue(expression: ExpressionContract): string | bigint | number;
    getValue<T>(value: T): T;
    getValue<T>(expressionOrValue: T): string | bigint | number | T;

    /**
     * Get the grammar's table prefix.
     */
    getTablePrefix(): string;

    /**
     * Set the grammar's table prefix.
     */
    setTablePrefix(prefix: string): this;
}
