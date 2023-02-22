import Raw from '../../query/expression';
import {
    getBuilder,
    getBuilderAlternative,
    getMySqlBuilder,
    getMySqlBuilderWithProcessor,
    getPostgresBuilder,
    getSQLiteBuilder,
    getSqlServerBuilder,
    pdo
} from '../fixtures/mocked';
describe('Query Builder Select-From', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Basic Select', () => {
        let builder = getBuilder();
        builder.select('*').from('users');
        expect(builder.toSql()).toBe('select * from "users"');
        builder = getBuilder();
        builder.select().from('users');
        expect(builder.toSql()).toBe('select * from "users"');
    });

    it('Works Basic Select Sub', () => {
        const builder = getBuilder();
        builder
            .select({ nickname: getBuilder().from('two').select('baz').where('subkey', '=', 'subval') })
            .from('users');
        expect(builder.toSql()).toBe('select (select "baz" from "two" where "subkey" = ?) as "nickname" from "users"');
        expect(builder.getBindings()).toEqual(['subval']);
    });

    it('Works Basic Select With Get Columns', async () => {
        const builder = getBuilder();
        const spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async sql => {
                expect('select * from "users"').toBe(sql);
                return [];
            })
            .mockImplementationOnce(async sql => {
                expect('select "foo", "bar" from "users"').toBe(sql);
                return [];
            })
            .mockImplementationOnce(async sql => {
                expect('select "baz" from "users"').toBe(sql);
                return [];
            });

        await builder.from('users').get();
        expect(builder.getRegistry().columns).toBeNull();

        await builder.from('users').get(['foo', 'bar']);
        expect(builder.getRegistry().columns).toBeNull();

        await builder.from('users').get('baz');
        expect(builder.getRegistry().columns).toBeNull();

        expect('select * from "users"').toBe(builder.toSql());
        expect(builder.getRegistry().columns).toBeNull();

        expect(spyProcess).toBeCalledTimes(3);
    });

    it('Works Basic Select User Write Pdo', async () => {
        let builder = getMySqlBuilderWithProcessor();
        let spyConnection = jest.spyOn(builder.getConnection(), 'select');

        await builder.useWritePdo().select('*').from('users').get();
        expect(spyConnection).toBeCalledWith('select * from `users`', [], false);

        builder = getMySqlBuilderWithProcessor();
        spyConnection = jest.spyOn(builder.getConnection(), 'select');

        await builder.select('*').from('users').get();
        expect(spyConnection).toBeCalledWith('select * from `users`', [], true);
    });

    it('Works Adding Selects', () => {
        let builder = getBuilder();
        builder.select('foo').addSelect('bar').addSelect(['baz', 'boom']).addSelect('bar').from('users');
        expect(builder.toSql()).toBe('select "foo", "bar", "baz", "boom" from "users"');

        builder = getBuilder();
        builder
            .from('users')
            .addSelect({ nickname: getBuilder().from('two').select('baz').where('subkey', '=', 'subval') });
        expect(builder.toSql()).toBe(
            'select "users".*, (select "baz" from "two" where "subkey" = ?) as "nickname" from "users"'
        );

        builder = getBuilder();
        builder
            .addSelect({ nickname: getBuilder().from('two').select('baz').where('subkey', '=', 'subval') })
            .from('users');

        expect(builder.toSql()).toBe(
            'select "".*, (select "baz" from "two" where "subkey" = ?) as "nickname" from "users"'
        );
    });

    it('Works Basic Select With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('users');
        expect(builder.toSql()).toBe('select * from "prefix_users"');
    });

    it('Works Basic Select Distinct', () => {
        let builder = getBuilder();
        builder.distinct().select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');

        builder = getBuilder();
        builder.distinct(true).select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');

        builder = getBuilder();
        builder.distinct(true).distinct(false).select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select "foo", "bar" from "users"');
    });

    it('Works Basic Select Distinct On Columns', () => {
        let builder = getBuilder();
        builder.distinct('foo').select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
        builder = getPostgresBuilder();
        builder.distinct('foo').select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct on ("foo") "foo", "bar" from "users"');
    });

    it('Works Basic Alias', () => {
        const builder = getBuilder();
        builder.select('foo as bar').from('users');
        expect(builder.toSql()).toBe('select "foo" as "bar" from "users"');
    });

    it('Works Alias With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('users as people');
        expect(builder.toSql()).toBe('select * from "prefix_users" as "prefix_people"');
    });

    it('Works Join Aliases With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('services').join('translations AS t', 't.item_id', '=', 'services.id');
        expect(builder.toSql()).toBe(
            'select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"'
        );
    });

    it('Works Full Sub Selects', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('email', '=', 'foo')
            .orWhere('id', '=', query => {
                query.select(new Raw('max(id)')).from('users').where('email', '=', 'bar');
            });

        expect(
            'select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)'
        ).toBe(builder.toSql());
        expect(['foo', 'bar']).toEqual(builder.getBindings());
    });

    it('Works Raw Expressions In Select', () => {
        const builder = getBuilder();
        builder.select(new Raw('substr(foo, 6)')).from('users');
        expect('select substr(foo, 6) from "users"').toBe(builder.toSql());
    });

    it('Works MySqlLock', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock();
        expect('select * from `foo` where `bar` = ? for update').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock(false);
        expect('select * from `foo` where `bar` = ? lock in share mode').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock('lock in share mode');
        expect('select * from `foo` where `bar` = ? lock in share mode').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());
    });

    it('Works PostgresLock', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock();
        expect('select * from "foo" where "bar" = ? for update').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock(false);
        expect('select * from "foo" where "bar" = ? for share').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock('for key share');
        expect('select * from "foo" where "bar" = ? for key share').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());
    });

    it('Works SqlServerLock', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock();
        expect('select * from [foo] with(rowlock,updlock,holdlock) where [bar] = ?').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock(false);
        expect('select * from [foo] with(rowlock,holdlock) where [bar] = ?').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('*').from('foo').where('bar', '=', 'baz').lock('with(holdlock)');
        expect('select * from [foo] with(holdlock) where [bar] = ?').toBe(builder.toSql());
        expect(['baz']).toEqual(builder.getBindings());
    });

    it('Works SelectWithLockUsesWritePdo', async () => {
        let builder = getMySqlBuilderWithProcessor();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async (_a, _b, useReadPdo) => {
            expect(useReadPdo).toBeFalsy();
            return [];
        });
        await builder.select('*').from('foo').where('bar', '=', 'baz').lock().get();

        builder = getMySqlBuilderWithProcessor();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async (_a, _b, useReadPdo) => {
            expect(useReadPdo).toBeFalsy();
            return [];
        });
        await builder.select('*').from('foo').where('bar', '=', 'baz').lock(false).get();
    });

    it('Works Sub Select', () => {
        const expectedSql =
            'select "foo", "bar", (select "baz" from "two" where "subkey" = ?) as "sub" from "one" where "key" = ?';
        const expectedBindings = ['subval', 'val'];

        let builder = getPostgresBuilder();
        builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
        builder.selectSub(query => {
            query.from('two').select('baz').where('subkey', '=', 'subval');
        }, 'sub');
        expect(expectedSql).toBe(builder.toSql());
        expect(expectedBindings).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
        const subBuilder = getPostgresBuilder();
        subBuilder.from('two').select('baz').where('subkey', '=', 'subval');
        builder.selectSub(subBuilder, 'sub');
        expect(expectedSql).toBe(builder.toSql());
        expect(expectedBindings).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        expect(() => {
            // @ts-expect-error test wrong parameter
            builder.selectSub(['foo'], 'sub');
        }).toThrowError('A subquery must be a query builder instance, a Closure, or a string.');
    });

    it('Works Sub Select Cross Database', () => {
        const expectedSql =
            'select "foo", "bar", (select "baz" from "alternative"."two" where "subkey" = ?) as "sub" from "one" where "key" = ?';
        const expectedBindings = ['subval', 'val'];
        let builder = getBuilder();
        builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
        let subBuilder = getBuilderAlternative();
        subBuilder.from('two').select('baz').where('subkey', '=', 'subval');
        builder.selectSub(subBuilder, 'sub');
        expect(expectedSql).toBe(builder.toSql());
        expect(expectedBindings).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.from('one').select(['foo', 'bar']).where('key', '=', 'val');
        subBuilder = getBuilderAlternative();
        subBuilder.from('alternative.two').select('baz').where('subkey', '=', 'subval');
        builder.selectSub(subBuilder, 'sub');
        expect(expectedSql).toBe(builder.toSql());
        expect(expectedBindings).toEqual(builder.getBindings());
    });

    it('Works Sub Select Reset Bindings', () => {
        const builder = getPostgresBuilder();
        builder.from('one').selectSub(query => {
            query.from('two').select('baz').where('subkey', '=', 'subval');
        }, 'sub');

        expect('select (select "baz" from "two" where "subkey" = ?) as "sub" from "one"').toBe(builder.toSql());
        expect(['subval']).toEqual(builder.getBindings());

        builder.select('*');

        expect('select * from "one"').toBe(builder.toSql());
        expect([]).toEqual(builder.getBindings());
    });

    it('Works Table Valued Function As Table In SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users()');
        expect('select * from [users]()').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users(1,2)');
        expect('select * from [users](1,2)').toBe(builder.toSql());
    });

    it('Works From', () => {
        const builder = getBuilder();
        builder.from(getBuilder().from('users'), 'u');
        expect('select * from (select * from "users") as "u"').toBe(builder.toSql());
    });

    it('Works From Sub', () => {
        let builder = getBuilder();
        builder
            .fromSub(query => {
                query.select(new Raw('max(last_seen_at) as last_seen_at')).from('user_sessions').where('foo', '=', '1');
            }, 'sessions')
            .where('bar', '<', '10');
        expect(
            'select * from (select max(last_seen_at) as last_seen_at from "user_sessions" where "foo" = ?) as "sessions" where "bar" < ?'
        ).toBe(builder.toSql());
        expect(['1', '10']).toEqual(builder.getBindings());

        builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong parameter
            builder.fromSub(['invalid'], 'sessions').where('bar', '<', '10');
        }).toThrowError('A subquery must be a query builder instance, a Closure, or a string.');
    });

    it('Works From Sub With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder
            .fromSub(query => {
                query.select(new Raw('max(last_seen_at) as last_seen_at')).from('user_sessions').where('foo', '=', '1');
            }, 'sessions')
            .where('bar', '<', '10');
        expect(
            'select * from (select max(last_seen_at) as last_seen_at from "prefix_user_sessions" where "foo" = ?) as "prefix_sessions" where "bar" < ?'
        ).toBe(builder.toSql());
        expect(['1', '10']).toEqual(builder.getBindings());
    });

    it('Works From Sub Without Bindings', () => {
        let builder = getBuilder();
        builder.fromSub(query => {
            query.select(new Raw('max(last_seen_at) as last_seen_at')).from('user_sessions');
        }, 'sessions');
        expect('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"').toBe(
            builder.toSql()
        );

        builder = getBuilder();
        expect(() => {
            // @ts-expect-error test wrong parameter
            builder.fromSub(['invalid'], 'sessions');
        }).toThrowError('A subquery must be a query builder instance, a Closure, or a string.');
    });

    it('Works From Raw', () => {
        let builder = getBuilder();
        builder.fromRaw(new Raw('(select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"'));
        expect('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"').toBe(
            builder.toSql()
        );
        builder = getBuilder();
        builder.fromRaw('(select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"');
        expect('select * from (select max(last_seen_at) as last_seen_at from "user_sessions") as "sessions"').toBe(
            builder.toSql()
        );
    });

    it('Works From Raw On Sql Server', () => {
        const builder = getSqlServerBuilder();
        builder.fromRaw('dbo.[SomeNameWithRoundBrackets (test)]');
        expect('select * from dbo.[SomeNameWithRoundBrackets (test)]').toBe(builder.toSql());
    });

    it('Works From Raw With Where On The Main Query', () => {
        const builder = getBuilder();
        builder
            .fromRaw(new Raw('(select max(last_seen_at) as last_seen_at from "sessions") as "last_seen_at"'))
            .where('last_seen_at', '>', '1520652582');
        expect(
            'select * from (select max(last_seen_at) as last_seen_at from "sessions") as "last_seen_at" where "last_seen_at" > ?'
        ).toBe(builder.toSql());
        expect(['1520652582']).toEqual(builder.getBindings());
    });

    it('Works From Question Mark Operator On Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').where('roles', '?', 'superuser');
        expect('select * from "users" where "roles" ?? ?').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('roles', '?|', 'superuser');
        expect('select * from "users" where "roles" ??| ?').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('roles', '?&', 'superuser');
        expect('select * from "users" where "roles" ??& ?').toBe(builder.toSql());
    });

    it('Works Use Index Postgress', () => {
        const builder = getPostgresBuilder();
        expect(() => {
            builder.select('foo').from('users').useIndex('test_index').toSql();
        }).toThrowError('This database engine does not support index hints.');
    });

    it('Works Use Index MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('foo').from('users').useIndex('test_index');
        expect('select `foo` from `users` use index (test_index)').toBe(builder.toSql());
    });

    it('Works Force Index MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('foo').from('users').forceIndex('test_index');
        expect('select `foo` from `users` force index (test_index)').toBe(builder.toSql());
    });

    it('Works Ignore Index MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('foo').from('users').ignoreIndex('test_index');
        expect('select `foo` from `users` ignore index (test_index)').toBe(builder.toSql());
    });

    it('Works Use Index Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('foo').from('users').useIndex('test_index');
        expect('select "foo" from "users"').toBe(builder.toSql());
    });

    it('Works Force Index Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('foo').from('users').forceIndex('test_index');
        expect('select "foo" from "users" indexed by test_index').toBe(builder.toSql());
    });

    it('Works Ignore Index Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('foo').from('users').ignoreIndex('test_index');
        expect('select "foo" from "users"').toBe(builder.toSql());
    });

    it('Works Use Index SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('foo').from('users').useIndex('test_index');
        expect('select [foo] from [users]').toBe(builder.toSql());
    });

    it('Works Force Index SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('foo').from('users').forceIndex('test_index');
        expect('select [foo] from [users] with (index(test_index))').toBe(builder.toSql());
    });

    it('Works Ignore Index SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('foo').from('users').ignoreIndex('test_index');
        expect('select [foo] from [users]').toBe(builder.toSql());
    });
});
