import Grammar from '../../../grammar';
import Raw from '../../../query/expression';
import QueryBuilder from '../../../query/query-builder';
import QueryBuilderI from '../../../types/query/query-builder';
import { WhereBasic } from '../../../types/query/registry';
import {
    MockedBuilder,
    getBuilder,
    getConnection,
    getGrammarBuilder,
    getJoin,
    getMysqlBuilder
} from '../fixtures/mocked';

describe('QueryBuilder Utilities', () => {
    it('Works QueryBuilder Get Grammar From Connection Session', () => {
        const session = getConnection().session();
        const spiedGrammar = jest.spyOn(session, 'getQueryGrammar');
        const builder = new QueryBuilder(session);
        expect(builder.getGrammar()).toBeInstanceOf(Grammar);
        expect(spiedGrammar).toHaveBeenCalledTimes(1);
    });

    it('Works QueryBuilder Cache Set Cache to Connection Session', () => {
        const session = getConnection().session();
        const spiedCache = jest.spyOn(session, 'cache');
        const builder = new QueryBuilder(session);
        expect(builder.cache({ cache: 1000, key: 'test', options: { a: true } })).toBeInstanceOf(QueryBuilder);
        expect(spiedCache).toHaveBeenCalledTimes(1);
        expect(spiedCache).toHaveBeenCalledWith({ cache: 1000, key: 'test', options: { a: true } });
    });

    it('Works When Callback', () => {
        const callback = (query: QueryBuilderI, condition: boolean): void => {
            expect(condition).toBeTruthy();
            query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').when(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').when(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works When Callback Closure', () => {
        const callback = (query: QueryBuilderI, condition: boolean): void => {
            expect(condition).toBeTruthy();
            query.where('id', '=', 1);
        };
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .when(query => {
                expect(query).toEqual(builder);
                return true;
            }, callback)
            .where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    });

    it('Works When Callback With Return', () => {
        const callback = (query: MockedBuilder, condition: boolean): MockedBuilder => {
            expect(condition).toBeTruthy();
            return query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').when(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').when(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works When Callback With Default', () => {
        const callback = (query: MockedBuilder, condition: string | number): MockedBuilder => {
            expect(condition).toBe('truthy');
            return query.where('id', '=', 1);
        };
        const defaultCB = (query: MockedBuilder, condition: string | number): MockedBuilder => {
            expect(condition).toBe(0);
            return query.where('id', '=', 2);
        };
        const defaultCBNoReturn = (query: MockedBuilder, condition: string | number): void => {
            expect(condition).toBe(0);
            query.where('id', '=', 2);
        };
        let builder = getBuilder();
        builder.select('*').from('users').when<string>('truthy', callback, defaultCB).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
        builder = getBuilder();
        builder.select('*').from('users').when<number>(0, callback, defaultCBNoReturn).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([2, 'foo']);
    });

    it('Works Unless Callback', () => {
        const callback = (query: QueryBuilderI, condition: boolean): void => {
            expect(condition).toBeFalsy();
            query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').unless(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').unless(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works Unless Callback Closure', () => {
        const callback = (query: QueryBuilderI, condition: boolean): void => {
            expect(condition).toBeFalsy();
            query.where('id', '=', 1);
        };
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .unless(query => {
                expect(query).toEqual(builder);
                return false;
            }, callback)
            .where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    });

    it('Works Unless Callback With Return', () => {
        const callback = (query: MockedBuilder, condition: boolean): MockedBuilder => {
            expect(condition).toBeFalsy();
            return query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').unless(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').unless(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works Unless Callback With Default', () => {
        const callback = (query: MockedBuilder, condition: string | number): MockedBuilder => {
            expect(condition).toBe(0);
            return query.where('id', '=', 1);
        };
        const defaultCB = (query: MockedBuilder, condition: string | number): MockedBuilder => {
            expect(condition).toBe('truthy');
            return query.where('id', '=', 2);
        };
        const defaultCBNoReturn = (query: MockedBuilder, condition: string | number): void => {
            expect(condition).toBe('truthy');
            query.where('id', '=', 2);
        };
        let builder = getBuilder();
        builder.select('*').from('users').unless<number>(0, callback, defaultCB).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
        builder = getBuilder();
        builder.select('*').from('users').unless<string>('truthy', callback, defaultCBNoReturn).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([2, 'foo']);
    });

    it('Works Tap Callback', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .tap((query): void => {
                query.where('id', '=', 1);
            })
            .where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    });

    it('Works Subqueries Bindings', () => {
        let builder = getBuilder();
        const second = getBuilder().select('*').from('users').orderByRaw('id = ?', 2);
        const third = getBuilder().select('*').from('users').where('id', 3).groupBy('id').having('id', '!=', 4);
        builder.groupBy('a').having('a', '=', 1).union(second).union(third);
        expect([1, 2, 3, 4]).toEqual(builder.getBindings());

        builder = getBuilder()
            .select('*')
            .from('users')
            .where('email', '=', query => {
                query
                    .select(new Raw('max(id)'))
                    .from('users')
                    .where('email', '=', 'bar')
                    .orderByRaw('email like ?', '%.com')
                    .groupBy('id')
                    .having('id', '=', 4);
            })
            .orWhere('id', '=', 'foo')
            .groupBy('id')
            .having('id', '=', 5);
        expect(['bar', 4, '%.com', 'foo', 5]).toEqual(builder.getBindings());
    });

    it('Works Preserve Adds Closure To Array', () => {
        const builder = getBuilder();
        const callback = function (): void {};
        builder.beforeQuery(callback);
        expect(builder.getBeforeQueryCallbacks().length).toBe(1);
        expect(builder.getBeforeQueryCallbacks()[0]).toEqual(callback);
    });

    it('Works Apply Preserve Cleans Array', () => {
        const builder = getBuilder();
        builder.beforeQuery(function () {});
        expect(builder.getBeforeQueryCallbacks().length).toBe(1);
        builder.applyBeforeQueryCallbacks();
        expect(builder.getBeforeQueryCallbacks().length).toBe(0);
    });

    it('Works Preserved Are Applied By To Sql', () => {
        const builder = getBuilder();
        builder.beforeQuery(builder => {
            builder.where('foo', 'bar');
        });
        expect('select * where "foo" = ?').toBe(builder.toSql());
        expect(['bar']).toEqual(builder.getBindings());
    });

    it('Works Preserved Are Applied By Insert', async () => {
        const builder = getBuilder();
        const spiedInsert = jest.spyOn(builder.getConnection(), 'insert').mockImplementation();
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.insert({ email: 'foo' });
        expect(spiedInsert).toHaveBeenCalledTimes(1);
        expect(spiedInsert).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo']);
    });

    it('Works Preserved Are Applied By Insert Get Id', async () => {
        const builder = getBuilder();
        const spiedInsert = jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementation();
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.insertGetId({ email: 'foo' }, 'id');
        expect(spiedInsert).toHaveBeenCalledTimes(1);
        expect(spiedInsert).toHaveBeenCalledWith('insert into "users" ("email") values (?)', ['foo'], 'id');
    });

    it('Works Preserved Are Applied By Insert Using', async () => {
        const builder = getBuilder();
        const spiedAffecting = jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementation();
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        builder.insertUsing([], getBuilder());
        expect(spiedAffecting).toHaveBeenCalledTimes(1);
        expect(spiedAffecting).toHaveBeenCalledWith('insert into "users" select *', []);
    });

    it('Works Preserved Are Applied By Upsert', async () => {
        let builder = getMysqlBuilder();
        let spiedAffecting = jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementation();
        jest.spyOn(builder.getConnection(), 'getConfig').mockImplementationOnce(() => false);
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.upsert({ email: 'foo' }, 'id');
        expect(spiedAffecting).toHaveBeenCalledTimes(1);
        expect(spiedAffecting).toHaveBeenCalledWith(
            'insert into `users` (`email`) values (?) on duplicate key update `email` = values(`email`)',
            ['foo']
        );

        builder = getMysqlBuilder();
        spiedAffecting = jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementation();
        jest.spyOn(builder.getConnection(), 'getConfig').mockImplementationOnce(() => true);
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.upsert({ email: 'foo' }, 'id');
        expect(spiedAffecting).toHaveBeenCalledTimes(1);
        expect(spiedAffecting).toHaveBeenCalledWith(
            'insert into `users` (`email`) values (?) as laravel_upsert_alias on duplicate key update `email` = `laravel_upsert_alias`.`email`',
            ['foo']
        );
    });

    it('Works Preserved Are Applied By Update', async () => {
        const builder = getBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        builder.from('users').beforeQuery(function (builder) {
            builder.where('id', 1);
        });
        await builder.update({ email: 'foo' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith('update "users" set "email" = ? where "id" = ?', ['foo', 1]);
    });

    it('Works Preserved Are Applied By Delete', async () => {
        const builder = getBuilder();
        const spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementation();
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.delete();
        expect(spiedDelete).toHaveBeenCalledTimes(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from "users"', []);
    });

    it('Works Preserved Are Applied By Truncate', async () => {
        const builder = getBuilder();
        const spiedStatement = jest.spyOn(builder.getConnection(), 'statement').mockImplementation();
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.truncate();
        expect(spiedStatement).toHaveBeenCalledTimes(1);
        expect(spiedStatement).toHaveBeenCalledWith('truncate table "users"', []);
    });

    it('Works Preserved Are Applied By Exists', async () => {
        const builder = getBuilder();
        const spiedSelect = jest.spyOn(builder.getConnection(), 'select').mockReturnValue(Promise.resolve([]));
        builder.beforeQuery(function (builder) {
            builder.from('users');
        });
        await builder.exists();
        expect(spiedSelect).toHaveBeenCalledTimes(1);
        expect(spiedSelect).toHaveBeenCalledWith('select exists(select * from "users") as "exists"', [], true);
    });

    it('Works Merge Wheres Can Merge Wheres And Bindings', () => {
        const builder = getBuilder();
        const toMerge = getBuilder().where('bar', 'baz');
        builder.where('foo', 'bar');
        builder.mergeWheres(toMerge.getRegistry().wheres, toMerge.getRawBindings().where);
        expect(['foo', 'bar']).toEqual(builder.getRegistry().wheres.map(where => (where as WhereBasic).column));
        expect(['bar', 'baz']).toEqual(builder.getBindings());
    });

    it('Works Binding Order', () => {
        const expectedSql =
            'select * from "users" inner join "othertable" on "bar" = ? where "registered" = ? group by "city" having "population" > ? order by match ("foo") against(?)';
        const expectedBindings = ['foo', 1, 3, 'bar'];

        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .join('othertable', join => {
                join.where('bar', '=', 'foo');
            })
            .where('registered', 1)
            .groupBy('city')
            .having('population', '>', 3)
            .orderByRaw('match ("foo") against(?)', ['bar']);
        expect(expectedSql).toBe(builder.toSql());
        expect(expectedBindings).toEqual(builder.getBindings());

        // order of statements reversed
        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .orderByRaw('match ("foo") against(?)', ['bar'])
            .having('population', '>', 3)
            .groupBy('city')
            .where('registered', 1)
            .join('othertable', join => {
                join.where('bar', '=', 'foo');
            });
        expect(expectedSql).toBe(builder.toSql());
        expect(expectedBindings).toEqual(builder.getBindings());
    });

    it('Works Set Binding With Array Replace Bindings', () => {
        const builder = getBuilder();
        builder.addBinding(['foo', 'bar']);
        builder.setBindings(['baz']);
        expect(['baz']).toEqual(builder.getBindings());
    });

    it('Works Set Binding With Array Replace Bindings In Correct Order', () => {
        const builder = getBuilder();
        builder.setBindings(['bar', 'baz'], 'having');
        builder.setBindings(['foo'], 'where');
        expect(['foo', 'bar', 'baz']).toEqual(builder.getBindings());
    });

    it('Works Set Binding Throw Error', () => {
        const builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong argument
            builder.setBindings(['bar', 'baz'], 'noway');
        }).toThrow('Invalid binding type: noway.');
    });

    it('Works Add Binding With Array Merges Bindings', () => {
        const builder = getBuilder();
        builder.addBinding(['foo', 'bar']);
        builder.addBinding(['baz']);
        expect(['foo', 'bar', 'baz']).toEqual(builder.getBindings());
    });

    it('Works Add Binding With Array Merges Bindings In Correct Order', () => {
        const builder = getBuilder();
        builder.addBinding(['bar', 'baz'], 'having');
        builder.addBinding(['foo'], 'where');
        expect(['foo', 'bar', 'baz']).toEqual(builder.getBindings());
    });

    it('Works Add Binding Throw Error', () => {
        const builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong argument
            builder.addBinding(['bar', 'baz'], 'noway');
        }).toThrow('Invalid binding type: noway.');
    });

    it('Works Merge Builders Bindings', () => {
        const builder = getBuilder();
        builder.addBinding(['foo', 'bar']);
        const otherBuilder = getBuilder();
        otherBuilder.addBinding(['baz']);
        builder.mergeBindings(otherBuilder);
        expect(['foo', 'bar', 'baz']).toEqual(builder.getBindings());
    });

    it('Works Merge Builders Binding Order', () => {
        const builder = getBuilder();
        builder.addBinding('foo', 'where');
        builder.addBinding('baz', 'having');
        const otherBuilder = getBuilder();
        otherBuilder.addBinding('bar', 'where');
        builder.mergeBindings(otherBuilder);
        expect(['foo', 'bar', 'baz']).toEqual(builder.getBindings());
    });

    it('Works Clone', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .beforeQuery(query => query.orderBy('foo', 'desc'));
        const clone = builder
            .clone()
            .where('email', 'foo')
            .beforeQuery(query => query.orderBy('baz', 'desc'));

        expect(builder).not.toEqual(clone);
        expect('select * from "users" order by "foo" desc').toBe(builder.toSql());
        expect('select * from "users" where "email" = ? order by "foo" desc, "baz" desc').toBe(clone.toSql());

        const join = getJoin();
        join.select('*')
            .from('users')
            .beforeQuery(query => query.orderBy('foo', 'desc'));
        const clonedJoin = join
            .clone()
            .where('email', 'foo')
            .beforeQuery(query => query.orderBy('baz', 'desc'));

        expect(join).not.toEqual(clonedJoin);
        expect('select * from "users" order by "foo" desc').toBe(join.toSql());
        expect('select * from "users" on "email" = ? order by "foo" desc, "baz" desc').toBe(clonedJoin.toSql());

        const query = getGrammarBuilder();
        query
            .select('*')
            .from('users')
            .beforeQuery(query => query.orderBy('foo', 'desc'));
        const clonedQuery = query
            .clone()
            .where('email', 'foo')
            .beforeQuery(query => query.orderBy('baz', 'desc'));

        expect(query).not.toEqual(clonedQuery);
        expect('select * from "users" order by "foo" desc').toBe(query.toSql());
        expect('select * from "users" where "email" = ? order by "foo" desc, "baz" desc').toBe(clonedQuery.toSql());
    });

    it('Works Clone Without', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('email', 'foo').orderBy('email');
        const clone = builder.cloneWithout(['orders']);

        expect('select * from "users" where "email" = ? order by "email" asc').toBe(builder.toSql());
        expect('select * from "users" where "email" = ?').toBe(clone.toSql());

        const join = getJoin();
        join.select('*').from('users').where('email', 'foo').orderBy('email');
        const clonedJoin = join.cloneWithout(['orders']);

        expect('select * from "users" on "email" = ? order by "email" asc').toBe(join.toSql());
        expect('select * from "users" on "email" = ?').toBe(clonedJoin.toSql());

        const query = getGrammarBuilder();
        query.select('*').from('users').where('email', 'foo').orderBy('email');
        const clonedQuery = query.cloneWithout(['orders']);

        expect('select * from "users" where "email" = ? order by "email" asc').toBe(query.toSql());
        expect('select * from "users" where "email" = ?').toBe(clonedQuery.toSql());
    });

    it('Works Clone Without Bindings', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('email', 'foo').orderBy('email');
        const clone = builder.cloneWithout(['wheres']).cloneWithoutBindings(['where']);

        expect('select * from "users" where "email" = ? order by "email" asc').toBe(builder.toSql());
        expect(['foo']).toEqual(builder.getBindings());

        expect('select * from "users" order by "email" asc').toBe(clone.toSql());
        expect([]).toEqual(clone.getBindings());

        const join = getJoin();
        join.select('*').from('users').where('email', 'foo').orderBy('email');
        const clonedJoin = join.cloneWithout(['wheres']).cloneWithoutBindings(['where']);

        expect('select * from "users" on "email" = ? order by "email" asc').toBe(join.toSql());
        expect(['foo']).toEqual(builder.getBindings());
        expect('select * from "users" order by "email" asc').toBe(clonedJoin.toSql());
        expect([]).toEqual(clonedJoin.getBindings());

        const query = getGrammarBuilder();
        query.select('*').from('users').where('email', 'foo').orderBy('email');
        const clonedQuery = query.cloneWithout(['wheres']).cloneWithoutBindings(['where']);

        expect('select * from "users" where "email" = ? order by "email" asc').toBe(query.toSql());
        expect(['foo']).toEqual(builder.getBindings());
        expect('select * from "users" order by "email" asc').toBe(clonedQuery.toSql());
        expect([]).toEqual(clonedQuery.getBindings());
    });

    it('Works Get Columns', () => {
        const builder = getBuilder();
        expect(builder.getColumns()).toEqual([]);
        builder.select(new Raw('name'));
        expect(builder.getColumns()).toEqual(['name']);
    });

    it('Works Log', () => {
        console.log = jest.fn();
        const builder = getBuilder()
            .select('*')
            .from('users')
            .join('othertable', join => {
                join.where('bar', '=', 'foo');
            })
            .where('registered', 1)
            .groupBy('city')
            .having('population', '>', 3)
            .orderByRaw('match ("foo") against(?)', ['bar']);

        expect(builder.log()).toEqual(builder);
        expect(console.log).toHaveBeenCalledWith(
            'select * from "users" inner join "othertable" on "bar" = ? where "registered" = ? group by "city" having "population" > ? order by match ("foo") against(?)',
            ['foo', 1, 3, 'bar']
        );
    });

    it('Works LogRaw', () => {
        console.log = jest.fn();
        const builder = getBuilder()
            .select('*')
            .from('users')
            .join('othertable', join => {
                join.where('bar', '=', 'foo');
            })
            .where('registered', 1)
            .groupBy('city')
            .having('population', '>', 3)
            .orderByRaw('match ("foo") against(?)', ['bar']);

        expect(builder.logRawSql()).toEqual(builder);
        expect(console.log).toHaveBeenCalledWith(
            `select * from "users" inner join "othertable" on "bar" = 'foo' where "registered" = '1' group by "city" having "population" > '3' order by match ("foo") against('bar')`
        );
    });
});
