import ExpressionContract from '../../query/expression-contract';
import BuilderI, { ConditionBoolean, QueryAbleCallback, Stringable, WhereColumnTuple } from './builder';
import Registry, { BindingTypes } from './registry';

export type JoinClauseConstructor = new (parentQuery: BuilderI, type: string, table: Stringable) => JoinClauseI;

export default interface JoinClauseI extends BuilderI {
    type: string;
    table: string | ExpressionContract;

    /**
     * Add an "on" clause to the join.
     *
     * On clauses can be chained, e.g.
     *
     *  $join->on('contacts.user_id', '=', 'users.id')
     *       ->on('contacts.info_id', '=', 'info.id')
     *
     * will produce the following SQL:
     *
     * on `contacts`.`user_id` = `users`.`id` and `contacts`.`info_id` = `info`.`id`
     */
    on(first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    on(first: Stringable, second: Stringable): this;
    on(first: Stringable, operator: string, second: Stringable): this;
    on(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean
    ): this;

    /**
     * Add an "or on" clause to the join.
     */
    orOn(first: WhereColumnTuple[] | QueryAbleCallback<this>): this;
    orOn(first: Stringable, second: Stringable): this;
    orOn(first: Stringable, operator: string, second: Stringable): this;
    orOn(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<this>,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null
    ): this;

    /**
     * Get a new instance of the join clause builder.
     */
    newQuery(): JoinClauseI;

    /**
     * Clone the query.
     */
    clone(): JoinClauseI;

    /**
     * Clone the query without the given registry properties.
     */
    cloneWithout(properties: (keyof Registry)[]): JoinClauseI;

    /**
     * Clone the query without the given bindings.
     */
    cloneWithoutBindings(except: (keyof BindingTypes)[]): JoinClauseI;
}
