import QueryBuilderI from '../types/query/query-builder';
import RegistryI, { BindingTypes } from '../types/query/registry';
import BaseQueryBuilder from './base-query-builder';

class QueryBuilder extends BaseQueryBuilder implements QueryBuilderI {
    /**
     * Create a new query instance for a sub-query.
     */
    protected forSubQuery(): QueryBuilderI {
        return super.forSubQuery();
    }

    /**
     * Create a new query instance for nested where condition.
     */
    public forNestedWhere(): QueryBuilderI {
        return super.forNestedWhere();
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
