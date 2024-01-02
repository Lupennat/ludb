import {
    getBuilder,
    getMysqlBuilder,
    getPostgresBuilder,
    getSqliteBuilder,
    getSqlserverBuilder,
    pdo
} from '../fixtures/mocked';

describe('QueryBuilder Unions', () => {
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

        builder = getBuilder();

        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .union(query => {
                query.select('*').from('users').where('id', '=', 2);
            });
        expect('(select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)').toBe(
            builder.toSql()
        );
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getMysqlBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getMysqlBuilder().select('*').from('users').where('id', '=', 2));
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

        builder = getSqliteBuilder();
        builder.select('name').from('users').where('id', '=', 1);
        builder.union(getSqliteBuilder().select('name').from('users').where('id', '=', 2));
        expect(
            'select * from (select "name" from "users" where "id" = ?) union select * from (select "name" from "users" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSqlserverBuilder();
        builder.select('name').from('users').where('id', '=', 1);
        builder.union(getSqlserverBuilder().select('name').from('users').where('id', '=', 2));
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

    it('Works Mysql Union Order Bys', () => {
        const builder = getMysqlBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        builder.union(getMysqlBuilder().select('*').from('users').where('id', '=', 2));
        builder.orderBy('id', 'desc');
        expect(
            '(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?) order by `id` desc'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Mysql Union Limits And Offsets', () => {
        const builder = getMysqlBuilder();
        builder.select('*').from('users');
        builder.union(getMysqlBuilder().select('*').from('dogs'));
        builder.skip(5).take(10);
        expect('(select * from `users`) union (select * from `dogs`) limit 10 offset 5').toBe(builder.toSql());
    });

    it('Works Union Aggregate', async () => {
        let expected =
            'select count(*) as aggregate from ((select * from `posts`) union (select * from `videos`)) as `temp_table`';
        let builder = getMysqlBuilder();
        let spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getMysqlBuilder().from('videos')).count();
        expect(spyConnection).toHaveBeenCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from ((select `id` from `posts`) union (select `id` from `videos`)) as `temp_table`';
        builder = getMysqlBuilder();
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').select('id').union(getMysqlBuilder().from('videos').select('id')).count();
        expect(spyConnection).toHaveBeenCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from ((select * from "posts") union (select * from "videos")) as "temp_table"';
        builder = getPostgresBuilder();
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getPostgresBuilder().from('videos')).count();
        expect(spyConnection).toHaveBeenCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from (select * from (select * from "posts") union select * from (select * from "videos")) as "temp_table"';
        builder = getSqliteBuilder();
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getSqliteBuilder().from('videos')).count();
        expect(spyConnection).toHaveBeenCalledWith(expected, [], true);

        expected =
            'select count(*) as aggregate from (select * from (select * from [posts]) as [temp_table] union select * from (select * from [videos]) as [temp_table]) as [temp_table]';
        builder = getSqlserverBuilder();
        spyConnection = jest.spyOn(builder.getConnection(), 'select');
        await builder.from('posts').union(getSqlserverBuilder().from('videos')).count();
        expect(spyConnection).toHaveBeenCalledWith(expected, [], true);
    });
});
