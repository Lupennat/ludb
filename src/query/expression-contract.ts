import Grammar from '../grammar';

abstract class ExpressionContract {
    /**
     * Get the value of the expression.
     */
    public abstract getValue(grammar: Grammar): string | number | bigint;
}

export default ExpressionContract;
