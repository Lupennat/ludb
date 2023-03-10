import { BetweenColumnsTuple, BetweenTuple } from '../types/query/builder';
import JoinClauseI from '../types/query/join-clause';
import RegistryI, {
    Aggregate,
    BindingTypes,
    Having,
    HavingBetween,
    Order,
    Union,
    Where,
    WhereBetween,
    WhereBetweenColumns,
    WhereContains,
    WhereIn,
    WhereInRaw,
    WhereMultiColumn,
    whereFulltext
} from '../types/query/registry';

export default function createRegistry(): RegistryI {
    return {
        useWritePdo: false,
        bindings: {
            select: [],
            from: [],
            join: [],
            where: [],
            groupBy: [],
            having: [],
            order: [],
            union: [],
            unionOrder: []
        },
        aggregate: null,
        columns: null,
        distinct: false,
        from: '',
        indexHint: null,
        joins: [],
        wheres: [],
        groups: [],
        havings: [],
        orders: [],
        limit: null,
        offset: null,
        unions: [],
        unionLimit: null,
        unionOffset: null,
        unionOrders: [],
        lock: null,
        beforeQueryCallbacks: []
    };
}

function cloneAggregated(aggregate: Aggregate | null): Aggregate | null {
    if (aggregate === null) {
        return null;
    }

    return {
        fnName: aggregate.fnName,
        columns: aggregate.columns.slice()
    };
}

function cloneJoins(joins: JoinClauseI[]): JoinClauseI[] {
    return joins.reduce((carry: JoinClauseI[], join: JoinClauseI) => {
        carry.push(join.clone());
        return carry;
    }, []);
}

function cloneWheres(wheres: Where[]): Where[] {
    return wheres.reduce((carry: Where[], where: Where) => {
        if ('query' in where) {
            const { query, ...rest } = where;
            carry.push({ ...rest, query: query.clone() });
        } else if (['In'].includes(where.type)) {
            const { values, ...rest } = where as WhereIn;
            carry.push({ ...rest, values: values.slice() });
        } else if (['InRaw'].includes(where.type)) {
            const { values, ...rest } = where as WhereInRaw;
            carry.push({ ...rest, values: values.slice() });
        } else if (['BetweenColumns'].includes(where.type)) {
            const { values, ...rest } = where as WhereBetweenColumns;
            carry.push({ ...rest, values: values.slice() as BetweenColumnsTuple });
        } else if (['Between'].includes(where.type)) {
            const { values, ...rest } = where as WhereBetween;
            carry.push({ ...rest, values: values.slice() as BetweenTuple });
        } else if (['JsonContains'].includes(where.type)) {
            const { value, ...rest } = where as WhereContains;
            carry.push({ ...rest, value: Array.isArray(value) ? value.slice() : value });
        } else if (['RowValues'].includes(where.type)) {
            const { values, columns, ...rest } = where as WhereMultiColumn;
            carry.push({ ...rest, values: values.slice(), columns: columns.slice() });
        } else if (['Fulltext'].includes(where.type)) {
            const { options, columns, ...rest } = where as whereFulltext;
            carry.push({ ...rest, options: { ...options }, columns: columns.slice() });
        } else {
            carry.push({ ...where });
        }
        return carry;
    }, []);
}

function cloneHavings(havings: Having[]): Having[] {
    return havings.reduce((carry: Having[], having: Having) => {
        if ('query' in having) {
            const { query, ...rest } = having;
            carry.push({ ...rest, query: query.clone() });
        } else if (['Between', 'NotBetween'].includes(having.type)) {
            const { values, ...rest } = having as HavingBetween;
            carry.push({ ...rest, values: values.slice() as BetweenTuple });
        } else {
            carry.push({ ...having });
        }
        return carry;
    }, []);
}

function cloneOrders(orders: Order[]): Order[] {
    return orders.reduce((carry: Order[], order: Order) => {
        carry.push({ ...order });
        return carry;
    }, []);
}

