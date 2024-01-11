import { Stringable } from '../types/generics';
import GrammarBuilderI from '../types/query/grammar-builder';
import JoinClauseI from '../types/query/join-clause';
import RegistryI, { BindingTypes } from '../types/query/registry';
import CommonGrammarBuilder from './common-grammar-builder';
import JoinClause from './join-clause';

class GrammarBuilder extends CommonGrammarBuilder {
    /**
     * Get a new join clause.
     */
    protected newJoinClause<T extends GrammarBuilderI>(parentQuery: T, type: string, table: Stringable): JoinClauseI {
        return new JoinClause<T>(parentQuery, type, table);
    }

    /**
     * Create a new query instance for a sub-query.
     */
    protected forSubQuery(): GrammarBuilderI {
        return super.forSubQuery();
    }

    /**
     * Get a new instance of the query builder.
     */
    public newQuery(): GrammarBuilderI {
        return super.newQuery();
    }

    /**
     * Clone the query.
     */
    public clone(): GrammarBuilderI {
        return super.clone();
    }

    /**
     * Clone the query without the given registry properties.
     */
    public cloneWithout(properties: (keyof RegistryI)[]): GrammarBuilderI {
        return super.cloneWithout(properties);
    }

    /**
     * Clone the query without the given bindings.
     */
    public cloneWithoutBindings(except: (keyof BindingTypes)[]): GrammarBuilderI {
        return super.cloneWithoutBindings(except);
    }
}

export default GrammarBuilder;
