import BuilderI, { BuilderConstructor, Stringable } from '../types/query/builder';

import JoinClauseI from '../types/query/join-clause';
import RegistryI, { BindingTypes } from '../types/query/registry';
import BaseBuilder from './base-builder';
import BuilderContract from './builder-contract';

import JoinClause from './join-clause';
import { cloneRegistry, cloneRegistryWithoutBindings, cloneRegistryWithoutProperties } from './registry';

class Builder extends BaseBuilder implements BuilderI {
    /**
     * Get a new join clause.
     */
    protected newJoinClause(parentQuery: BuilderContract, type: string, table: Stringable): JoinClauseI {
        return new JoinClause(parentQuery, type, table);
    }

    /**
     * Get a new instance of the query builder.
     */
    public newQuery(): BuilderI {
        return new (this.constructor as BuilderConstructor)(
            this.getConnection(),
            this.getGrammar(),
            this.getProcessor()
        );
    }

    /**
     * Create a new query instance for a sub-query.
     */
    protected forSubQuery(): BuilderI {
        return this.newQuery();
    }

    public clone(): BuilderI {
        return this.newQuery().setRegistry(cloneRegistry(this.registry));
    }

    public cloneWithout(properties: (keyof RegistryI)[]): BuilderI {
        return this.newQuery().setRegistry(cloneRegistryWithoutProperties(this.registry, properties));
    }

    public cloneWithoutBindings(except: (keyof BindingTypes)[]): BuilderI {
        return this.newQuery().setRegistry(cloneRegistryWithoutBindings(this.registry, except));
    }
}

export default Builder;
