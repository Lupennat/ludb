import GrammarBuilderI from '../../../types/query/grammar-builder';
import {
    getBuilder,
    getMysqlBuilder,
    getPostgresBuilder,
    getSqliteBuilder,
    getSqlserverBuilder
} from '../fixtures/mocked';

describe('QueryBuilder Cte', () => {
    it('Works With Expressions', async () => {
        const posts = (query: GrammarBuilderI): GrammarBuilderI => {
            return query.from('posts');
        };

        expect(
            'with "u" as (select * from "users"), "p" as (select * from "posts") select "u"."id" from "table"."u" inner join "p" on "p"."user_id" = "u"."id" order by "u"."id" asc'
        ).toBe(
            getBuilder()
                .from('table.u')
                .select('u.id')
                .withExpression('u', getBuilder().from('users'))
                .withExpression('p', posts)
                .join('p', 'p.user_id', '=', 'u.id')
                .orderBy('u.id')
                .toSql()
        );

        expect(
            'with `u` as (select * from `users`), `p` as (select * from `posts`) select `u`.`id` from `u` inner join `p` on `p`.`user_id` = `u`.`id`'
        ).toBe(
            getMysqlBuilder()
                .from('u')
                .select('u.id')
                .withExpression('u', getMysqlBuilder().from('users'))
                .withExpression('p', getMysqlBuilder().from('posts'))
                .join('p', 'p.user_id', '=', 'u.id')
                .toSql()
        );

        expect(
            'with "u" as (select * from "users"), "p" as (select * from "posts") select "u"."id" from "u" inner join "p" on "p"."user_id" = "u"."id"'
        ).toBe(
            getPostgresBuilder()
                .from('u')
                .select('u.id')
                .withExpression('u', getPostgresBuilder().from('users'))
                .withExpression('p', getPostgresBuilder().from('posts'))
                .join('p', 'p.user_id', '=', 'u.id')
                .toSql()
        );

        expect(
            'with "u" as (select * from "users"), "p" as (select * from "posts") select "u"."id" from "u" inner join "p" on "p"."user_id" = "u"."id"'
        ).toBe(
            getSqliteBuilder()
                .from('u')
                .select('u.id')
                .withExpression('u', getSqliteBuilder().from('users'))
                .withExpression('p', getSqliteBuilder().from('posts'))
                .join('p', 'p.user_id', '=', 'u.id')
                .toSql()
        );

        expect(
            'with [u] as (select * from [users]), [p] as (select * from [posts]) select [u].[id] from [u] inner join [p] on [p].[user_id] = [u].[id]'
        ).toBe(
            getSqlserverBuilder()
                .from('u')
                .select('u.id')
                .withExpression('u', getSqlserverBuilder().from('users'))
                .withExpression('p', getSqlserverBuilder().from('posts'))
                .join('p', 'p.user_id', '=', 'u.id')
                .toSql()
        );
    });

    it('Works With Recursive Expressions', async () => {
        let query = getBuilder()
            .selectRaw('1')
            .unionAll(getBuilder().selectRaw('number + 1').from('numbers').where('number', '<', 3));

        let builder = getBuilder().from('numbers').withRecursiveExpression('numbers', query);

        expect(
            'with recursive "numbers" as ((select 1) union all (select number + 1 from "numbers" where "number" < ?)) select * from "numbers"'
        ).toBe(builder.toSql());
        expect([3]).toEqual(builder.getBindings());

        query = getMysqlBuilder()
            .selectRaw('1')
            .unionAll(getMysqlBuilder().selectRaw('number + 1').from('numbers').where('number', '<', 3));

        builder = getMysqlBuilder().from('numbers').withRecursiveExpression('numbers', query, ['number']);

        expect(
            'with recursive `numbers` (`number`) as ((select 1) union all (select number + 1 from `numbers` where `number` < ?)) select * from `numbers`'
        ).toBe(builder.toSql());
        expect([3]).toEqual(builder.getBindings());

        query = getPostgresBuilder()
            .selectRaw('1')
            .unionAll(getPostgresBuilder().selectRaw('number + 1').from('numbers').where('number', '<', 3));

        builder = getPostgresBuilder().from('numbers').withRecursiveExpression('numbers', query, ['number']);

        expect(
            'with recursive "numbers" ("number") as ((select 1) union all (select number + 1 from "numbers" where "number" < ?)) select * from "numbers"'
        ).toBe(builder.toSql());
        expect([3]).toEqual(builder.getBindings());

        query = getSqliteBuilder()
            .selectRaw('1')
            .unionAll(getSqliteBuilder().selectRaw('number + 1').from('numbers').where('number', '<', 3));

        builder = getSqliteBuilder().from('numbers').withRecursiveExpression('numbers', query, ['number']);

        expect(
            'with recursive "numbers" ("number") as (select * from (select 1) union all select * from (select number + 1 from "numbers" where "number" < ?)) select * from "numbers"'
        ).toBe(builder.toSql());
        expect([3]).toEqual(builder.getBindings());

        query = getSqlserverBuilder()
            .selectRaw('1')
            .unionAll(getSqlserverBuilder().selectRaw('number + 1').from('numbers').where('number', '<', 3));

        builder = getSqlserverBuilder().from('numbers').withRecursiveExpression('numbers', query, ['number']);

        expect(
            'with [numbers] ([number]) as (select * from (select 1) as [temp_table] union all select * from (select number + 1 from [numbers] where [number] < ?) as [temp_table]) select * from [numbers]'
        ).toBe(builder.toSql());
        expect([3]).toEqual(builder.getBindings());
    });

    it('Works Recursion Expression And Cycle Detection', () => {
        let query = getBuilder()
            .selectRaw('1')
            .unionAll(getBuilder().selectRaw('number + 1').selectRaw('(number + 1) % 5').from('numbers'));

        expect(
            'with recursive "numbers" as ((select 1) union all (select number + 1, (number + 1) % 5 from "numbers")) cycle "modulo" set "is_cycle" using "path" select *'
        ).toBe(getBuilder().withRecursiveExpressionAndCycleDetection('numbers', query, ['modulo']).toSql());

        query = getBuilder()
            .selectRaw('1')
            .unionAll(getBuilder().selectRaw('number + 1').selectRaw('(number + 1) % 5').from('numbers'));

        expect(
            'with recursive "numbers" ("number", "modulo") as ((select 1) union all (select number + 1, (number + 1) % 5 from "numbers")) cycle "modulo" set "is_cycle" using "path" select *'
        ).toBe(
            getBuilder()
                .withRecursiveExpressionAndCycleDetection('numbers', query, ['modulo'], 'is_cycle', 'path', [
                    'number',
                    'modulo'
                ])
                .toSql()
        );

        query = getMysqlBuilder()
            .selectRaw('1')
            .unionAll(getBuilder().selectRaw('number + 1').selectRaw('(number + 1) % 5').from('numbers'));

        expect(
            'with recursive `numbers` (`number`, `modulo`) as ((select 1) union all (select number + 1, (number + 1) % 5 from "numbers")) cycle `modulo` restrict select *'
        ).toBe(
            getMysqlBuilder()
                .withRecursiveExpressionAndCycleDetection('numbers', query, ['modulo'], 'is_cycle', 'path', [
                    'number',
                    'modulo'
                ])
                .toSql()
        );

        query = getPostgresBuilder()
            .selectRaw('1')
            .unionAll(getBuilder().selectRaw('number + 1').selectRaw('(number + 1) % 5').from('numbers'));

        expect(
            'with recursive "numbers" ("number", "modulo") as ((select 1) union all (select number + 1, (number + 1) % 5 from "numbers")) cycle "modulo" set "is_cycle" using "path" select *'
        ).toBe(
            getPostgresBuilder()
                .withRecursiveExpressionAndCycleDetection('numbers', query, ['modulo'], 'is_cycle', 'path', [
                    'number',
                    'modulo'
                ])
                .toSql()
        );
    });

    it('Works Materialized Expression', () => {
        expect('with "u" as materialized (select * from "users") select "u"."id" from "u"').toBe(
            getBuilder().select('u.id').from('u').withMaterializedExpression('u', getBuilder().from('users')).toSql()
        );

        expect('with `u` as materialized (select * from `users`) select `u`.`id` from `u`').toBe(
            getMysqlBuilder()
                .select('u.id')
                .from('u')
                .withMaterializedExpression('u', getMysqlBuilder().from('users'))
                .toSql()
        );

        expect('with "u" as materialized (select * from "users") select "u"."id" from "u"').toBe(
            getPostgresBuilder()
                .select('u.id')
                .from('u')
                .withMaterializedExpression('u', getPostgresBuilder().from('users'))
                .toSql()
        );

        expect('with "u" as materialized (select * from "users") select "u"."id" from "u"').toBe(
            getSqliteBuilder()
                .select('u.id')
                .from('u')
                .withMaterializedExpression('u', getSqliteBuilder().from('users'))
                .toSql()
        );

        expect('with [u] as materialized (select * from [users]) select [u].[id] from [u]').toBe(
            getSqlserverBuilder()
                .select('u.id')
                .from('u')
                .withMaterializedExpression('u', getSqlserverBuilder().from('users'))
                .toSql()
        );
    });

    it('Works Non Materialized Expression', () => {
        expect('with "u" as not materialized (select * from "users") select "u"."id" from "u"').toBe(
            getBuilder().select('u.id').from('u').withNonMaterializedExpression('u', getBuilder().from('users')).toSql()
        );

        expect('with `u` as not materialized (select * from `users`) select `u`.`id` from `u`').toBe(
            getMysqlBuilder()
                .select('u.id')
                .from('u')
                .withNonMaterializedExpression('u', getMysqlBuilder().from('users'))
                .toSql()
        );

        expect('with "u" as not materialized (select * from "users") select "u"."id" from "u"').toBe(
            getPostgresBuilder()
                .select('u.id')
                .from('u')
                .withNonMaterializedExpression('u', getPostgresBuilder().from('users'))
                .toSql()
        );

        expect('with "u" as not materialized (select * from "users") select "u"."id" from "u"').toBe(
            getSqliteBuilder()
                .select('u.id')
                .from('u')
                .withNonMaterializedExpression('u', getSqliteBuilder().from('users'))
                .toSql()
        );

        expect('with [u] as not materialized (select * from [users]) select [u].[id] from [u]').toBe(
            getSqlserverBuilder()
                .select('u.id')
                .from('u')
                .withNonMaterializedExpression('u', getSqlserverBuilder().from('users'))
                .toSql()
        );
    });

    it('Works Outer Union', () => {
        let builder = getBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getBuilder().from('u').where('id', 2))
            .withExpression('u', getBuilder().from('users'));

        expect(
            'with "u" as (select * from "users") (select * from "u" where "id" = ?) union all (select * from "u" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getMysqlBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getMysqlBuilder().from('u').where('id', 2))
            .withExpression('u', getMysqlBuilder().from('users'));

        expect(
            'with `u` as (select * from `users`) (select * from `u` where `id` = ?) union all (select * from `u` where `id` = ?)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getPostgresBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getPostgresBuilder().from('u').where('id', 2))
            .withExpression('u', getPostgresBuilder().from('users'));

        expect(
            'with "u" as (select * from "users") (select * from "u" where "id" = ?) union all (select * from "u" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSqliteBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getSqliteBuilder().from('u').where('id', 2))
            .withExpression('u', getSqliteBuilder().from('users'));

        expect(
            'with "u" as (select * from "users") select * from (select * from "u" where "id" = ?) union all select * from (select * from "u" where "id" = ?)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSqlserverBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getSqlserverBuilder().from('u').where('id', 2))
            .withExpression('u', getSqlserverBuilder().from('users'));

        expect(
            'with [u] as (select * from [users]) select * from (select * from [u] where [id] = ?) as [temp_table] union all select * from (select * from [u] where [id] = ?) as [temp_table]'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Outer Union With Recursion', () => {
        let builder = getBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getBuilder().from('u').where('id', 2))
            .withExpression('u', getBuilder().from('users'))
            .recursionLimit(100);

        expect(
            'with "u" as (select * from "users") (select * from "u" where "id" = ?) union all (select * from "u" where "id" = ?) option (maxrecursion 100)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getMysqlBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getMysqlBuilder().from('u').where('id', 2))
            .withExpression('u', getMysqlBuilder().from('users'))
            .recursionLimit(100);

        expect(
            'with `u` as (select * from `users`) (select * from `u` where `id` = ?) union all (select * from `u` where `id` = ?) option (maxrecursion 100)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getPostgresBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getPostgresBuilder().from('u').where('id', 2))
            .withExpression('u', getPostgresBuilder().from('users'))
            .recursionLimit(100);

        expect(
            'with "u" as (select * from "users") (select * from "u" where "id" = ?) union all (select * from "u" where "id" = ?) option (maxrecursion 100)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSqliteBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getSqliteBuilder().from('u').where('id', 2))
            .withExpression('u', getSqliteBuilder().from('users'))
            .recursionLimit(100);

        expect(
            'with "u" as (select * from "users") select * from (select * from "u" where "id" = ?) union all select * from (select * from "u" where "id" = ?) option (maxrecursion 100)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getSqlserverBuilder()
            .from('u')
            .where('id', 1)
            .unionAll(getSqlserverBuilder().from('u').where('id', 2))
            .withExpression('u', getSqlserverBuilder().from('users'))
            .recursionLimit(100);

        expect(
            'with [u] as (select * from [users]) select * from (select * from [u] where [id] = ?) as [temp_table] union all select * from (select * from [u] where [id] = ?) as [temp_table] option (maxrecursion 100)'
        ).toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Recursion Limit', () => {
        expect('select * from "users" option (maxrecursion 100)').toBe(
            getBuilder().from('users').recursionLimit(100).toSql()
        );
        expect('select * from "users"').toBe(getBuilder().from('users').recursionLimit().toSql());
        expect('select * from `users` option (maxrecursion 100)').toBe(
            getMysqlBuilder().from('users').recursionLimit(100).toSql()
        );
        expect('select * from "users" option (maxrecursion 100)').toBe(
            getPostgresBuilder().from('users').recursionLimit(100).toSql()
        );
        expect('select * from "users" option (maxrecursion 100)').toBe(
            getSqliteBuilder().from('users').recursionLimit(100).toSql()
        );
        expect('select * from [users] option (maxrecursion 100)').toBe(
            getSqlserverBuilder().from('users').recursionLimit(100).toSql()
        );
    });
});