function cloneUnions(unions: Union[]): Union[] {
    return unions.reduce((carry: Union[], union: Union) => {
        carry.push({
            query: union.query.clone(),
            all: union.all
        });
        return carry;
    }, []);
}

function cloneBindings(bindings: BindingTypes, bindingsToExclude: (keyof BindingTypes)[]): BindingTypes {
    const clonedBindings = {} as BindingTypes;

    for (const key of Object.keys(bindings)) {
        if (bindingsToExclude.includes(key as keyof BindingTypes)) {
            clonedBindings[key as keyof BindingTypes] = [];
        } else {
            clonedBindings[key as keyof BindingTypes] = bindings[key as keyof BindingTypes].slice();
        }
    }

    return clonedBindings;
}

function cloneBase(
    cloned: RegistryI,
    registry: RegistryI,
    propertiesToExclude: (keyof RegistryI)[] = [],
    bindingsToExclude: (keyof BindingTypes)[] = []
): RegistryI {
    if (!propertiesToExclude.includes('useWritePdo')) {
        cloned.useWritePdo = registry.useWritePdo;
    }

    if (!propertiesToExclude.includes('bindings')) {
        cloned.bindings = cloneBindings(registry.bindings, bindingsToExclude);
    }

    if (!propertiesToExclude.includes('aggregate')) {
        cloned.aggregate = cloneAggregated(registry.aggregate);
    }

    if (!propertiesToExclude.includes('columns')) {
        cloned.columns = registry.columns === null ? null : registry.columns.slice();
    }

    if (!propertiesToExclude.includes('distinct')) {
        cloned.distinct = typeof registry.distinct === 'boolean' ? registry.distinct : registry.distinct.slice();
    }

    if (!propertiesToExclude.includes('from')) {
        cloned.from = registry.from;
    }

    if (!propertiesToExclude.includes('indexHint')) {
        cloned.indexHint = registry.indexHint;
    }

    if (!propertiesToExclude.includes('joins')) {
        cloned.joins = cloneJoins(registry.joins);
    }

    if (!propertiesToExclude.includes('wheres')) {
        cloned.wheres = cloneWheres(registry.wheres);
    }

    if (!propertiesToExclude.includes('groups')) {
        cloned.groups = registry.groups.slice();
    }

    if (!propertiesToExclude.includes('havings')) {
        cloned.havings = cloneHavings(registry.havings);
    }

    if (!propertiesToExclude.includes('orders')) {
        cloned.orders = cloneOrders(registry.orders);
    }

    if (!propertiesToExclude.includes('limit')) {
        cloned.limit = registry.limit;
    }

    if (!propertiesToExclude.includes('offset')) {
        cloned.offset = registry.offset;
    }

    if (!propertiesToExclude.includes('unions')) {
        cloned.unions = cloneUnions(registry.unions);
    }

    if (!propertiesToExclude.includes('unionLimit')) {
        cloned.unionLimit = registry.unionLimit;
    }

    if (!propertiesToExclude.includes('unionOffset')) {
        cloned.unionOffset = registry.unionOffset;
    }

    if (!propertiesToExclude.includes('unionOrders')) {
        cloned.unionOrders = cloneOrders(registry.unionOrders);
    }

    if (!propertiesToExclude.includes('lock')) {
        cloned.lock = registry.lock;
    }

    if (!propertiesToExclude.includes('beforeQueryCallbacks')) {
        cloned.beforeQueryCallbacks = registry.beforeQueryCallbacks.slice();
    }

    return cloned;
}

export function cloneRegistry(registry: RegistryI): RegistryI {
    return cloneBase(createRegistry(), registry);
}

export function cloneRegistryWithoutProperties(
    registry: RegistryI,
    propertiesToExclude: (keyof RegistryI)[]
): RegistryI {
    return cloneBase(createRegistry(), registry, propertiesToExclude);
}

export function cloneRegistryWithoutBindings(
    registry: RegistryI,
    bindingsToExclude: (keyof BindingTypes)[]
): RegistryI {
    return cloneBase(createRegistry(), registry, [], bindingsToExclude);
}
