import { ConnectionSessionI } from '../types/connection';
import { Stringable } from '../types/generics';
import JoinClauseI, { JoinClauseConstructor } from '../types/query/join-clause';
import QueryBuilderI, {
    ConditionBoolean,
    QueryAbleCallback,
    QueryBuilderConstructor,
    WhereColumnTuple
} from '../types/query/query-builder';
import RegistryI, { BindingTypes } from '../types/query/registry';
import AbstractQueryBuilder from './common-query-builder';
import ExpressionContract from './expression-contract';

class JoinClause<Parent extends QueryBuilderI = QueryBuilderI> extends AbstractQueryBuilder implements JoinClauseI {
    protected parentConnection: ConnectionSessionI;
    protected parentClass: QueryBuilderConstructor<Parent>;

    constructor(parentQuery: Parent, public type: string, public table: string | ExpressionContract) {
        const connection = parentQuery.getConnection();
        super(connection);
        this.parentConnection = connection;
        this.parentClass = parentQuery.constructor as QueryBuilderConstructor<Parent>;
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
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean
    ): this;
    public on(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        if (this.isQueryableCallback<JoinClauseI>(first)) {
            return this.whereNested(first, boolean);
        }

        return this.whereColumn(first, operatorOrSecond, second, boolean);
    }

    /**
     * Add an "or on" clause to the join.
     */
    public orOn(first: WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>): this;
    public orOn(first: Stringable, second: Stringable): this;
    public orOn(first: Stringable, operator: string, second: Stringable): this;
    public orOn(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback<JoinClauseI>,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.on(first, operatorOrSecond, second, 'or');
    }

    /**
     * Get a new join clause.
     */
    protected newJoinClause<T extends QueryBuilderI>(parentQuery: T, type: string, table: Stringable): JoinClauseI {
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
    protected forSubQuery(): QueryBuilderI {
        return this.newParentQuery().newQuery();
    }

    /**
     * Create a new parent query instance.
     */
    protected newParentQuery(): Parent {
        return new this.parentClass(this.parentConnection);
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
