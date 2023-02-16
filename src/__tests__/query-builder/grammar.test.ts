import Raw from '../../query/expression';
import { stringifyReplacer } from '../../utils';
import {
    getBuilder,
    getMySqlBuilder,
    getPostgresBuilder,
    getSQLiteBuilder,
    getSqlServerBuilder,
    pdo
} from '../fixtures/mocked';

describe('Query Builder Select-From', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Basic Table Wrapping Protects Quotation Marks', () => {
        const builder = getBuilder();
        builder.select('*').from('some"table');
        expect(builder.toSql()).toBe('select * from "some""table"');
    });

    it('Works Alias Wrapping As Whole Constant', () => {
        const builder = getBuilder();
        builder.select('x.y as foo.bar').from('baz');
        expect(builder.toSql()).toBe('select "x"."y" as "foo.bar" from "baz"');
    });

    it('Works Alias Wrapping With Spaces In Database Name', () => {
        const builder = getBuilder();
        builder.select('w x.y.z as foo.bar').from('baz');
        expect(builder.toSql()).toBe('select "w x"."y"."z" as "foo.bar" from "baz"');
    });

    it('Works Basic Table Wrapping', () => {
        const builder = getBuilder();
        builder.select('*').from('public.users');
        expect(builder.toSql()).toBe('select * from "public"."users"');
    });

    it('Works Mysql Wrapping Protectets Quotation Marks', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('some`table');
        expect(builder.toSql()).toBe('select * from `some``table`');
    });

    it('Works MySql Wrapping', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users');
        expect('select * from `users`').toBe(builder.toSql());
    });

    it('Works MySql Update Wrapping Json', async () => {
        const builder = getMySqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': 'John', 'name->last_name': 'Doe' });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update `users` set `name` = json_set(`name`, \'$."first_name"\', ?), `name` = json_set(`name`, \'$."last_name"\', ?) where `active` = ?',
            ['John', 'Doe', 1]
        );
    });

    it('Works MySql Update Wrapping Nested Json', async () => {
        const builder = getMySqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'meta->name->first_name': 'John', 'meta->name->last_name': 'Doe' });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update `users` set `meta` = json_set(`meta`, \'$."name"."first_name"\', ?), `meta` = json_set(`meta`, \'$."name"."last_name"\', ?) where `active` = ?',
            ['John', 'Doe', 1]
        );
    });

    it('Works MySql Update Wrapping Json Array', async () => {
        const builder = getMySqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        const date = new Date('2019-08-06');
        await builder
            .from('users')
            .where('active', 1)
            .update({
                options: { '2fa': false, presets: ['laravel', 'vue'] },
                'meta->tags': ['white', 'large'],
                'options->language': 'english',
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update `users` set `options` = ?, `meta` = json_set(`meta`, \'$."tags"\', cast(? as json)), `options` = json_set(`options`, \'$."language"\', ?), `group_id` = 45, `created_at` = ? where `active` = ?',
            [
                JSON.stringify({ '2fa': false, presets: ['laravel', 'vue'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(['white', 'large'], stringifyReplacer(builder.getGrammar())),
                'english',
                date,
                1
            ]
        );
    });

    it('Works MySql Update Wrapping Json Path Array Index', async () => {
        const builder = getMySqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        await builder.from('users').where('active', 1).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });

        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update `users` set `options` = json_set(`options`, \'$[1]."2fa"\', false), `meta` = json_set(`meta`, \'$."tags"[0][2]\', ?) where `active` = ?',
            ['large', 1]
        );
    });

    it('Works MySql Update With Json Prepares Bindings Correctly', async () => {
        let builder = getMySqlBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        await builder
            .from('users')
            .where('id', '=', 0)
            .update({ 'options->enable': false, updated_at: '2015-05-26 22:02:06' });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update `users` set `options` = json_set(`options`, \'$."enable"\', false), `updated_at` = ? where `id` = ?',
            ['2015-05-26 22:02:06', 0]
        );

        builder = getMySqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        await builder
            .from('users')
            .where('id', '=', 0)
            .update({ 'options->size': 45, updated_at: '2015-05-26 22:02:06' });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update `users` set `options` = json_set(`options`, \'$."size"\', ?), `updated_at` = ? where `id` = ?',
            [45, '2015-05-26 22:02:06', 0]
        );

        builder = getMySqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        await builder.from('users').update({ 'options->size': null });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith('update `users` set `options` = json_set(`options`, \'$."size"\', ?)', [
            null
        ]);

        builder = getMySqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        await builder.from('users').update({ 'options->size': new Raw('45') });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith('update `users` set `options` = json_set(`options`, \'$."size"\', 45)', []);
    });

    it('Works Postgres Update Wrapping Json', async () => {
        let builder = getPostgresBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        await builder.from('users').update({ 'users.options->name->first_name': 'John' });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "options" = jsonb_set("options"::jsonb, \'{"name","first_name"}\', ?)',
            ['"John"']
        );

        builder = getPostgresBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        await builder.from('users').update({ 'options->language': new Raw("'null'") });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "options" = jsonb_set("options"::jsonb, \'{"language"}\', \'null\')',
            []
        );
    });

    it('Works Postgres Update Wrapping Json Array', async () => {
        const builder = getPostgresBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        const date = new Date('2019-08-06');

        await builder.from('users').update({
            options: { '2fa': false, presets: ['laravel', 'vue'] },
            'meta->tags': ['white', 'large'],
            'options->language': 'english',
            group_id: new Raw('45'),
            created_at: date
        });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "options" = ?, "meta" = jsonb_set("meta"::jsonb, \'{"tags"}\', ?), "options" = jsonb_set("options"::jsonb, \'{"language"}\', ?), "group_id" = 45, "created_at" = ?',
            [
                JSON.stringify({ '2fa': false, presets: ['laravel', 'vue'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(['white', 'large'], stringifyReplacer(builder.getGrammar())),
                '"english"',
                date
            ]
        );
    });

    it('Works Postgres Update Wrapping Json Path Array Index', async () => {
        const builder = getPostgresBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        await builder.from('users').where('options->[1]->2fa', true).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "options" = jsonb_set("options"::jsonb, \'{1,"2fa"}\', ?), "meta" = jsonb_set("meta"::jsonb, \'{"tags",0,2}\', ?) where ("options"->1->\'2fa\')::jsonb = \'true\'::jsonb',
            ['false', '"large"']
        );
    });

    it('Works SQLite Update Wrapping Json Array', async () => {
        const builder = getSQLiteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        const date = new Date('2019-08-06');

        await builder.from('users').update({
            options: { '2fa': false, presets: ['laravel', 'vue'] },
            'meta->tags': ['white', 'large'],
            'options->language': 'english',
            group_id: new Raw('45'),
            created_at: date
        });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "group_id" = 45, "created_at" = ?, "meta" = json_patch(ifnull("meta", json(\'{}\')), json(?)), "options" = json_patch(ifnull("options", json(\'{}\')), json(?))',
            [
                date,
                JSON.stringify({ tags: ['white', 'large'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(
                    { language: 'english', '2fa': false, presets: ['laravel', 'vue'] },
                    stringifyReplacer(builder.getGrammar())
                )
            ]
        );
    });

    it('Works SQLite Update Wrapping Nested Json Array', async () => {
        const builder = getSQLiteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');
        const date = new Date('2019-08-06');

        await builder.from('users').update({
            'options->name': 'Lupennat',
            group_id: new Raw('45'),
            'options->security': { '2fa': false, presets: ['laravel', 'vue'] },
            'options->sharing->twitter': 'username',
            created_at: date
        });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "group_id" = 45, "created_at" = ?, "options" = json_patch(ifnull("options", json(\'{}\')), json(?))',
            [
                date,
                JSON.stringify(
                    {
                        name: 'Lupennat',
                        security: { '2fa': false, presets: ['laravel', 'vue'] },
                        sharing: { twitter: 'username' }
                    },
                    stringifyReplacer(builder.getGrammar())
                )
            ]
        );
    });

    it('Works SQLite Update Wrapping Json Path Array Index', async () => {
        const builder = getSQLiteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update');

        await builder.from('users').where('options->[1]->2fa', true).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });
        expect(spiedUpdate).toBeCalledTimes(1);
        expect(spiedUpdate).toBeCalledWith(
            'update "users" set "options" = json_patch(ifnull("options", json(\'{}\')), json(?)), "meta" = json_patch(ifnull("meta", json(\'{}\')), json(?)) where json_extract("options", \'$[1]."2fa"\') = true',
            ['{"[1]":{"2fa":false}}', '{"tags[0][2]":"large"}']
        );
    });

    it('Works MySql Wrapping Json With String', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').where('items->sku', '=', 'foo-bar');
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."sku"\')) = ?').toBe(
            builder.toSql()
        );
        expect(1).toBe(builder.getRawBindings().where.length);
        expect('foo-bar').toBe(builder.getRawBindings().where[0]);
    });

    it('Works MySql Wrapping Json With Integer', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').where('items->price', '=', 1);
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?').toBe(
            builder.toSql()
        );
    });

    it('Works MySql Wrapping Json With Double', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').where('items->price', '=', 1.5);
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?').toBe(
            builder.toSql()
        );
    });

    it('Works MySql Wrapping Json With Boolean', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect('select * from `users` where json_extract(`items`, \'$."available"\') = true').toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where(new Raw("items->'$.available'"), '=', true);
        expect("select * from `users` where items->'$.available' = true").toBe(builder.toSql());
    });

    it('Works MySql Wrapping Json With Boolean And Integer That Looks Like One', () => {
        const builder = getMySqlBuilder();
        builder
            .select('*')
            .from('users')
            .where('items->available', '=', true)
            .where('items->active', '=', false)
            .where('items->number_available', '=', 0);

        expect(
            'select * from `users` where json_extract(`items`, \'$."available"\') = true and json_extract(`items`, \'$."active"\') = false and json_unquote(json_extract(`items`, \'$."number_available"\')) = ?'
        ).toBe(builder.toSql());
    });

    it('Works Json Path Escaping', () => {
        const expectedWithJsonEscaped = "select json_unquote(json_extract(`json`, '$.\"''))#\"'))";

        let builder = getMySqlBuilder();
        builder.select("json->'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());

        builder = getMySqlBuilder();
        // prettier-ignore
        builder.select("json->\'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select("json->\\'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());

        builder = getMySqlBuilder();
        // prettier-ignore
        builder.select("json->\\\'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());
    });

    it('Works MySql Wrapping Json', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereRaw('items->\'$."price"\' = 1');
        expect('select * from `users` where items->\'$."price"\' = 1').toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select json_unquote(json_extract(`items`, \'$."price"\')) from `users` where json_unquote(json_extract(`users`.`items`, \'$."price"\')) = ? order by json_unquote(json_extract(`items`, \'$."price"\')) asc'
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ?').toBe(
            builder.toSql()
        );

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ? and json_unquote(json_extract(`items`, \'$."age"\')) = ?'
        ).toBe(builder.toSql());
    });

    it('Works Postgres Wrapping Json', () => {
        let builder = getPostgresBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select "items"->>\'price\' from "users" where "users"."items"->>\'price\' = ? order by "items"->>\'price\' asc'
        ).toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from "users" where "items"->\'price\'->>\'in_usd\' = ?').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
        expect('select * from "users" where "items"->\'price\'->>\'in_usd\' = ? and "items"->>\'age\' = ?').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('items->prices->0', '=', 1).where('items->age', '=', 2);
        expect('select * from "users" where "items"->\'prices\'->>0 = ? and "items"->>\'age\' = ?').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect('select * from "users" where ("items"->\'available\')::jsonb = \'true\'::jsonb').toBe(builder.toSql());
    });

    it('Works SqlServer Wrapping Json', () => {
        let builder = getSqlServerBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select json_value([items], \'$."price"\') from [users] where json_value([users].[items], \'$."price"\') = ? order by json_value([items], \'$."price"\') asc'
        ).toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from [users] where json_value([items], \'$."price"."in_usd"\') = ?').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from [users] where json_value([items], \'$."price"."in_usd"\') = ? and json_value([items], \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('items->prices->0', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from [users] where json_value([items], \'$."prices"."0"\') = ? and json_value([items], \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect("select * from [users] where json_value([items], '$.\"available\"') = 'true'").toBe(builder.toSql());
    });

    it('Works SQLite Wrapping Json', () => {
        let builder = getSQLiteBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select json_extract("items", \'$."price"\') from "users" where json_extract("users"."items", \'$."price"\') = ? order by json_extract("items", \'$."price"\') asc'
        ).toBe(builder.toSql());

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ?').toBe(builder.toSql());

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ? and json_extract("items", \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('items->prices->0', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from "users" where json_extract("items", \'$."prices"."0"\') = ? and json_extract("items", \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect('select * from "users" where json_extract("items", \'$."available"\') = true').toBe(builder.toSql());
    });

    it('Works MySql Sounds Like Operator', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').where('name', 'sounds like', 'John Doe');
        expect('select * from `users` where `name` sounds like ?').toBe(builder.toSql());
        expect(['John Doe']).toEqual(builder.getBindings());
    });

    it('Works Bitwise Operators', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('bar', '&', 1);
        expect('select * from "users" where "bar" & ?').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('bar', '#', 1);
        expect('select * from "users" where ("bar" # ?)::bool').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('range', '>>', '[2022-01-08 00:00:00,2022-01-09 00:00:00)');
        expect('select * from "users" where ("range" >> ?)::bool').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('bar', '&', 1);
        expect('select * from [users] where ([bar] & ?) != 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').having('bar', '&', 1);
        expect('select * from "users" having "bar" & ?').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').having('bar', '#', 1);
        expect('select * from "users" having ("bar" # ?)::bool').toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').having('range', '>>', '[2022-01-08 00:00:00,2022-01-09 00:00:00)');
        expect('select * from "users" having ("range" >> ?)::bool').toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').having('bar', '&', 1);
        expect('select * from [users] having ([bar] & ?) != 0').toBe(builder.toSql());
    });

    it('Works Uppercase Leading Booleans Are Removed', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('name', '=', 'Taylor', 'AND');
        expect('select * from "users" where "name" = ?').toBe(builder.toSql());
        builder = getBuilder();
        builder.select('*').from('users').where('name', '=', 'Taylor', 'OR');
        expect('select * from "users" where "name" = ?').toBe(builder.toSql());
    });

    it('Works Lowercase Leading Booleans Are Removed', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('name', '=', 'Taylor', 'and');
        expect('select * from "users" where "name" = ?').toBe(builder.toSql());
        builder = getBuilder();
        builder.select('*').from('users').where('name', '=', 'Taylor', 'or');
        expect('select * from "users" where "name" = ?').toBe(builder.toSql());
    });

    it('Works Case Insensitive Leading Booleans Are Removed', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('name', '=', 'Taylor', 'And');
        expect('select * from "users" where "name" = ?').toBe(builder.toSql());
        builder = getBuilder();
        builder.select('*').from('users').where('name', '=', 'Taylor', 'Or');
        expect('select * from "users" where "name" = ?').toBe(builder.toSql());
    });
});
