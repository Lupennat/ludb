import BaseGrammarI from '../types/base-grammar';

abstract class ExpressionContract {
    /**
     * Get the value of the expression.
     */
    public abstract getValue(grammar: BaseGrammarI): string | number | bigint;

    /**
     * clone Expression
     */
    public abstract clone(): ExpressionContract;
}

export default ExpressionContract;
