import Raw from '../../../query/expression';
import BuilderI from '../../../types/query/builder';

import {
    getBuilder,
    getMySqlBuilder,
    getPostgresBuilder,
    getSQLiteBuilder,
    getSqlServerBuilder,
    pdo
} from '../fixtures/mocked';

describe('Builder Order-Group', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Group Bys', () => {
        let builder = getBuilder();
        builder.select('*').from('users').groupBy('email');
        expect('select * from "users" group by "email"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupBy('id', 'email');
        expect('select * from "users" group by "id", "email"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupBy(['id', 'email']);
        expect('select * from "users" group by "id", "email"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupBy(new Raw('DATE(created_at)'));
        expect('select * from "users" group by DATE(created_at)').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupByRaw('DATE(created_at), ? DESC', ['foo']);
        expect('select * from "users" group by DATE(created_at), ? DESC').toBe(builder.toSql());
        expect(['foo']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').groupByRaw('DATE(created_at) DESC');
        expect('select * from "users" group by DATE(created_at) DESC').toBe(builder.toSql());
        expect([]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .havingRaw('?', ['havingRawBinding'])
            .groupByRaw('?', ['groupByRawBinding'])
            .whereRaw('?', ['whereRawBinding']);
        expect(['whereRawBinding', 'groupByRawBinding', 'havingRawBinding']).toEqual(builder.getBindings());
    });

    it('Works Order Bys', () => {
        let builder = getBuilder();
        builder.select('*').from('users').orderBy('email').orderBy('age', 'desc');
        expect('select * from "users" order by "email" asc, "age" desc').toBe(builder.toSql());

        builder.getRegistry().orders = [];
        expect('select * from "users"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').orderBy('email').orderByRaw('"age" ? desc', ['foo']);
        expect('select * from "users" order by "email" asc, "age" ? desc').toBe(builder.toSql());
        expect(['foo']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').orderByDesc('name');
        expect('select * from "users" order by "name" desc').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('posts')
            .where('public', 1)
            .unionAll(getBuilder().select('*').from('videos').where('public', 1))
            .orderByRaw('field(category, ?, ?) asc', ['news', 'opinion']);
        expect(
            '(select * from "posts" where "public" = ?) union all (select * from "videos" where "public" = ?) order by field(category, ?, ?) asc'
        ).toBe(builder.toSql());
        expect([1, 1, 'news', 'opinion']).toEqual(builder.getBindings());
    });

    it('Works Latest', () => {
        let builder = getBuilder();
        builder.select('*').from('users').latest();
        expect('select * from "users" order by "created_at" desc').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').latest().limit(1);
        expect('select * from "users" order by "created_at" desc limit 1').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').latest('updated_at');
        expect('select * from "users" order by "updated_at" desc').toBe(builder.toSql());
    });

    it('Works Oldest', () => {
        let builder = getBuilder();
        builder.select('*').from('users').oldest();
        expect('select * from "users" order by "created_at" asc').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').oldest().limit(1);
        expect('select * from "users" order by "created_at" asc limit 1').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').oldest('updated_at');
        expect('select * from "users" order by "updated_at" asc').toBe(builder.toSql());
    });

    it('Works In Random Order', () => {
        const builder = getBuilder();
        builder.select('*').from('users').inRandomOrder();
        expect('select * from "users" order by RANDOM()').toBe(builder.toSql());
    });

    it('Works In Random Order MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').inRandomOrder();
        expect('select * from `users` order by RAND()').toBe(builder.toSql());
    });

    it('Works In Random Order Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').inRandomOrder();
        expect('select * from "users" order by RANDOM()').toBe(builder.toSql());
    });

    it('Works In Random Order Sql Server', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').inRandomOrder();
        expect('select * from [users] order by NEWID()').toBe(builder.toSql());
    });

    it('Works Order Bys SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').orderBy('email').orderBy('age', 'desc');
        expect('select * from [users] order by [email] asc, [age] desc').toBe(builder.toSql());

        builder.getRegistry().orders = [];
        expect('select * from [users]').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').orderBy('email');
        expect('select * from [users] order by [email] asc').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').orderByDesc('name');
        expect('select * from [users] order by [name] desc').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').orderByRaw('[age] asc');
        expect('select * from [users] order by [age] asc').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').orderBy('email').orderByRaw('[age] ? desc', ['foo']);
        expect('select * from [users] order by [email] asc, [age] ? desc').toBe(builder.toSql());
        expect(['foo']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').skip(25).take(10).orderByRaw('[email] desc');
        expect('select * from [users] order by [email] desc offset 25 rows fetch next 10 rows only').toBe(
            builder.toSql()
        );
    });

    it('Works Reorder', () => {
        let builder = getBuilder();
        builder.select('*').from('users').orderBy('name');
        expect('select * from "users" order by "name" asc').toBe(builder.toSql());
        builder.reorder();
        expect('select * from "users"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').orderBy('name');
        expect('select * from "users" order by "name" asc').toBe(builder.toSql());
        builder.reorder('email', 'desc');
        expect('select * from "users" order by "email" desc').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('first');
        builder.union(getBuilder().select('*').from('second'));
        builder.orderBy('name');
        expect('(select * from "first") union (select * from "second") order by "name" asc').toBe(builder.toSql());
        builder.reorder();
        expect('(select * from "first") union (select * from "second")').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').orderByRaw('?', [true]);
        expect([true]).toEqual(builder.getBindings());
        builder.reorder();
        expect([]).toEqual(builder.getBindings());
    });

    it('Works Order By Sub Queries', () => {
        const expected =
            'select * from "users" order by (select "created_at" from "logins" where "user_id" = "users"."id" limit 1)';
        const subQuery = (query: BuilderI): void => {
            query.select('created_at').from('logins').whereColumn('user_id', 'users.id').limit(1);
        };

        let builder = getBuilder().select('*').from('users').orderBy(subQuery);
        expect(`${expected} asc`).toBe(builder.toSql());

        builder = getBuilder().select('*').from('users').orderBy(subQuery, 'desc');
        expect(`${expected} desc`).toBe(builder.toSql());

        builder = getBuilder().select('*').from('users').orderByDesc(subQuery);
        expect(`${expected} desc`).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('posts')
            .where('public', 1)
            .unionAll(getBuilder().select('*').from('videos').where('public', 1))
            .orderBy(getBuilder().selectRaw('field(category, ?, ?)', ['news', 'opinion']));
        expect(
            '(select * from "posts" where "public" = ?) union all (select * from "videos" where "public" = ?) order by (select field(category, ?, ?)) asc'
        ).toBe(builder.toSql());
        expect([1, 1, 'news', 'opinion']).toEqual(builder.getBindings());
    });

    it('Works Order By Invalid Direction Param', () => {
        const builder = getBuilder();
        expect(() => {
            // @ts-expect-error error on wrong direction
            builder.select('*').from('users').orderBy('age', 'asec');
        }).toThrow('Order direction must be "asc" or "desc".');
    });

    it('Works SQLite Order By', () => {
        const builder = getSQLiteBuilder();
        builder.select('*').from('users').orderBy('email', 'desc');
        expect('select * from "users" order by "email" desc').toBe(builder.toSql());
    });

    it('Works SqlServer Limits And Offsets', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').take(10);
        expect('select top 10 * from [users]').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').skip(10).orderBy('email', 'desc');
        expect('select * from [users] order by [email] desc offset 10 rows').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').skip(10).take(10);
        expect('select * from [users] order by (SELECT 0) offset 10 rows fetch next 10 rows only').toBe(
            builder.toSql()
        );

        builder = getSqlServerBuilder();
        builder.select('*').from('users').skip(11).take(10).orderBy('email', 'desc');
        expect('select * from [users] order by [email] desc offset 11 rows fetch next 10 rows only').toBe(
            builder.toSql()
        );

        builder = getSqlServerBuilder();
        const subQuery = (query: BuilderI): void => {
            query
                .select('created_at')
                .from('logins')
                .where('users.name', 'nameBinding')
                .whereColumn('user_id', 'users.id')
                .limit(1);
        };
        builder.select('*').from('users').where('email', 'emailBinding').orderBy(subQuery).skip(10).take(10);
        expect(
            'select * from [users] where [email] = ? order by (select top 1 [created_at] from [logins] where [users].[name] = ? and [user_id] = [users].[id]) asc offset 10 rows fetch next 10 rows only'
        ).toBe(builder.toSql());
        expect(['emailBinding', 'nameBinding']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        // @ts-expect-error text wrong parameter
        builder.select('*').from('users').take('foo');
        expect('select * from [users]').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        // @ts-expect-error text wrong parameter
        builder.select('*').from('users').take('foo').offset('bar');
        expect('select * from [users]').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        // @ts-expect-error text wrong parameter
        builder.select('*').from('users').offset('bar');
        expect('select * from [users]').toBe(builder.toSql());
    });
});
