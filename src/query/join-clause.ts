import { ConnectionSessionI } from '../types/connection';
import ProcessorI from '../types/processor';
import BuilderI, {
    BuilderConstructor,
    ConditionBoolean,
    QueryAbleCallback,
    Stringable,
    WhereColumnTuple
} from '../types/query/builder';

import GrammarI from '../types/query/grammar';
import JoinClauseI, { JoinClauseConstructor } from '../types/query/join-clause';
import Registry, { BindingTypes } from '../types/query/registry';
import BaseBuilder from './base-builder';
import BuilderContract from './builder-contract';
import Expression from './expression';
import { cloneRegistry, cloneRegistryWithoutBindings, cloneRegistryWithoutProperties } from './registry';

class JoinClause extends BaseBuilder implements JoinClauseI {
    protected parentGrammar: GrammarI;
    protected parentProcessor: ProcessorI;
    protected parentConnection: ConnectionSessionI;
    protected parentClass: BuilderConstructor;

    constructor(parentQuery: BuilderContract, public type: string, public table: string | Expression) {
        const connection = parentQuery.getConnection();
        const grammar = parentQuery.getGrammar();
        const processor = parentQuery.getProcessor();
        super(connection, grammar, processor);
        this.parentGrammar = grammar;
        this.parentProcessor = processor;
        this.parentConnection = connection;
        this.parentClass = parentQuery.constructor as BuilderConstructor;
    }

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
    public on(first: WhereColumnTuple[] | QueryAbleCallback): this;
    public on(first: Stringable, second: Stringable): this;
    public on(first: Stringable, operator: string, second: Stringable): this;
    public on(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond?: Stringable | null,
        second?: Stringable | null,
        boolean?: ConditionBoolean
    ): this;
    public on(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null,
        boolean: ConditionBoolean = 'and'
    ): this {
        if (typeof first === 'function') {
            return this.whereNested(first, boolean);
        }

        return this.whereColumn(first, operatorOrSecond, second, boolean);
    }

    /**
     * Add an "or on" clause to the join.
     */
    public orOn(first: WhereColumnTuple[] | QueryAbleCallback): this;
    public orOn(first: Stringable, second: Stringable): this;
    public orOn(first: Stringable, operator: string, second: Stringable): this;
    public orOn(
        first: Stringable | WhereColumnTuple[] | QueryAbleCallback,
        operatorOrSecond: Stringable | null = null,
        second: Stringable | null = null
    ): this {
        return this.on(first, operatorOrSecond, second, 'or');
    }

    /**
     * Get a new join clause.
     */
    protected newJoinClause(parentQuery: BuilderContract, type: string, table: Stringable): JoinClauseI {
        return new (this.constructor as JoinClauseConstructor)(parentQuery, type, table);
    }

    /**
     * Get a new instance of the join clause builder.
     */
    public newQuery(): JoinClauseI {
        return new (this.constructor as JoinClauseConstructor)(this.newParentQuery(), this.type, this.table);
    }

    /**
     * Create a new query instance for sub-query.
     */
    protected forSubQuery(): BuilderI {
        return this.newParentQuery().newQuery();
    }

    /**
     * Create a new parent query instance.
     */
    protected newParentQuery(): BuilderI {
        return new this.parentClass(this.parentConnection, this.parentGrammar, this.parentProcessor);
    }

    public clone(): JoinClauseI {
        return this.newQuery().setRegistry(cloneRegistry(this.registry));
    }

    public cloneWithout(properties: (keyof Registry)[]): JoinClauseI {
        return this.newQuery().setRegistry(cloneRegistryWithoutProperties(this.registry, properties));
    }

    public cloneWithoutBindings(except: (keyof BindingTypes)[]): JoinClauseI {
        return this.newQuery().setRegistry(cloneRegistryWithoutBindings(this.registry, except));
    }
}

export default JoinClause;