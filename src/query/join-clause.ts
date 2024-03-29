import { ConnectionSessionI } from '../types/connection';
import { Stringable } from '../types/generics';
import GrammarBuilderI, {
    ConditionBoolean,
    GrammarBuilderConstructor,
    QueryAbleCallback,
    WhereColumnTuple
} from '../types/query/grammar-builder';
import JoinClauseI, { JoinClauseConstructor } from '../types/query/join-clause';
import RegistryI, { BindingTypes } from '../types/query/registry';
import AbstractGrammarBuilder from './common-grammar-builder';
import ExpressionContract from './expression-contract';

class JoinClause<Parent extends GrammarBuilderI = GrammarBuilderI>
    extends AbstractGrammarBuilder
    implements JoinClauseI
{
    protected parentConnection: ConnectionSessionI;
    protected parentClass: GrammarBuilderConstructor<Parent>;

    constructor(
        parentQuery: Parent,
        public type: string,
        public table: string | ExpressionContract
    ) {
        const connection = parentQuery.getConnection();
        super(connection);
        this.parentConnection = connection;
        this.parentClass = parentQuery.constructor as GrammarBuilderConstructor<Parent>;
    }

    /**
     * The "on" clause to the join implementation.
     */
    protected onImplementation(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        if (this.isQueryableCallback<JoinClauseI>(first)) {
            return this.whereNested(first, boolean);
        }

        return this.whereColumnImplementation(first, operatorOrSecond, second, boolean);
    }

    /**
     * Add an "on" clause to the join.
     *
     * On clauses can be chained, e.g.
     *
     *  join.on('contacts.user_id', '=', 'users.id')
     *      .on('contacts.info_id', '=', 'info.id')
     *
     * will produce the following SQL:
     *
     * on `contacts`.`user_id` = `users`.`id` and `contacts`.`info_id` = `info`.`id`
     */
    public on(first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public on(first: Stringable, second: Stringable): this;
    public on(first: Stringable, operator: string, second: Stringable): this;
    public on(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>,
        operatorOrSecond?: Stringable,
        second?: Stringable
    ): this {
        return this.onImplementation(first, operatorOrSecond, second);
    }

    /**
     * Add an "or on" clause to the join.
     */
    public orOn(first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public orOn(first: Stringable, second: Stringable): this;
    public orOn(first: Stringable, operator: string, second: Stringable): this;
    public orOn(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>,
        operatorOrSecond?: Stringable,
        second?: Stringable
    ): this {
        return this.onImplementation(first, operatorOrSecond, second, 'or');
    }

    /**
     * Get a new join clause.
     */
    protected newJoinClause<T extends GrammarBuilderI>(parentQuery: T, type: string, table: Stringable): JoinClauseI {
        return new (this.constructor as JoinClauseConstructor<T>)(parentQuery, type, table);
    }

    /**
     * Get a new instance of the join clause builder.
     */
    public newQuery(): JoinClauseI {
        return new (this.constructor as JoinClauseConstructor<Parent>)(this.newParentQuery(), this.type, this.table);
    }

    /**
     * Create a new query instance for sub-query.
     */
    protected forSubQuery(): GrammarBuilderI {
        return this.newParentQuery().newQuery();
    }

    /**
     * Create a new parent query instance.
     */
    protected newParentQuery(): Parent {
        return new this.parentClass(this.parentConnection);
    }

    /**
     * Create a new query instance for nested where condition.
     */
    public forNestedWhere(): JoinClauseI {
        return super.forNestedWhere();
    }

    /**
     * Clone the query.
     */
    public clone(): JoinClauseI {
        return super.clone();
    }

    /**
     * Clone the query without the given registry properties.
     */
    public cloneWithout(properties: (keyof RegistryI)[]): JoinClauseI {
        return super.cloneWithout(properties);
    }

    /**
     * Clone the query without the given bindings.
     */
    public cloneWithoutBindings(except: (keyof BindingTypes)[]): JoinClauseI {
        return super.cloneWithoutBindings(except);
    }
}

export default JoinClause;
