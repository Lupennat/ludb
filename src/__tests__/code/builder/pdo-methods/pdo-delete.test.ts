import {
    getBuilder,
    getMysqlBuilder,
    getPostgresBuilder,
    getSqliteBuilder,
    getSqlserverBuilder,
    pdo
} from '../../fixtures/mocked';

describe('QueryBuilder Pdo Methods', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Delete Method', async () => {
        let builder = getBuilder();
        let spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);

        builder = getBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').delete(1)).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from "users" where "users"."id" = ?', [1]);

        builder = getBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').selectRaw('?', ['ignore']).delete(1)).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from "users" where "users"."id" = ?', [1]);

        builder = getSqliteBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);

        builder = getSqliteBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "rowid" in (select "users"."rowid" from "users" where "email" = ? order by "id" asc limit 1)',
            ['foo']
        );

        builder = getMysqlBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from `users` where `email` = ? order by `id` asc limit 1', [
            'foo'
        ]);

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from "users" where "email" = ?', ['foo']);

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "ctid" in (select "users"."ctid" from "users" where "email" = ? order by "id" asc limit 1)',
            ['foo']
        );

        builder = getSqlserverBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete from [users] where [email] = ?', ['foo']);

        builder = getSqlserverBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').where('email', '=', 'foo').orderBy('id').take(1).delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith('delete top (1) from [users] where [email] = ?', ['foo']);
    });

    it('Works Delete With Join Method', async () => {
        let builder = getSqliteBuilder();
        let spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users')
                .join('contacts', 'users.id', '=', 'contacts.id')
                .where('users.email', '=', 'foo')
                .orderBy('users.id')
                .limit(1)
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "rowid" in (select "users"."rowid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."email" = ? order by "users"."id" asc limit 1)',
            ['foo']
        );

        builder = getSqliteBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users as u').join('contacts as c', 'u.id', '=', 'c.id').delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" as "u" where "rowid" in (select "u"."rowid" from "users" as "u" inner join "contacts" as "c" on "u"."id" = "c"."id")',
            []
        );

        builder = getMysqlBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users')
                .join('contacts', 'users.id', '=', 'contacts.id')
                .where('email', '=', 'foo')
                .orderBy('id')
                .limit(1)
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete `users` from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` where `email` = ?',
            ['foo']
        );

        builder = getMysqlBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users AS a')
                .join('users AS b', 'a.id', '=', 'b.user_id')
                .where('email', '=', 'foo')
                .orderBy('id')
                .limit(1)
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete `a` from `users` as `a` inner join `users` as `b` on `a`.`id` = `b`.`user_id` where `email` = ?',
            ['foo']
        );

        builder = getMysqlBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').orderBy('id').take(1).delete(1)
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete `users` from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` where `users`.`id` = ?',
            [1]
        );

        builder = getSqlserverBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users')
                .join('contacts', 'users.id', '=', 'contacts.id')
                .where('email', '=', 'foo')
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete [users] from [users] inner join [contacts] on [users].[id] = [contacts].[id] where [email] = ?',
            ['foo']
        );

        builder = getSqlserverBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users AS a')
                .join('users AS b', 'a.id', '=', 'b.user_id')
                .where('email', '=', 'foo')
                .orderBy('id')
                .limit(1)
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete [a] from [users] as [a] inner join [users] as [b] on [a].[id] = [b].[user_id] where [email] = ?',
            ['foo']
        );

        builder = getSqlserverBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').delete(1)).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete [users] from [users] inner join [contacts] on [users].[id] = [contacts].[id] where [users].[id] = ?',
            [1]
        );

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users')
                .join('contacts', 'users.id', '=', 'contacts.id')
                .where('users.email', '=', 'foo')
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."email" = ?)',
            ['foo']
        );

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users AS a')
                .join('users AS b', 'a.id', '=', 'b.user_id')
                .where('email', '=', 'foo')
                .orderBy('id')
                .limit(1)
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" as "a" where "ctid" in (select "a"."ctid" from "users" as "a" inner join "users" as "b" on "a"."id" = "b"."user_id" where "email" = ? order by "id" asc limit 1)',
            ['foo']
        );

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').orderBy('id').take(1).delete(1)
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id" where "users"."id" = ? order by "id" asc limit 1)',
            [1]
        );

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(
            await builder
                .from('users')
                .join('contacts', join => {
                    join.on('users.id', '=', 'contacts.user_id').where('users.id', '=', 1);
                })
                .where('name', 'baz')
                .delete()
        ).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."user_id" and "users"."id" = ? where "name" = ?)',
            [1, 'baz']
        );

        builder = getPostgresBuilder();
        spiedDelete = jest.spyOn(builder.getConnection(), 'delete').mockImplementationOnce(async () => 1);
        expect(await builder.from('users').join('contacts', 'users.id', '=', 'contacts.id').delete()).toBe(1);
        expect(spiedDelete).toHaveBeenCalledWith(
            'delete from "users" where "ctid" in (select "users"."ctid" from "users" inner join "contacts" on "users"."id" = "contacts"."id")',
            []
        );
    });

    it('Works Truncate Method', async () => {
        let builder = getBuilder();
        let spiedTruncate = jest.spyOn(builder.getConnection(), 'statement');
        await builder.from('users').truncate();
        expect(spiedTruncate).toHaveBeenCalledWith('truncate table "users"', []);

        builder = getSqliteBuilder();
        spiedTruncate = jest.spyOn(builder.getConnection(), 'statement');
        await builder.from('users').truncate();
        expect(spiedTruncate).toHaveBeenNthCalledWith(1, 'delete from sqlite_sequence where name = ?', ['users']);
        expect(spiedTruncate).toHaveBeenNthCalledWith(2, 'delete from "users"', []);

        builder = getPostgresBuilder();
        spiedTruncate = jest.spyOn(builder.getConnection(), 'statement');
        await builder.from('users').truncate();
        expect(spiedTruncate).toHaveBeenCalledWith('truncate "users" restart identity cascade', []);
    });
});
