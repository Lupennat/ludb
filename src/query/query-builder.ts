import { Stringable } from '../types/generics';
import JoinClauseI from '../types/query/join-clause';
import QueryBuilderI from '../types/query/query-builder';
import RegistryI, { BindingTypes } from '../types/query/registry';
import CommonQueryBuilder from './common-query-builder';
import JoinClause from './join-clause';

class QueryBuilder extends CommonQueryBuilder {
    /**
     * Get a new join clause.
     */
    protected newJoinClause<T extends QueryBuilderI>(parentQuery: T, type: string, table: Stringable): JoinClauseI {
        return new JoinClause<T>(parentQuery, type, table);
    }

    /**
     * Create a new query instance for a sub-query.
     */
    protected forSubQuery(): QueryBuilderI {
        return super.forSubQuery();
    }

    /**
     * Get a new instance of the query builder.
     */
    public newQuery(): QueryBuilderI {
        return super.newQuery();
    }

    /**
     * Clone the query.
     */
    public clone(): QueryBuilderI {
        return super.clone();
    }

    /**
     * Clone the query without the given registry properties.
     */
    public cloneWithout(properties: (keyof RegistryI)[]): QueryBuilderI {
        return super.cloneWithout(properties);
    }

    /**
     * Clone the query without the given bindings.
     */
    public cloneWithoutBindings(except: (keyof BindingTypes)[]): QueryBuilderI {
        return super.cloneWithoutBindings(except);
    }
}

export default QueryBuilder;
