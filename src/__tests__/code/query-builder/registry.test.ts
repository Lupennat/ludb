import Raw from '../../../query/expression';
import IndexHint from '../../../query/index-hint';
import createRegistry, { cloneRegistry } from '../../../query/registry';
import { Binding } from '../../../types/query/builder';
import {
    OrderColumn,
    OrderRaw,
    WhereBetween,
    WhereBetweenColumns,
    WhereContains,
    WhereIn,
    WhereInRaw,
    WhereMultiColumn,
    whereFulltext
} from '../../../types/query/registry';
import { getBuilder, getJoin, pdo } from '../fixtures/mocked';

describe('Query Builder Registry', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Registry', () => {
        expect(createRegistry()).toEqual({
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
        });
    });

    it('Works Clone', () => {
        const registry = createRegistry();
        const cloned = cloneRegistry(registry);
        expect(cloned).toEqual(registry);
    });

    it('Works Clone UseWritePdo', () => {
        const registry = createRegistry();
        registry.useWritePdo = true;
        const cloned = cloneRegistry(registry);
        expect(cloned.useWritePdo).toBeTruthy();
        registry.useWritePdo = false;
        expect(cloned.useWritePdo).toBeTruthy();
    });

    it('Works Clone Bindings', () => {
        const registry = createRegistry();
        registry.bindings.select = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.from = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.join = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.where = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.groupBy = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.having = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.order = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.union = [1, 2, 3, Buffer.from('2'), 'foo', true];
        registry.bindings.unionOrder = [1, 2, 3, Buffer.from('2'), 'foo', true];
        const cloned = cloneRegistry(registry);
        expect(cloned.bindings).toEqual({
            select: [1, 2, 3, Buffer.from('2'), 'foo', true],
            from: [1, 2, 3, Buffer.from('2'), 'foo', true],
            join: [1, 2, 3, Buffer.from('2'), 'foo', true],
            where: [1, 2, 3, Buffer.from('2'), 'foo', true],
            groupBy: [1, 2, 3, Buffer.from('2'), 'foo', true],
            having: [1, 2, 3, Buffer.from('2'), 'foo', true],
            order: [1, 2, 3, Buffer.from('2'), 'foo', true],
            union: [1, 2, 3, Buffer.from('2'), 'foo', true],
            unionOrder: [1, 2, 3, Buffer.from('2'), 'foo', true]
        });
        registry.bindings.select.push('test');
        registry.bindings.from = [];
        registry.bindings.join.slice(0, 3);
        registry.bindings.where.push('test');
        registry.bindings.groupBy.push('test');
        registry.bindings.having.push('test');
        registry.bindings.order.push('test');
        registry.bindings.union.push('test');
        registry.bindings.unionOrder.push('test');
        expect(cloned.bindings).toEqual({
            select: [1, 2, 3, Buffer.from('2'), 'foo', true],
            from: [1, 2, 3, Buffer.from('2'), 'foo', true],
            join: [1, 2, 3, Buffer.from('2'), 'foo', true],
            where: [1, 2, 3, Buffer.from('2'), 'foo', true],
            groupBy: [1, 2, 3, Buffer.from('2'), 'foo', true],
            having: [1, 2, 3, Buffer.from('2'), 'foo', true],
            order: [1, 2, 3, Buffer.from('2'), 'foo', true],
            union: [1, 2, 3, Buffer.from('2'), 'foo', true],
            unionOrder: [1, 2, 3, Buffer.from('2'), 'foo', true]
        });
    });

    it('Works Clone Aggregate', () => {
        const registry = createRegistry();
        registry.aggregate = {
            fnName: 'test',
            columns: ['a', 'b', new Raw('test')]
        };
        const cloned = cloneRegistry(registry);
        expect(cloned.aggregate).toEqual({
            fnName: 'test',
            columns: ['a', 'b', new Raw('test')]
        });
        registry.aggregate = null;
        expect(cloned.aggregate).toEqual({
            fnName: 'test',
            columns: ['a', 'b', new Raw('test')]
        });
        registry.aggregate = {
            fnName: 'test2',
            columns: ['a1', 'b1', new Raw('test2')]
        };
        expect(cloned.aggregate).toEqual({
            fnName: 'test',
            columns: ['a', 'b', new Raw('test')]
        });
    });

    it('Works Clone Columns', () => {
        const registry = createRegistry();
        registry.columns = ['a', 'b', new Raw('test')];
        const cloned = cloneRegistry(registry);
        expect(cloned.columns).toEqual(['a', 'b', new Raw('test')]);
        registry.columns = null;
        expect(cloned.columns).toEqual(['a', 'b', new Raw('test')]);
        registry.columns = ['test2'];
        expect(cloned.columns).toEqual(['a', 'b', new Raw('test')]);
    });

    it('Works Clone Distinct', () => {
        const registry = createRegistry();
        registry.distinct = true;
        let cloned = cloneRegistry(registry);
        expect(cloned.distinct).toBeTruthy();
        registry.distinct = false;
        expect(cloned.distinct).toBeTruthy();
        registry.distinct = ['a', 'b', new Raw('test')];
        expect(cloned.distinct).toBeTruthy();
        cloned = cloneRegistry(registry);
        expect(cloned.distinct).toEqual(['a', 'b', new Raw('test')]);
        registry.distinct = false;
        expect(cloned.distinct).toEqual(['a', 'b', new Raw('test')]);
    });

    it('Works Clone From', () => {
        const registry = createRegistry();
        registry.from = 'table';
        let cloned = cloneRegistry(registry);
        expect(cloned.from).toBe('table');
        registry.from = '';
        expect(cloned.from).toBe('table');
        registry.from = new Raw('test');
        expect(cloned.from).toBe('table');
        cloned = cloneRegistry(registry);
        expect(cloned.from).toEqual(new Raw('test'));
        registry.from = '';
        expect(cloned.from).toEqual(new Raw('test'));
    });

    it('Works Clone IndexHint', () => {
        const registry = createRegistry();
        registry.indexHint = new IndexHint('test', 'test');
        const cloned = cloneRegistry(registry);
        expect(cloned.indexHint).toEqual(new IndexHint('test', 'test'));
        registry.indexHint = null;
        expect(cloned.indexHint).toEqual(new IndexHint('test', 'test'));
        registry.indexHint = new IndexHint('test2', 'test2');
        expect(cloned.indexHint).toEqual(new IndexHint('test', 'test'));
    });

    it('Works Clone Join', () => {
        const joins = [getJoin('table1'), getJoin('table2'), getJoin('table3')];
        const joinsCloned = joins.slice();
        const registry = createRegistry();
        registry.joins = joins;
        const cloned = cloneRegistry(registry);
        expect(cloned.joins).toEqual(joinsCloned);
        registry.joins.pop();
        expect(cloned.joins).toEqual(joinsCloned);
        registry.joins.push(getJoin('table4'));
        expect(cloned.joins).toEqual(joinsCloned);
        expect(cloned.joins).not.toEqual(registry.joins);
    });

    it('Works Clone Where Raw', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ]);
        registry.wheres = [
            {
                type: 'Raw',
                sql: 'sql2',
                boolean: 'and'
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Basic', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test2'),
                operator: '=',
                value: 1
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Bitwise', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test2'),
                operator: '=',
                value: 1
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where In', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'In',
                column: new Raw('test2'),
                values: [1, 2, 3]
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'In',
                column: new Raw('test2'),
                values: [1, 2, 3]
            }
        ]);
        (registry.wheres[0] as WhereIn).values.push(4, 5);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'In',
                column: new Raw('test2'),
                values: [1, 2, 3]
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'In',
                column: new Raw('test2'),
                values: [1, 2, 3]
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where In Raw', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'InRaw',
                column: new Raw('test2'),
                values: [BigInt(1), BigInt(2)]
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'InRaw',
                column: new Raw('test2'),
                values: [BigInt(1), BigInt(2)]
            }
        ]);
        (registry.wheres[0] as WhereInRaw).values.pop();
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'InRaw',
                column: new Raw('test2'),
                values: [BigInt(1), BigInt(2)]
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'InRaw',
                column: new Raw('test2'),
                values: [BigInt(1), BigInt(2)]
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Null', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ]);
        registry.wheres = [
            {
                type: 'Null',
                not: true,
                column: new Raw('test2'),
                boolean: 'and'
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Between', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ]);
        (registry.wheres[0] as WhereBetween).values[0] = 'column3';
        (registry.wheres[0] as WhereBetween).values[1] = 'column4';
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Between Columns', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'BetweenColumns',
                column: new Raw('test'),
                values: ['column1', 'column2']
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'BetweenColumns',
                column: new Raw('test'),
                values: ['column1', 'column2']
            }
        ]);
        (registry.wheres[0] as WhereBetweenColumns).values[0] = 'column3';
        (registry.wheres[0] as WhereBetweenColumns).values[1] = 'column4';
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'BetweenColumns',
                column: new Raw('test'),
                values: ['column1', 'column2']
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'BetweenColumns',
                column: new Raw('test'),
                values: ['column1', 'column2']
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it.each(['Date', 'Time', 'Year', 'Month', 'Day'])('Works Clone Where %s', (param: string) => {
        const type = param as 'Date' | 'Time' | 'Year' | 'Month' | 'Day';
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type,
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type,
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type,
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type,
                column: new Raw('test2'),
                operator: '=',
                value: new Raw('test3')
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type,
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Column', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Column',
                first: new Raw('test'),
                operator: '=',
                second: new Raw('test2')
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Column',
                first: new Raw('test'),
                operator: '=',
                second: new Raw('test2')
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Column',
                first: new Raw('test'),
                operator: '=',
                second: new Raw('test2')
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Column',
                first: new Raw('test'),
                operator: '=',
                second: new Raw('test3')
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Column',
                first: new Raw('test'),
                operator: '=',
                second: new Raw('test2')
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Json Length', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonLength',
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonLength',
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonLength',
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonLength',
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test3')
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonLength',
                column: new Raw('test'),
                operator: '=',
                value: new Raw('test2')
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Exists', () => {
        const registry = createRegistry();
        const builder = getBuilder().from('users');
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Exists',
                query: builder
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Exists',
                query: builder
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Exists',
                query: builder
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Exists',
                query: getBuilder()
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Exists',
                query: builder
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Nested', () => {
        const registry = createRegistry();
        const builder = getBuilder().from('users');
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: getBuilder()
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Sub', () => {
        const registry = createRegistry();
        const builder = getBuilder().from('users');
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Sub',
                column: new Raw('test'),
                operator: '>',
                query: builder
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Sub',
                column: new Raw('test'),
                operator: '>',
                query: builder
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Sub',
                column: new Raw('test'),
                operator: '>',
                query: builder
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: getBuilder()
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Sub',
                column: new Raw('test'),
                operator: '>',
                query: builder
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Multi Columns', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'RowValues',
                columns: ['test', new Raw('test2')],
                operator: '=',
                values: [1, 2]
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'RowValues',
                columns: ['test', new Raw('test2')],
                operator: '=',
                values: [1, 2]
            }
        ]);
        (registry.wheres[0] as WhereMultiColumn).columns.pop();
        (registry.wheres[0] as WhereMultiColumn).values.pop();
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'RowValues',
                columns: ['test', new Raw('test2')],
                operator: '=',
                values: [1, 2]
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'RowValues',
                columns: ['test', new Raw('test2')],
                operator: '=',
                values: [1, 2]
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Json Boolean', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonBoolean',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonBoolean',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonBoolean',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonBoolean',
                column: new Raw('test2'),
                operator: '=',
                value: 1
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonBoolean',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Json Contains Key', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContainsKey',
                column: new Raw('test')
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContainsKey',
                column: new Raw('test')
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContainsKey',
                column: new Raw('test')
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContainsKey',
                column: new Raw('test2')
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContainsKey',
                column: new Raw('test')
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Json Contains', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: 1
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: 1
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: 1
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test2'),
                value: 2
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: 1
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Json Contains With Array Of Values', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: [1, 2]
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: [1, 2]
            }
        ]);
        ((registry.wheres[0] as WhereContains).value as Binding[]).pop();
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: [1, 2]
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test2'),
                value: [3, 4]
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test'),
                value: [1, 2]
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Where Full Text', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'Fulltext',
                columns: [new Raw('test'), 'test2'],
                value: 'test',
                options: {
                    mode: 'text'
                }
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Fulltext',
                columns: [new Raw('test'), 'test2'],
                value: 'test',
                options: {
                    mode: 'text'
                }
            }
        ]);
        (registry.wheres[0] as whereFulltext).columns.pop();
        (registry.wheres[0] as whereFulltext).options.language = 'english';
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Fulltext',
                columns: [new Raw('test'), 'test2'],
                value: 'test',
                options: {
                    mode: 'text'
                }
            }
        ]);
        registry.wheres = [
            {
                not: true,
                boolean: 'and',
                type: 'JsonContains',
                column: new Raw('test2'),
                value: [3, 4]
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Fulltext',
                columns: [new Raw('test'), 'test2'],
                value: 'test',
                options: {
                    mode: 'text'
                }
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Groups', () => {
        const registry = createRegistry();
        registry.groups = ['a', 'b', new Raw('test')];
        const cloned = cloneRegistry(registry);
        expect(cloned.groups).toEqual(['a', 'b', new Raw('test')]);
        registry.groups = [];
        expect(cloned.groups).toEqual(['a', 'b', new Raw('test')]);
    });

    it('Works Clone Having Raw', () => {
        const registry = createRegistry();
        registry.wheres = [
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.wheres).toEqual([
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ]);
        registry.wheres = [];
        expect(cloned.wheres).toEqual([
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ]);
        registry.wheres = [
            {
                type: 'Raw',
                sql: 'sql2',
                boolean: 'and'
            }
        ];
        expect(cloned.wheres).toEqual([
            {
                type: 'Raw',
                sql: 'sql',
                boolean: 'and'
            }
        ]);
        expect(cloned.wheres).not.toEqual(registry.wheres);
    });

    it('Works Clone Having Basic', () => {
        const registry = createRegistry();
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.havings = [];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test2'),
                operator: '=',
                value: 1
            }
        ];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Basic',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        expect(cloned.havings).not.toEqual(registry.havings);
    });

    it('Works Clone Having Bitwise', () => {
        const registry = createRegistry();
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.havings = [];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test2'),
                operator: '=',
                value: 1
            }
        ];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Bitwise',
                column: new Raw('test'),
                operator: '=',
                value: 1
            }
        ]);
        expect(cloned.havings).not.toEqual(registry.havings);
    });

    it('Works Clone Having Null', () => {
        const registry = createRegistry();
        registry.havings = [
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.havings).toEqual([
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ]);
        registry.havings = [];
        expect(cloned.havings).toEqual([
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ]);
        registry.havings = [
            {
                type: 'Null',
                not: true,
                column: new Raw('test2'),
                boolean: 'and'
            }
        ];
        expect(cloned.havings).toEqual([
            {
                type: 'Null',
                not: true,
                column: new Raw('test'),
                boolean: 'and'
            }
        ]);
        expect(cloned.havings).not.toEqual(registry.havings);
    });

    it('Works Clone Having Between', () => {
        const registry = createRegistry();
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ]);
        (registry.havings[0] as WhereBetween).values[0] = 'column3';
        (registry.havings[0] as WhereBetween).values[1] = 'column4';
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ]);
        registry.havings = [];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Between',
                column: new Raw('test'),
                values: [1, BigInt(10)]
            }
        ]);
        expect(cloned.havings).not.toEqual(registry.havings);
    });

    it('Works Clone Having Nested', () => {
        const registry = createRegistry();
        const builder = getBuilder().from('users');
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ]);
        registry.havings = [];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ]);
        registry.havings = [
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: getBuilder()
            }
        ];
        expect(cloned.havings).toEqual([
            {
                not: true,
                boolean: 'and',
                type: 'Nested',
                query: builder
            }
        ]);
        expect(cloned.havings).not.toEqual(registry.havings);
    });

    it('Works Clone Orders', () => {
        const registry = createRegistry();
        registry.orders = [
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.orders).toEqual([
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ]);
        (registry.orders[0] as OrderRaw).sql = 'sql2';
        (registry.orders[1] as OrderColumn).column = new Raw('test2');
        expect(cloned.orders).toEqual([
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ]);
        expect(cloned.orders).not.toEqual(registry.orders);
        registry.orders = [];
        expect(cloned.orders).toEqual([
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ]);
    });

    it('Works Clone Union Orders', () => {
        const registry = createRegistry();
        registry.unionOrders = [
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.unionOrders).toEqual([
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ]);
        (registry.unionOrders[0] as OrderRaw).sql = 'sql2';
        (registry.unionOrders[1] as OrderColumn).column = new Raw('test2');
        expect(cloned.unionOrders).toEqual([
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ]);
        expect(cloned.unionOrders).not.toEqual(registry.unionOrders);
        registry.unionOrders = [];
        expect(cloned.unionOrders).toEqual([
            { type: 'Raw', sql: 'sql' },
            { column: new Raw('test'), direction: 'asc' }
        ]);
    });

    it('Works Clone Limit', () => {
        const registry = createRegistry();
        registry.limit = 1;
        const cloned = cloneRegistry(registry);
        expect(cloned.limit).toBe(1);
        registry.limit = 2;
        expect(cloned.limit).toBe(1);
        registry.limit = null;
        expect(cloned.limit).toBe(1);
    });

    it('Works Clone Union Limit', () => {
        const registry = createRegistry();
        registry.unionLimit = 1;
        const cloned = cloneRegistry(registry);
        expect(cloned.unionLimit).toBe(1);
        registry.unionLimit = 2;
        expect(cloned.unionLimit).toBe(1);
        registry.unionLimit = null;
        expect(cloned.unionLimit).toBe(1);
    });

    it('Works Clone Offset', () => {
        const registry = createRegistry();
        registry.offset = 1;
        const cloned = cloneRegistry(registry);
        expect(cloned.offset).toBe(1);
        registry.offset = 2;
        expect(cloned.offset).toBe(1);
        registry.offset = null;
        expect(cloned.offset).toBe(1);
    });

    it('Works Clone Union Offset', () => {
        const registry = createRegistry();
        registry.unionOffset = 1;
        const cloned = cloneRegistry(registry);
        expect(cloned.unionOffset).toBe(1);
        registry.unionOffset = 2;
        expect(cloned.unionOffset).toBe(1);
        registry.unionOffset = null;
        expect(cloned.unionOffset).toBe(1);
    });

    it('Works Clone Unions', () => {
        const registry = createRegistry();
        const builder = getBuilder().from('users');
        registry.unions = [
            {
                all: false,
                query: builder
            }
        ];
        const cloned = cloneRegistry(registry);
        expect(cloned.unions).toEqual([
            {
                all: false,
                query: builder
            }
        ]);
        registry.unions = [];
        expect(cloned.unions).toEqual([
            {
                all: false,
                query: builder
            }
        ]);
        registry.unions = [
            {
                all: true,
                query: getBuilder()
            }
        ];
        expect(cloned.unions).toEqual([
            {
                all: false,
                query: builder
            }
        ]);
        expect(cloned.unions).not.toEqual(registry.unions);
    });

    it('Works Clone Lock', () => {
        const registry = createRegistry();
        registry.lock = 'lock';
        const cloned = cloneRegistry(registry);
        expect(cloned.lock).toBe('lock');
        registry.lock = true;
        expect(cloned.lock).toBe('lock');
        registry.lock = null;
        expect(cloned.lock).toBe('lock');
    });

    it('Works Clone Before Query Callbacks', () => {
        const registry = createRegistry();
        registry.beforeQueryCallbacks = [() => {}, () => {}, () => {}];
        const cloned = cloneRegistry(registry);
        expect(cloned.beforeQueryCallbacks).toEqual([expect.any(Function), expect.any(Function), expect.any(Function)]);
        registry.beforeQueryCallbacks.pop();
        expect(cloned.beforeQueryCallbacks).toEqual([expect.any(Function), expect.any(Function), expect.any(Function)]);
        registry.beforeQueryCallbacks = [];
        expect(cloned.beforeQueryCallbacks).toEqual([expect.any(Function), expect.any(Function), expect.any(Function)]);
    });
});
