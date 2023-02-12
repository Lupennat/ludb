import Raw from '../../query/expression';
import BuilderI from '../../types/query/builder';
import { getBuilder, getMySqlBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Havings', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Having Aggregate', async () => {
        const expected =
            'select count(*) as aggregate from (select (select `count(*)` from `videos` where `posts`.`id` = `videos`.`post_id`) as `videos_count` from `posts` having `videos_count` > ?) as `temp_table`';
        const builder = getMySqlBuilder();

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementationOnce(
            (_query: BuilderI, results: any[]): any[] => {
                return results;
            }
        );

        const spyConnection = jest.spyOn(builder.getConnection(), 'select');
        const spyConnectionDatabase = jest.spyOn(builder.getConnection(), 'getDatabaseName');

        builder
            .from('posts')
            .selectSub(query => {
                query.from('videos').select('count(*)').whereColumn('posts.id', '=', 'videos.post_id');
            }, 'videos_count')
            .having('videos_count', '>', 1);
        await builder.count();

        expect(spyConnectionDatabase).toBeCalled();
        expect(spyConnection).toBeCalledWith(expected, [1], true);
    });

    it('Works Havings', () => {
        let builder = getBuilder();
        builder.select('*').from('users').having('email', '>', 1);
        expect('select * from "users" having "email" > ?').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .orHaving('email', '=', 'test@example.com')
            .orHaving('email', '=', 'test2@example.com');
        expect('select * from "users" having "email" = ? or "email" = ?').toBe(builder.toSql());

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
    });

    it('Works Nested Havings', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .having('email', '=', 'foo')
            .orHaving(query => {
                query.having('name', '=', 'bar').having('age', '=', 25);
            });

        expect('select * from "users" having "email" = ? or ("name" = ? and "age" = ?)').toBe(builder.toSql());
        expect(['foo', 'bar', 25]).toEqual(builder.getBindings());
    });

    it('Works Nested Having Bindings', () => {
        const builder = getBuilder();
        builder.having('email', '=', 'foo').having(query => {
            query.selectRaw('?', ['ignore']).having('name', '=', 'bar');
        });

        expect(['foo', 'bar']).toEqual(builder.getBindings());
    });

    it('Works Having Betweens', () => {
        const builder = getBuilder();
        builder.select('*').from('users').havingBetween('id', [1, 2]);
        expect('select * from "users" having "id" between ? and ?').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Having Null', () => {
        let builder = getBuilder();
        builder.select('*').from('users').havingNull('email');
        expect('select * from "users" having "email" is null').toBe(builder.toSql());

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

    it('Works Having Shortcut', () => {
        const builder = getBuilder();
        builder.select('*').from('users').having('email', 1).orHaving('email', 2);
        expect('select * from "users" having "email" = ? or "email" = ?').toBe(builder.toSql());
    });

    it('Works Having Followed By Select Get', async () => {
        let builder = getBuilder();
        let executedQuery =
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > ?';

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation(
            (_query: BuilderI, results: any[]): any[] => {
                return results;
            }
        );

        let spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
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

        expect(spyedConnection).toBeCalledWith(executedQuery, ['popular', 3], true);
        expect([{ category: 'rock', total: 5 }]).toEqual(result.all());

        // Using \Raw value
        builder = getBuilder();
        executedQuery =
            'select "category", count(*) as "total" from "item" where "department" = ? group by "category" having "total" > 3';

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation(
            (_query: BuilderI, results: any[]): any[] => {
                return results;
            }
        );

        spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
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
        expect(spyedConnection).toBeCalledWith(executedQuery, ['popular'], true);
        expect([{ category: 'rock', total: 5 }]).toEqual(result.all());
    });

    it('Works Raw Havings', () => {
        let builder = getBuilder();
        builder.select('*').from('users').havingRaw('user_foo < user_bar');
        expect('select * from "users" having user_foo < user_bar').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').having('baz', '=', 1).orHavingRaw('user_foo < user_bar');
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
