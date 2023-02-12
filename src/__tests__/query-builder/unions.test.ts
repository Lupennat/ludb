import {
    getBuilder,
    getMySqlBuilder,
    getPostgresBuilder,
    getSQLiteBuilder,
    getSqlServerBuilder,
    pdo
} from '../fixtures/mocked';

describe('Query Builder Unions', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Unions', () => {
        let builder = getBuilder();

        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getBuilder().select('*').from('users').where('id', '=', 2));
        expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)').toBe(
            builder.toSql()
        );
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getMySqlBuilder().select('*').from('users').where('id', '=', 2));
        expect('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?)').toBe(
            builder.toSql()
        );
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('name').from('users').where('id', '=', 1);
        builder.union(getPostgresBuilder().select('name').from('users').where('id', '=', 2));
        expect('(select "name" from "users" where "id" = ?) union (select "name" from "users" where "id" = ?)').toBe(
            builder.toSql()
        );
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSQLiteBuilder();
        builder.select('name').from('users').where('id', '=', 1);
        builder.union(getSQLiteBuilder().select('name').from('users').where('id', '=', 2));
        expect(
            'select * from (select "name" from "users" where "id" = ?) union select * from (select "name" from "users" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('name').from('users').where('id', '=', 1);
        builder.union(getSqlServerBuilder().select('name').from('users').where('id', '=', 2));
        expect(
            'select * from (select [name] from [users] where [id] = ?) as [temp_table] union select * from (select [name] from [users] where [id] = ?) as [temp_table]'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Unions All', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.unionAll(getBuilder().select('*').from('users').where('id', '=', 2));
        expect('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)').toBe(
            builder.toSql()
        );
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.unionAll(getPostgresBuilder().select('*').from('users').where('id', '=', 2));
        expect('(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)').toBe(
            builder.toSql()
        );
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Multiple Unions', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getBuilder().select('*').from('users').where('id', '=', 2));
        builder.union(getBuilder().select('*').from('users').where('id', '=', 3));
        expect(
            '(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2, 3]).toEqual(builder.getBindings());
    });

    it('Works Multiple Union Alls', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.unionAll(getBuilder().select('*').from('users').where('id', '=', 2));
        builder.unionAll(getBuilder().select('*').from('users').where('id', '=', 3));
        expect(
            '(select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?) union all (select * from "users" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2, 3]).toEqual(builder.getBindings());
    });

    it('Works Union Order Bys', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getBuilder().select('*').from('users').where('id', '=', 2));
        builder.orderBy('id', 'desc');
        expect(
            '(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?) order by "id" desc'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Union Limits And Offsets', () => {
        let builder = getBuilder();
        builder.select('*').from('users');
        builder.union(getBuilder().select('*').from('dogs'));
        builder.skip(5).take(10);
        expect('(select * from "users") union (select * from "dogs") limit 10 offset 5').toBe(builder.toSql());

        let expectedSql = '(select * from "users") union (select * from "dogs") limit 10 offset 5';
        builder = getPostgresBuilder();
        builder.select('*').from('users');
        builder.union(getBuilder().select('*').from('dogs'));
        builder.skip(5).take(10);
        expect(expectedSql).toBe(builder.toSql());

        expectedSql = '(select * from "users" limit 11) union (select * from "dogs" limit 22) limit 10 offset 5';
        builder = getPostgresBuilder();
        builder.select('*').from('users').limit(11);
        builder.union(getBuilder().select('*').from('dogs').limit(22));
        builder.skip(5).take(10);
        expect(expectedSql).toBe(builder.toSql());
    });

    it('Works Union With Join', () => {
        const builder = getBuilder();
        builder.select('*').from('users');
        builder.union(
            getBuilder()
                .select('*')
                .from('dogs')
                .join('breeds', join => {
                    join.on('dogs.breed_id', '=', 'breeds.id').where('breeds.is_native', '=', 1);
                })
        );
        expect(
            '(select * from "users") union (select * from "dogs" inner join "breeds" on "dogs"."breed_id" = "breeds"."id" and "breeds"."is_native" = ?)'
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works MySql Union Order Bys', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getMySqlBuilder().select('*').from('users').where('id', '=', 2));
        builder.orderBy('id', 'desc');
        expect(
            '(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?) order by `id` desc'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works MySql Union Limits And Offsets', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users');
        builder.union(getMySqlBuilder().select('*').from('dogs'));
        builder.skip(5).take(10);
        expect('(select * from `users`) union (select * from `dogs`) limit 10 offset 5').toBe(builder.toSql());
    });

    it('Works Union Aggregate', async () => {
        let expected =
            'select count(*) as aggregate from ((select * from `posts`) union (select * from `videos`)) as `temp_table`';
        let builder = getMySqlBuilder();
        let spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        let spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getMySqlBuilder().from('videos')).count();
        expect(spyProcess).toBeCalledTimes(1);
        expect(spyConnection).toBeCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from ((select `id` from `posts`) union (select `id` from `videos`)) as `temp_table`';
        builder = getMySqlBuilder();
        spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').select('id').union(getMySqlBuilder().from('videos').select('id')).count();
        expect(spyProcess).toBeCalledTimes(1);
        expect(spyConnection).toBeCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from ((select * from "posts") union (select * from "videos")) as "temp_table"';
        builder = getPostgresBuilder();
        spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getPostgresBuilder().from('videos')).count();
        expect(spyProcess).toBeCalledTimes(1);
        expect(spyConnection).toBeCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from (select * from (select * from "posts") union select * from (select * from "videos")) as "temp_table"';
        builder = getSQLiteBuilder();
        spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getSQLiteBuilder().from('videos')).count();
        expect(spyProcess).toBeCalledTimes(1);
        expect(spyConnection).toBeCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from (select * from (select * from [posts]) as [temp_table] union select * from (select * from [videos]) as [temp_table]) as [temp_table]';
        builder = getSqlServerBuilder();
        spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getSqlServerBuilder().from('videos')).count();
        expect(spyProcess).toBeCalledTimes(1);
        expect(spyConnection).toBeCalledWith(expected, [], true);
    });
});
