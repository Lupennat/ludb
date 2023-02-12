import ExpressionContract from './expression-contract';

class Expression extends ExpressionContract {
    /**
     * Create a new raw query expression.
     */
    public constructor(protected value: string | number | bigint) {
        super();
    }

    /**
     * Get the value of the expression.
     */
    public getValue(): string | number | bigint {
        return this.value;
    }
}

export default Expression;
