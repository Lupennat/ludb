import Raw from '../../../query/expression';
import { ObjectArrayable, getBuilder, getMysqlBuilder, pdo } from '../fixtures/mocked';

describe('QueryBuilder Havings', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Having Aggregate', async () => {
        const expected =
            'select count(*) as aggregate from (select (select `count(*)` from `videos` where `posts`.`id` = `videos`.`post_id`) as `videos_count` from `posts` having `videos_count` > ?) as `temp_table`';
        const builder = getMysqlBuilder();

        const spyConnection = jest.spyOn(builder.getConnection(), 'select');
        const spyConnectionDatabase = jest.spyOn(builder.getConnection(), 'getDatabaseName');

        builder
            .from('posts')
            .selectSub(query => {
                query.from('videos').select('count(*)').whereColumn('posts.id', '=', 'videos.post_id');
            }, 'videos_count')
            .having('videos_count', '>', 1);
        await builder.count();

        expect(spyConnectionDatabase).toHaveBeenCalledWith();
        expect(spyConnection).toHaveBeenCalledWith(expected, [1], true);
    });

    it('Works Havings', () => {
        let builder = getBuilder();
        builder.select('*').from('users').having('email', '>', 1);
        expect('select * from "users" having "email" > ?').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').having('email', 10);
        expect('select * from "users" having "email" = ?').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .orHaving('email', '=', 'test@example.com')
            .orHaving('email', '=', 'test2@example.com');
        expect('select * from "users" having "email" = ? or "email" = ?').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').havingNot('email', '>', 1);
        expect('select * from "users" having not "email" > ?').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').havingNot('email', 10);
        expect('select * from "users" having not "email" = ?').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .orHavingNot('email', '=', 'test@example.com')
            .orHavingNot('email', '=', 'test2@example.com');
        expect('select * from "users" having not "email" = ? or not "email" = ?').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupBy('email').having('email', '>', 1);
        expect('select * from "users" group by "email" having "email" > ?').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('email as foo_email').from('users').having('foo_email', '>', 1);
        expect('select "email" as "foo_email" from "users" having "foo_email" > ?').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select(['category', new Raw('count(*) as "total"')])
            .from('item')
            .where('department', '=', 'popular')
            .groupBy('category')
            .having('total', '>', new Raw('3'));
        expect(
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select(['category', new Raw('count(*) as "total"')])
            .from('item')
            .where('department', '=', 'popular')
            .groupBy('category')
            .having('total', '>', 3);
        expect(
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?'
        ).toBe(builder.toSql());

        builder = getBuilder();
        expect(() => {
            builder.having(
                query => {
                    query.selectRaw('?', ['ignore']).having('name', '=', 'bar');
                },
                '=',
                'test'
            );
        }).toThrow('Value must be null when column is a callback.');

        builder = getBuilder();
        expect(() => {
            builder.select('*').from('users').having('id', '>', null);
        }).toThrow('Illegal operator and value combination.');
    });

    it('Works Nested Havings', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .having('email', '=', 'foo')
            .orHaving(query => {
                query.having('name', '=', 'bar').having('age', '=', 25);
            });

        expect('select * from "users" having "email" = ? or ("name" = ? and "age" = ?)').toBe(builder.toSql());
        expect(['foo', 'bar', 25]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingNot('email', '=', 'foo')
            .orHavingNot(query => {
                query.havingNot('name', '=', 'bar').havingNot('age', '=', 25);
            });

        expect('select * from "users" having not "email" = ? or (not "name" = ? and not "age" = ?)').toBe(
            builder.toSql()
        );
        expect(['foo', 'bar', 25]).toEqual(builder.getBindings());
    });

    it('Works Nested Having Bindings', () => {
        let builder = getBuilder();
        builder.having('email', '=', 'foo').having(query => {
            query.selectRaw('?', ['ignore']).having('name', '=', 'bar');
        });
        expect('select * having "email" = ? and ("name" = ?)').toBe(builder.toSql());
        expect(['foo', 'bar']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.havingNot('email', '=', 'foo').havingNot(query => {
            query.selectRaw('?', ['ignore']).havingNot('name', '=', 'bar');
        });
        expect('select * having not "email" = ? and (not "name" = ?)').toBe(builder.toSql());
        expect(['foo', 'bar']).toEqual(builder.getBindings());
    });

    it('Works Having Betweens', () => {
        let builder = getBuilder();
        builder.select('*').from('users').havingBetween('id', [1, 2]);
        expect('select * from "users" having "id" between ? and ?').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingBetween('id', new ObjectArrayable([1, 2]));
        expect('select * from "users" having "id" between ? and ?').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingBetween('id', [1, 2])
            .orHavingBetween('id', new ObjectArrayable([1, 2]));

        expect('select * from "users" having "id" between ? and ? or "id" between ? and ?').toBe(builder.toSql());

        expect([1, 2, 1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').havingBetweenNot('id', [1, 2]);
        expect('select * from "users" having "id" not between ? and ?').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingBetweenNot('id', new ObjectArrayable([1, 2]));
        expect('select * from "users" having "id" not between ? and ?').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingBetweenNot('id', [1, 2])
            .orHavingBetweenNot('id', new ObjectArrayable([1, 2]));
        expect('select * from "users" having "id" not between ? and ? or "id" not between ? and ?').toBe(
            builder.toSql()
        );
        expect([1, 2, 1, 2]).toEqual(builder.getBindings());
    });

    it('Works Having Null', () => {
        let builder = getBuilder();
        builder.select('*').from('users').havingNull('email');
        expect('select * from "users" having "email" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').havingNull(['email', 'phone']);
        expect('select * from "users" having "email" is null and "phone" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').havingNull('email').havingNull('phone');
        expect('select * from "users" having "email" is null and "phone" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').orHavingNull('email').orHavingNull('phone');
        expect('select * from "users" having "email" is null or "phone" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupBy('email').havingNull('email');
        expect('select * from "users" group by "email" having "email" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('email as foo_email').from('users').havingNull('foo_email');
        expect('select "email" as "foo_email" from "users" having "foo_email" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select(['category', new Raw('count(*) as "total"')])
            .from('item')
            .where('department', '=', 'popular')
            .groupBy('category')
            .havingNull('total');
        expect(
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is null'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select(['category', new Raw('count(*) as "total"')])
            .from('item')
            .where('department', '=', 'popular')
            .groupBy('category')
            .havingNull('total');
        expect(
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is null'
        ).toBe(builder.toSql());
    });

    it('Works Having Not Null', () => {
        let builder = getBuilder();
        builder.select('*').from('users').havingNotNull('email');
        expect('select * from "users" having "email" is not null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').havingNotNull('email').havingNotNull('phone');
        expect('select * from "users" having "email" is not null and "phone" is not null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').orHavingNotNull('email').orHavingNotNull('phone');
        expect('select * from "users" having "email" is not null or "phone" is not null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').groupBy('email').havingNotNull('email');
        expect('select * from "users" group by "email" having "email" is not null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('email as foo_email').from('users').havingNotNull('foo_email');
        expect('select "email" as "foo_email" from "users" having "foo_email" is not null').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select(['category', new Raw('count(*) as "total"')])
            .from('item')
            .where('department', '=', 'popular')
            .groupBy('category')
            .havingNotNull('total');
        expect(
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is not null'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select(['category', new Raw('count(*) as "total"')])
            .from('item')
            .where('department', '=', 'popular')
            .groupBy('category')
            .havingNotNull('total');
        expect(
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" is not null'
        ).toBe(builder.toSql());
    });

    it('Works Having Nested', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingNested(query => {
                query.having('created_at', '>=', '22:00').orHaving('created_at', '<=', '10:00');
            })
            .havingNested(
                query => {
                    query.having('created_at', '>=', '22:00').orHaving('created_at', '<=', '10:00');
                },
                'or',
                true
            );
        expect(builder.toSql()).toBe(
            'select * from "users" having ("created_at" >= ? or "created_at" <= ?) or not ("created_at" >= ? or "created_at" <= ?)'
        );
        expect(builder.getBindings()).toEqual(['22:00', '10:00', '22:00', '10:00']);
    });

    it('Works Add Nested Having Query', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .addNestedHavingQuery(
                getBuilder().having('created_at', '>=', '23:00').orHaving('created_at', '<=', '10:00')
            );
        expect(builder.toSql()).toBe('select * from "users" having ("created_at" >= ? or "created_at" <= ?)');
        expect(builder.getBindings()).toEqual(['23:00', '10:00']);
    });

    it('Works Having Shortcut', () => {
        const builder = getBuilder();
        builder.select('*').from('users').having('email', 1).orHaving('email', 2);
        expect('select * from "users" having "email" = ? or "email" = ?').toBe(builder.toSql());
    });

    it('Works Having Followed By Select Get', async () => {
        let builder = getBuilder();
        let executedQuery =
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?';

        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                {
                    category: 'rock',
                    total: 5
                }
            ];
        });

        builder.from('item');

        let result = await builder
            .select(['category', new Raw('count(*) as "total"')])
            .where('department', '=', 'popular')
            .groupBy('category')
            .having('total', '>', 3)
            .get();

        expect(spiedConnection).toHaveBeenCalledWith(executedQuery, ['popular', 3], true);
        expect([{ category: 'rock', total: 5 }]).toEqual(result);

        // Using \Raw value
        builder = getBuilder();
        executedQuery =
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3';

        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                {
                    category: 'rock',
                    total: 5
                }
            ];
        });

        builder.from('item');
        result = await builder
            .select(['category', new Raw('count(*) as "total"')])
            .where('department', '=', 'popular')
            .groupBy('category')
            .having('total', '>', new Raw('3'))
            .get();
        expect(spiedConnection).toHaveBeenCalledWith(executedQuery, ['popular'], true);
        expect([{ category: 'rock', total: 5 }]).toEqual(result);
    });

    it('Works Having Expression', () => {
        let builder = getBuilder();
        builder.select('*').from('users').having(new Raw('user_foo < user_bar'));
        expect(builder.toSql()).toBe('select * from "users" having user_foo < user_bar');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder.select('*').from('users').having(new Raw('user_foo < user_bar'), null, null, 'and', true);
        expect(builder.toSql()).toBe('select * from "users" having not user_foo < user_bar');
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Raw Havings', () => {
        let builder = getBuilder();
        builder.select('*').from('users').havingRaw('user_foo < user_bar');
        expect('select * from "users" having user_foo < user_bar').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').having('baz', '=', 1).orHavingRaw('user_foo < user_bar');
        expect('select * from "users" having "baz" = ? or user_foo < user_bar').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').having('baz', '=', 1).orHavingRaw(new Raw('user_foo < user_bar'));
        expect('select * from "users" having "baz" = ? or user_foo < user_bar').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .havingBetween('last_login_date', ['2018-11-16', '2018-12-16'])
            .orHavingRaw('user_foo < user_bar');
        expect('select * from "users" having "last_login_date" between ? and ? or user_foo < user_bar').toBe(
            builder.toSql()
        );
    });
});
