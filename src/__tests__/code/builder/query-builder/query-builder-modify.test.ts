import Raw from '../../../../query/expression';
import {
    getBuilder,
    getMysqlBuilder,
    getPostgresBuilder,
    getSqliteBuilder,
    getSqlserverBuilder
} from '../../fixtures/mocked';

describe('QueryBuilder Methods Modify', () => {
    it('Works Insert Method', async () => {
        const builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'insert').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "users" ("email") values (?)');
            expect(bindings).toEqual(['foo']);
            return true;
        });
        expect(await builder.from('users').insert({ email: 'foo' })).toBeTruthy();
        expect(await builder.from('users').insert({})).toBeTruthy();
        expect(await builder.from('users').insert([])).toBeTruthy();
    });

    it('Works Insert Method With Not Primitive Bindings', async () => {
        const builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'insert')
            .mockImplementationOnce(async (query, bindings) => {
                expect(query).toBe('insert into "users" ("json_col") values (?)');
                expect(bindings).toEqual(['{"nested":{"value":[0,"null","922323312312312312312"]}}']);
                return true;
            })
            .mockImplementationOnce(async (query, bindings) => {
                expect(query).toBe('insert into "users" ("json_col") values (?)');
                expect(bindings).toEqual(['[null,"test",[null,"invalid"]]']);
                return true;
            });
        expect(
            await builder
                .from('users')
                .insert({ json_col: { nested: { value: [0, 'null', BigInt('922323312312312312312')] } } })
        ).toBeTruthy();
        expect(
            await builder.from('users').insert({ json_col: [undefined, new Raw('test'), [null, 'invalid']] })
        ).toBeTruthy();
        expect(await builder.from('users').insert({})).toBeTruthy();
        expect(await builder.from('users').insert([])).toBeTruthy();
    });

    it('Works Insert Using Method', async () => {
        const builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "table1" ("foo") select "bar" from "table2" where "foreign_id" = ?');
            expect(bindings).toEqual([5]);
            return 1;
        });

        expect(
            await builder.from('table1').insertUsing(['foo'], query => {
                query.select(['bar']).from('table2').where('foreign_id', '=', 5);
            })
        ).toBe(1);
    });

    it('Works Insert Using With Expression', async () => {
        const builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select "id" from "users" where "id" > ?) insert into "posts" ("user_id") select * from "u"'
            );
            expect(bindings).toEqual([1]);
            return 1;
        });

        expect(
            await builder
                .from('posts')
                .withExpression('u', getBuilder().from('users').select('id').where('id', '>', 1))
                .insertUsing(['user_id'], getBuilder().from('u'))
        ).toBe(1);
    });

    it('Works Insert Using With Recursion Limit', async () => {
        let builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "posts" ("id") select "id" from "users" option (maxrecursion 100)');
            expect(bindings).toEqual([]);
            return 1;
        });

        expect(
            await builder.from('posts').recursionLimit(100).insertUsing(['id'], getBuilder().from('users').select('id'))
        ).toBe(1);

        builder = getMysqlBuilder();

        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into `posts` (`id`) option (maxrecursion 100) select `id` from `users`');
            expect(bindings).toEqual([]);
            return 1;
        });

        expect(
            await builder
                .from('posts')
                .recursionLimit(100)
                .insertUsing(['id'], getMysqlBuilder().from('users').select('id'))
        ).toBe(1);
    });

    it('Works Insert Using Method With Empty Columns', async () => {
        const builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "table1" select * from "table2" where "foreign_id" = ?');
            expect(bindings).toEqual([5]);
            return 1;
        });

        expect(
            await builder.from('table1').insertUsing([], query => {
                query.from('table2').where('foreign_id', '=', 5);
            })
        ).toBe(1);
    });

    it('Works Insert Using Method With All Columns', async () => {
        const builder = getBuilder();

        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "table1" select * from "table2" where "foreign_id" = ?');
            expect(bindings).toEqual([5]);
            return 1;
        });

        expect(
            await builder.from('table1').insertUsing(['*'], query => {
                query.from('table2').where('foreign_id', '=', 5);
            })
        ).toBe(1);
    });

    it('Works Insert Using Invalid Subquery', async () => {
        const builder = getBuilder();
        // @ts-expect-error test arguments error
        await expect(builder.from('table1').insertUsing(['foo'], ['bar'])).rejects.toThrow(
            'A subquery must be a query builder instance, a Closure, or a string.'
        );
    });

    it('Works Insert Or Ignore Method', async () => {
        const builder = getBuilder();
        await expect(builder.from('users').insertOrIgnore({ email: 'foo' })).rejects.toThrow(
            'This database engine does not support inserting while ignoring errors.'
        );
        expect(await builder.from('users').insertOrIgnore([])).toBe(0);
    });

    it('Works Mysql Insert Or Ignore Method', async () => {
        const builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert ignore into `users` (`email`) values (?)');
            expect(bindings).toEqual(['foo']);
            return 1;
        });
        expect(await builder.from('users').insertOrIgnore({ email: 'foo' })).toBe(1);
    });

    it('Works Postgres Insert Or Ignore Method', async () => {
        const builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement')
            .mockImplementationOnce(async (query, bindings) => {
                expect(query).toBe('insert into "users" ("email") values (?) on conflict do nothing');
                expect(bindings).toEqual(['foo']);
                return 1;
            })
            .mockImplementationOnce(async (query, bindings) => {
                expect(query).toBe('insert into "users" ("email") values (?), (?) on conflict do nothing');
                expect(bindings).toEqual(['foo', 'baz']);
                return 2;
            });
        expect(await builder.from('users').insertOrIgnore({ email: 'foo' })).toBe(1);
        expect(await builder.from('users').insertOrIgnore([{ email: 'foo' }, { email: 'baz' }])).toBe(2);
        await expect(
            builder.from('users').insertOrIgnore([{ email: 'foo' }, { email: 'baz', name: 'test' }])
        ).rejects.toThrow('Missing columns [name], please add to each rows.');
        await expect(
            builder.from('users').insertOrIgnore([{ email: 'foo', name: 'test', role: 'test' }, { email: 'baz' }])
        ).rejects.toThrow('Missing columns [name, role], please add to each rows.');
    });

    it('Works Sqlite Insert Or Ignore Method', async () => {
        const builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert or ignore into "users" ("email") values (?)');
            expect(bindings).toEqual(['foo']);
            return 1;
        });
        expect(await builder.from('users').insertOrIgnore({ email: 'foo' })).toBe(1);
    });

    it('Works Sqlserver Insert Or Ignore Method', async () => {
        const builder = getSqlserverBuilder();
        await expect(builder.from('users').insertOrIgnore({ email: 'foo' })).rejects.toThrow(
            'This database engine does not support inserting while ignoring errors.'
        );
    });

    it('Works Insert Get Id Method', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into "users" ("email") values (?)');
            expect(bindings).toEqual(['foo']);
            expect(sequence).toBe('id');
            return 1;
        });

        expect(await builder.from('users').insertGetId({ email: 'foo' }, 'id')).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into "users" ("email") values (?) returning "idCol"');
            expect(bindings).toEqual(['foo']);
            expect(sequence).toBe('idCol');
            return 1;
        });

        expect(await builder.from('users').insertGetId({ email: 'foo' }, 'idCol')).toBe(1);
    });

    it('Works Insert Get Id Method Removes Expressions', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into "users" ("email", "bar") values (?, bar)');
            expect(bindings).toEqual(['foo']);
            expect(sequence).toBe('id');
            return 1;
        });

        expect(await builder.from('users').insertGetId({ email: 'foo', bar: new Raw('bar') }, 'id')).toBe(1);
    });

    it('Works Insert Get Id With Empty Values', async () => {
        let builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into `users` () values ()');
            expect(bindings).toEqual([]);
            expect(sequence).toBeNull();
            return 1;
        });
        await builder.from('users').insertGetId({});

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into "users" default values returning "id"');
            expect(bindings).toEqual([]);
            expect(sequence).toBeNull();
            return 1;
        });
        await builder.from('users').insertGetId({});

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into "users" default values');
            expect(bindings).toEqual([]);
            expect(sequence).toBeNull();
            return 1;
        });
        await builder.from('users').insertGetId({});

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'insertGetId').mockImplementationOnce(async (query, bindings, sequence) => {
            expect(query).toBe('insert into [users] default values');
            expect(bindings).toEqual([]);
            expect(sequence).toBeNull();
            return 1;
        });
        await builder.from('users').insertGetId({});
    });

    it('Works Insert Method Respects Raw Bindings', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'insert').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "users" ("email") values (CURRENT TIMESTAMP)');
            expect(bindings).toEqual([]);
            return true;
        });
        expect(await builder.from('users').insert({ email: new Raw('CURRENT TIMESTAMP') })).toBeTruthy();
    });

    it('Works Multiple Inserts With Expression Values', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'insert').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('insert into "users" ("email") values (UPPER(\'Foo\')), (LOWER(\'Foo\'))');
            expect(bindings).toEqual([]);
            return true;
        });
        expect(
            await builder.from('users').insert([{ email: new Raw("UPPER('Foo')") }, { email: new Raw("LOWER('Foo')") }])
        ).toBeTruthy();
    });

    it('Works Update Method', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update "users" set "email" = ?, "name" = ? where "id" = ?');
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(await builder.from('users').where('id', '=', 1).update({ email: 'foo', name: 'bar' })).toBe(1);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update `users` set `email` = ?, `name` = ? where `id` = ? order by `foo` desc limit 5');
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .where('id', '=', 1)
                .orderBy('foo', 'desc')
                .limit(5)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Expressions', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "views" = (select count(*) from u), "update_at" = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getBuilder().from('users').where('id', '>', 1))
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with `u` as (select * from `users` where `id` > ?) update `posts` set `views` = (select count(*) from u), `update_at` = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });

        expect(
            await builder
                .from('posts')
                .withExpression('u', getMysqlBuilder().from('users').where('id', '>', 1))
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "views" = (select count(*) from u), "update_at" = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getPostgresBuilder().from('users').where('id', '>', 1))
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "views" = (select count(*) from u), "update_at" = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getSqliteBuilder().from('users').where('id', '>', 1))
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with [u] as (select * from [users] where [id] > ?) update [posts] set [views] = (select count(*) from u), [update_at] = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getSqlserverBuilder().from('users').where('id', '>', 1))
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);
    });

    it('Works Update Method With Join and Expressions', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" inner join "u" on "u"."id" = "posts"."user_id" and "u"."active" = ? set "views" = (select count(*) from u), "update_at" = ?'
            );
            expect(bindings).toEqual([1, true, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getBuilder().from('users').where('id', '>', 1))
                .join('u', join => {
                    return join.on('u.id', '=', 'posts.user_id').where('u.active', true);
                })
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with `u` as (select * from `users` where `id` > ?) update `posts` inner join `u` on `u`.`id` = `posts`.`user_id` and `u`.`active` = ? set `views` = (select count(*) from u), `update_at` = ?'
            );
            expect(bindings).toEqual([1, true, '2024-01-03']);
            return 1;
        });

        expect(
            await builder
                .from('posts')
                .withExpression('u', getMysqlBuilder().from('users').where('id', '>', 1))
                .join('u', join => {
                    return join.on('u.id', '=', 'posts.user_id').where('u.active', true);
                })
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "posts" set "views" = (select count(*) from u), "update_at" = ? where "ctid" in (with "u" as (select * from "users" where "id" > ?) select "posts"."ctid" from "posts" inner join "u" on "u"."id" = "posts"."user_id" and "u"."active" = ?)'
            );
            expect(bindings).toEqual(['2024-01-03', 1, true]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getPostgresBuilder().from('users').where('id', '>', 1))
                .join('u', join => {
                    return join.on('u.id', '=', 'posts.user_id').where('u.active', true);
                })
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "posts" set "views" = (select count(*) from u), "update_at" = ? where "rowid" in (with "u" as (select * from "users" where "id" > ?) select "posts"."rowid" from "posts" inner join "u" on "u"."id" = "posts"."user_id" and "u"."active" = ?)'
            );
            expect(bindings).toEqual(['2024-01-03', 1, true]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getSqliteBuilder().from('users').where('id', '>', 1))
                .join('u', join => {
                    return join.on('u.id', '=', 'posts.user_id').where('u.active', true);
                })
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with [u] as (select * from [users] where [id] > ?) update [posts] set [views] = (select count(*) from u), [update_at] = ? from [posts] inner join [u] on [u].[id] = [posts].[user_id] and [u].[active] = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03', true]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getSqlserverBuilder().from('users').where('id', '>', 1))
                .join('u', join => {
                    return join.on('u.id', '=', 'posts.user_id').where('u.active', true);
                })
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);
    });

    it('Works Update Method With Limit and Expressions', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "views" = (select count(*) from u), "update_at" = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getBuilder().from('users').where('id', '>', 1))
                .limit(1)
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with `u` as (select * from `users` where `id` > ?) update `posts` set `views` = (select count(*) from u), `update_at` = ? limit 1'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });

        expect(
            await builder
                .from('posts')
                .withExpression('u', getMysqlBuilder().from('users').where('id', '>', 1))
                .limit(1)
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "posts" set "views" = (select count(*) from u), "update_at" = ? where "ctid" in (with "u" as (select * from "users" where "id" > ?) select "posts"."ctid" from "posts" limit 1)'
            );
            expect(bindings).toEqual(['2024-01-03', 1]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getPostgresBuilder().from('users').where('id', '>', 1))
                .limit(1)
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "posts" set "views" = (select count(*) from u), "update_at" = ? where "rowid" in (with "u" as (select * from "users" where "id" > ?) select "posts"."rowid" from "posts" limit 1)'
            );
            expect(bindings).toEqual(['2024-01-03', 1]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getSqliteBuilder().from('users').where('id', '>', 1))
                .limit(1)
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with [u] as (select * from [users] where [id] > ?) update top (1) [posts] set [views] = (select count(*) from u), [update_at] = ?'
            );
            expect(bindings).toEqual([1, '2024-01-03']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getSqlserverBuilder().from('users').where('id', '>', 1))
                .limit(1)
                .update({ views: new Raw('(select count(*) from u)'), update_at: '2024-01-03' })
        ).toBe(1);
    });

    it('Works Upsert Method', async () => {
        let builder = getBuilder();
        await expect(
            builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar', role: 'baz' },
                    { name: 'bar2', email: 'foo2', role: 'baz2' }
                ],
                ['email', 'role'],
                ['email', 'name']
            )
        ).rejects.toThrow('This database engine does not support upserts.');

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'getConfig').mockImplementationOnce(option => {
            expect(option).toBe('use_upsert_alias');
            return false;
        });
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into `users` (`email`, `name`, `role`) values (?, ?, ?), (?, ?, ?) on duplicate key update `email` = values(`email`), `name` = values(`name`)'
            );
            expect(bindings).toEqual(['foo', 'bar', 'baz', 'foo2', 'bar2', 'baz2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar', role: 'baz' },
                    { name: 'bar2', email: 'foo2', role: 'baz2' }
                ],
                ['email', 'role'],
                ['email', 'name']
            )
        ).toBe(2);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'getConfig').mockImplementationOnce(option => {
            expect(option).toBe('use_upsert_alias');
            return true;
        });
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into `users` (`email`, `name`) values (?, ?), (?, ?) as laravel_upsert_alias on duplicate key update `name` = `laravel_upsert_alias`.`name`, `role` = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2', 'fake']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name', { role: 'fake' }]
            )
        ).toBe(2);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name", "role" = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2', 'fake']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name', { role: 'fake' }]
            )
        ).toBe(2);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "email" = "excluded"."email", "name" = "excluded"."name"'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email'
            )
        ).toBe(2);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into "users" ("email", "name") values (?, ?) on conflict ("email") do update set "name" = "excluded"."name", "role" = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 'fake']);
            return 2;
        });
        expect(
            await builder.from('users').upsert({ email: 'foo', name: 'bar' }, 'email', ['name', { role: 'fake' }])
        ).toBe(2);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [email] = [laravel_source].[email], [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name])'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email'
            )
        ).toBe(2);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'merge [users] using (values (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [email] = [laravel_source].[email], [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name])'
            );
            expect(bindings).toEqual(['foo', 'bar']);
            return 2;
        });
        expect(await builder.from('users').upsert({ email: 'foo', name: 'bar' }, 'email')).toBe(2);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [name] = [laravel_source].[name], [role] = ? when not matched then insert ([email], [name]) values ([email], [name])'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2', 'fake']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name', { role: 'fake' }]
            )
        ).toBe(2);
    });

    it('Works Upsert Return Zero On Empty Columns', async () => {
        const builder = getMysqlBuilder();
        expect(await builder.upsert([], 'email', ['name'])).toBe(0);
    });

    it('Works Upsert Without Update Columns Call Insert', async () => {
        const builder = getMysqlBuilder();
        const spiedInsert = jest.spyOn(builder, 'insert').mockImplementation(async () => true);
        expect(
            await builder.upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                []
            )
        ).toBe(2);
        expect(spiedInsert).toHaveBeenCalledWith([
            { email: 'foo', name: 'bar' },
            { name: 'bar2', email: 'foo2' }
        ]);
        expect(await builder.upsert({ name: 'bar2', email: 'foo2' }, 'email', [])).toBe(1);
        expect(spiedInsert).toHaveBeenCalledWith({ name: 'bar2', email: 'foo2' });
    });

    it('Works Upsert Method With Update Columns', async () => {
        let builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'getConfig').mockImplementationOnce(option => {
            expect(option).toBe('use_upsert_alias');
            return false;
        });
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into `users` (`email`, `name`) values (?, ?), (?, ?) on duplicate key update `name` = values(`name`)'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name']
            )
        ).toBe(2);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'getConfig').mockImplementationOnce(option => {
            expect(option).toBe('use_upsert_alias');
            return true;
        });
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into `users` (`email`, `name`) values (?, ?), (?, ?) as laravel_upsert_alias on duplicate key update `name` = `laravel_upsert_alias`.`name`'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name']
            )
        ).toBe(2);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name"'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name']
            )
        ).toBe(2);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'insert into "users" ("email", "name") values (?, ?), (?, ?) on conflict ("email") do update set "name" = "excluded"."name"'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name']
            )
        ).toBe(2);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'affectingStatement').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'merge [users] using (values (?, ?), (?, ?)) [laravel_source] ([email], [name]) on [laravel_source].[email] = [users].[email] when matched then update set [name] = [laravel_source].[name] when not matched then insert ([email], [name]) values ([email], [name])'
            );
            expect(bindings).toEqual(['foo', 'bar', 'foo2', 'bar2']);
            return 2;
        });
        expect(
            await builder.from('users').upsert(
                [
                    { email: 'foo', name: 'bar' },
                    { name: 'bar2', email: 'foo2' }
                ],
                'email',
                ['name']
            )
        ).toBe(2);
    });

    it('Works Update Method With Joins', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" inner join "orders" on "users"."id" = "orders"."user_id" set "email" = ?, "name" = ? where "users"."id" = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ? set "email" = ?, "name" = ?'
            );
            expect(bindings).toEqual([1, 'foo', 'bar']);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Joins On Sqlserver', async () => {
        let builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] where [users].[id] = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] and [users].[id] = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Joins And Aliases On Sqlserver', async () => {
        const builder = getSqlserverBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update [u] set [email] = ?, [name] = ? from [users] as [u] inner join [orders] on [u].[id] = [orders].[user_id] where [u].[id] = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users as u')
                .join('orders', 'u.id', '=', 'orders.user_id')
                .where('u.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Joins On Mysql', async () => {
        let builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` set `email` = ?, `name` = ? where `users`.`id` = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` and `users`.`id` = ? set `email` = ?, `name` = ?'
            );
            expect(bindings).toEqual([1, 'foo', 'bar']);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Joins On Mysql', async () => {
        let builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` set `email` = ?, `name` = ? where `users`.`id` = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getMysqlBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` and `users`.`id` = ? set `email` = ?, `name` = ?'
            );
            expect(bindings).toEqual([1, 'foo', 'bar']);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Joins On Sqlite', async () => {
        let builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" where "users"."id" = ?)'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ?)'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" as "u" set "email" = ?, "name" = ? where "rowid" in (select "u"."rowid" from "users" as "u" inner join "orders" as "o" on "u"."id" = "o"."user_id")'
            );
            expect(bindings).toEqual(['foo', 'bar']);
            return 1;
        });
        expect(
            await builder
                .from('users as u')
                .join('orders as o', 'u.id', '=', 'o.user_id')
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Limit On Sqlite', async () => {
        const builder = getSqliteBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? where "rowid" in (select "users"."rowid" from "users" where "users"."id" > ? order by "id" asc limit 3)'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });

        expect(
            await builder
                .from('users')
                .where('users.id', '>', 1)
                .limit(3)
                .oldest('id')
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method With Joins On Postgres', async () => {
        let builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" where "users"."id" = ?)'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ?)'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? where "ctid" in (select "users"."ctid" from "users" inner join "orders" on "users"."id" = "orders"."user_id" and "users"."id" = ? where "name" = ?)'
            );
            expect(bindings).toEqual(['foo', 'bar', 1, 'baz']);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .where('name', 'baz')
                .update({ email: 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Method Without Joins On Postgres', async () => {
        let builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update "users" set "email" = ?, "name" = ? where "id" = ?');
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(await builder.from('users').where('id', '=', 1).update({ email: 'foo', name: 'bar' })).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update "users" set "email" = ?, "name" = ? where "id" = ?');
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });

        expect(
            await builder
                .from('users')
                .where('id', '=', 1)
                .selectRaw('?', ['ignore'])
                .update({ 'users.email': 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update "users"."users" set "email" = ?, "name" = ? where "id" = ?');
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });

        expect(
            await builder
                .from('users.users')
                .where('id', '=', 1)
                .selectRaw('?', ['ignore'])
                .update({ 'users.users.email': 'foo', name: 'bar' })
        ).toBe(1);
    });

    it('Works Update From Method With Joins On Postgres', async () => {
        let builder = getBuilder();
        await expect(
            builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .updateFrom({ email: 'foo', name: 'bar' })
        ).rejects.toThrow('This database engine does not support the updateFrom method.');

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update "users" set "email" = ?, "name" = ? where "name" = ?');
            expect(bindings).toEqual(['foo', 'bar', 'baz']);
            return 1;
        });
        expect(await builder.from('users').where('name', 'baz').updateFrom({ email: 'foo', name: 'bar' })).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = ? and "users"."id" = "orders"."user_id"'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', 'users.id', '=', 'orders.user_id')
                .where('users.id', '=', 1)
                .updateFrom({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = "orders"."user_id" and "users"."id" = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .updateFrom({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "email" = ?, "name" = ? from "orders" where "name" = ? and "users"."id" = "orders"."user_id" and "users"."id" = ?'
            );
            expect(bindings).toEqual(['foo', 'bar', 'baz', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .where('name', 'baz')
                .updateFrom({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'update "users" set "options" = jsonb_set(jsonb_set("options"::jsonb, \'{"language"}\', ?::jsonb), \'{"size"}\', \'\'full\'\') from "orders" where "name" = ? and "users"."id" = "orders"."user_id" and "users"."id" = ?'
            );
            expect(bindings).toEqual(['["english","italian"]', 'baz', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .join('orders', join => {
                    join.on('users.id', '=', 'orders.user_id').where('users.id', '=', 1);
                })
                .where('name', 'baz')
                .updateFrom({ 'options->language': ['english', 'italian'], 'options->size': new Raw("'full'") })
        ).toBe(1);
    });

    it('Works Update From Method With Joins And Expressions On Postgres', async () => {
        let builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "views" = "u"."followers" where "name" = ?'
            );
            expect(bindings).toEqual([1, 'baz']);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getPostgresBuilder().from('users').where('id', '>', 1))
                .where('name', 'baz')
                .updateFrom({ views: new Raw('"u"."followers"') })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "email" = ?, "name" = ? from "u" where "u"."id" = ? and "u"."id" = "posts"."user_id"'
            );
            expect(bindings).toEqual([1, 'foo', 'bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getPostgresBuilder().from('users').where('id', '>', 1))
                .join('u', 'u.id', '=', 'posts.user_id')
                .where('u.id', '=', 1)
                .updateFrom({ email: 'foo', name: 'bar' })
        ).toBe(1);

        builder = getPostgresBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe(
                'with "u" as (select * from "users" where "id" > ?) update "posts" set "options" = jsonb_set(jsonb_set("options"::jsonb, \'{"language"}\', ?::jsonb), \'{"size"}\', \'\'full\'\') from "u" where "name" = ? and "u"."id" = "posts"."user_id" and "u"."id" = ?'
            );
            expect(bindings).toEqual([1, '["english","italian"]', 'baz', 1]);
            return 1;
        });
        expect(
            await builder
                .from('posts')
                .withExpression('u', getPostgresBuilder().from('users').where('id', '>', 1))
                .join('u', join => {
                    join.on('u.id', '=', 'posts.user_id').where('u.id', '=', 1);
                })
                .where('name', 'baz')
                .updateFrom({ 'options->language': ['english', 'italian'], 'options->size': new Raw("'full'") })
        ).toBe(1);
    });

    it('Works Update Method Respects Raw', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'update').mockImplementationOnce(async (query, bindings) => {
            expect(query).toBe('update "users" set "email" = foo, "name" = ? where "id" = ?');
            expect(bindings).toEqual(['bar', 1]);
            return 1;
        });
        expect(
            await builder
                .from('users')
                .where('id', '=', 1)
                .update({ email: new Raw('foo'), name: 'bar' })
        ).toBe(1);
    });

    it('Works Update Or Insert Method', async () => {
        let builder = getBuilder();
        let spiedWhere = jest.spyOn(builder, 'where');
        const spiedInsert = jest.spyOn(builder, 'insert').mockImplementationOnce(async () => true);
        jest.spyOn(builder, 'exists').mockImplementationOnce(async () => false);

        expect(await builder.updateOrInsert({ email: 'foo' }, { name: 'bar' })).toBeTruthy();
        expect(spiedWhere).toHaveBeenCalledWith({ email: 'foo' });
        expect(spiedInsert).toHaveBeenCalledWith({ email: 'foo', name: 'bar' });

        builder = getBuilder();
        spiedWhere = jest.spyOn(builder, 'where');
        const spiedUpdate = jest.spyOn(builder, 'update').mockImplementationOnce(async () => 1);
        const spiedLimit = jest.spyOn(builder, 'limit');
        jest.spyOn(builder, 'exists').mockImplementationOnce(async () => true);

        expect(await builder.updateOrInsert({ email: 'foo' }, { name: 'bar' })).toBeTruthy();
        expect(spiedLimit).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith({ name: 'bar' });
    });

    it('Works Update Or Insert Method With Empty Update Values', async () => {
        const builder = getBuilder();
        const spiedWhere = jest.spyOn(builder, 'where');
        const spiedUpdate = jest.spyOn(builder, 'update');
        jest.spyOn(builder, 'exists').mockImplementationOnce(async () => true);

        expect(await builder.updateOrInsert({ email: 'foo' })).toBeTruthy();
        expect(spiedWhere).toHaveBeenCalledWith({ email: 'foo' });
        expect(spiedUpdate).not.toHaveBeenCalled();
    });

    it('Works Increment', async () => {
        const builder = getBuilder();
        jest.spyOn(builder, 'update').mockImplementation(async () => 1);
        const spiedEach = jest.spyOn(builder, 'incrementEach');
        await builder.increment('votes');
        expect(spiedEach).toHaveBeenLastCalledWith({ votes: 1 }, {});
        await builder.increment('votes', BigInt('2'));
        expect(spiedEach).toHaveBeenLastCalledWith({ votes: BigInt('2') }, {});
        await builder.increment('votes', '3', { name: 'Claudio' });
        expect(spiedEach).toHaveBeenLastCalledWith({ votes: '3' }, { name: 'Claudio' });
    });

    it('Works Increment Throw Error When Not Numeric', async () => {
        const builder = getBuilder();
        await expect(builder.increment('votes', 'ab')).rejects.toThrow('Non-numeric value passed to increment method.');
    });

    it('Works Increment Each', async () => {
        const builder = getBuilder();
        const spiedUpdate = jest.spyOn(builder, 'update').mockImplementation(async () => 2);

        await builder.incrementEach({
            votes: 2,
            balance: 100
        });

        expect(spiedUpdate).toHaveBeenLastCalledWith({
            votes: new Raw('"votes" + 2'),
            balance: new Raw('"balance" + 100')
        });
        await builder.incrementEach(
            {
                votes: 2,
                balance: 100
            },
            { name: 'Claudio' }
        );
        expect(spiedUpdate).toHaveBeenLastCalledWith({
            votes: new Raw('"votes" + 2'),
            balance: new Raw('"balance" + 100'),
            name: 'Claudio'
        });
    });

    it('Works Increment Many Argument Validation', async () => {
        const builder = getBuilder();
        await expect(builder.from('users').incrementEach({ col: 'a' })).rejects.toThrow(
            "Non-numeric value passed as increment amount for column: 'col'."
        );
    });

    it('Works Decrement', async () => {
        const builder = getBuilder();
        jest.spyOn(builder, 'update').mockImplementation(async () => 2);
        const spiedEach = jest.spyOn(builder, 'decrementEach');
        await builder.decrement('votes');
        expect(spiedEach).toHaveBeenLastCalledWith({ votes: 1 }, {});
        await builder.decrement('votes', BigInt('2'));
        expect(spiedEach).toHaveBeenLastCalledWith({ votes: BigInt('2') }, {});
        await builder.decrement('votes', '3', { name: 'Claudio' });
        expect(spiedEach).toHaveBeenLastCalledWith({ votes: '3' }, { name: 'Claudio' });
    });

    it('Works Decrement Throw Error When Not Numeric', async () => {
        const builder = getBuilder();
        await expect(builder.decrement('votes', 'ab')).rejects.toThrow('Non-numeric value passed to decrement method.');
    });

    it('Works Decrement Each', async () => {
        const builder = getBuilder();
        const spiedUpdate = jest.spyOn(builder, 'update').mockImplementation(async () => 2);

        await builder.decrementEach({
            votes: 2,
            balance: 100
        });

        expect(spiedUpdate).toHaveBeenLastCalledWith({
            votes: new Raw('"votes" - 2'),
            balance: new Raw('"balance" - 100')
        });
        await builder.decrementEach(
            {
                votes: 2,
                balance: 100
            },
            { name: 'Claudio' }
        );
        expect(spiedUpdate).toHaveBeenLastCalledWith({
            votes: new Raw('"votes" - 2'),
            balance: new Raw('"balance" - 100'),
            name: 'Claudio'
        });
    });

    it('Works Decrement Many Argument Validation', async () => {
        const builder = getBuilder();
        await expect(builder.from('users').decrementEach({ col: 'a' })).rejects.toThrow(
            "Non-numeric value passed as decrement amount for column: 'col'."
        );
    });
});
