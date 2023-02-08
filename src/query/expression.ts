class Expression extends String {
    public clone(): Expression {
        return new Expression(this.toString());
    }
}

export default Expression;
