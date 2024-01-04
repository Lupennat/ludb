import Raw from '../../../query/expression';
import { stringifyReplacer } from '../../../utils';
import {
    getBuilder,
    getMysqlBuilder,
    getPostgresBuilder,
    getSqliteBuilder,
    getSqlserverBuilder
} from '../fixtures/mocked';

describe('QueryBuilder Select-From', () => {
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
        const builder = getMysqlBuilder();
        builder.select('*').from('some`table');
        expect(builder.toSql()).toBe('select * from `some``table`');
    });

    it('Works Mysql Wrapping', () => {
        const builder = getMysqlBuilder();
        builder.select('*').from('users');
        expect('select * from `users`').toBe(builder.toSql());
    });

    it('Works Mysql Can Combine Json On Update', async () => {
        const builder = getMysqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        const date = new Date('2019-08-06');

        builder
            .from('users')
            .where('active', 1)
            .update({
                'users.meta': { enabled: false },
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                options: { '2fa': true },
                'json->test': new Raw(30),
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `meta` = ?, `options` = ?, `group_id` = 45, `created_at` = ?, `json` = json_set(`json`, \'$."test"\', 30) where `active` = ?',
            [
                JSON.stringify({ enabled: false, tags: ['white', 'large'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(
                    { '2fa': true, language: { name: 'english', code: 'en' } },
                    stringifyReplacer(builder.getGrammar())
                ),
                date,
                1
            ]
        );
    });

    it('Works Mysql Update Wrapping Json', async () => {
        let builder = getMysqlBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': 'John', 'name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `name` = json_set(json_set(`name`, \'$."first_name"\', ?), \'$."last_name"\', ?) where `active` = ?',
            ['John', 'Doe', 1]
        );

        builder = getMysqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': true, 'name->last_name': false });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `name` = json_set(json_set(`name`, \'$."first_name"\', true), \'$."last_name"\', false) where `active` = ?',
            [1]
        );
    });

    it('Works Mysql Update Wrapping Nested Json', async () => {
        const builder = getMysqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'meta->name->first_name': 'John', 'meta->name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `meta` = json_set(json_set(`meta`, \'$."name"."first_name"\', ?), \'$."name"."last_name"\', ?) where `active` = ?',
            ['John', 'Doe', 1]
        );
    });

    it('Works Mysql Update Wrapping Json Array', async () => {
        const builder = getMysqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        const date = new Date('2019-08-06');
        await builder
            .from('users')
            .where('active', 1)
            .update({
                'options->2fa': false,
                'options->presets': ['laravel', 'vue'],
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            "update `users` set `group_id` = 45, `created_at` = ?, `options` = json_set(json_set(json_set(`options`, '$.\"2fa\"', false), '$.\"presets\"', json_merge_patch('[]', ?)), '$.\"language\"', json_merge_patch('{}', ?)), `meta` = json_set(`meta`, '$.\"tags\"', json_merge_patch('[]', ?)) where `active` = ?",
            [
                date,
                JSON.stringify(['laravel', 'vue'], stringifyReplacer(builder.getGrammar())),
                JSON.stringify({ name: 'english', code: 'en' }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(['white', 'large'], stringifyReplacer(builder.getGrammar())),
                1
            ]
        );
    });

    it('Works Mysql Update Wrapping Json Path Array Index', async () => {
        const builder = getMysqlBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').where('active', 1).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `options` = json_set(`options`, \'$[1]."2fa"\', false), `meta` = json_set(`meta`, \'$."tags"[0][2]\', ?) where `active` = ?',
            ['large', 1]
        );
    });

    it('Works Mysql Update With Json Prepares Bindings Correctly', async () => {
        let builder = getMysqlBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder
            .from('users')
            .where('id', '=', 0)
            .update({ 'options->enable': false, updated_at: '2015-05-26 22:02:06' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `updated_at` = ?, `options` = json_set(`options`, \'$."enable"\', false) where `id` = ?',
            ['2015-05-26 22:02:06', 0]
        );

        builder = getMysqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder
            .from('users')
            .where('id', '=', 0)
            .update({ 'options->size': 45, updated_at: '2015-05-26 22:02:06' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `updated_at` = ?, `options` = json_set(`options`, \'$."size"\', ?) where `id` = ?',
            ['2015-05-26 22:02:06', 45, 0]
        );

        builder = getMysqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').update({ 'options->size': null });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `options` = json_set(`options`, \'$."size"\', ?)',
            [null]
        );

        builder = getMysqlBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').update({ 'options->size': new Raw('45') });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update `users` set `options` = json_set(`options`, \'$."size"\', 45)',
            []
        );
    });

    it('Works Prepares Bindings For Update From', () => {
        const builder = getBuilder();
        expect(() => {
            builder.getGrammar().prepareBindingsForUpdateFrom(builder, builder.getRegistry().bindings, {});
        }).toThrow('This database engine does not support the updateFrom method.');
    });

    it('Works Postgres Can Combine Json On Update', async () => {
        const builder = getPostgresBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        const date = new Date('2019-08-06');

        builder
            .from('users')
            .where('active', 1)
            .update({
                'users.meta': { enabled: false },
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                options: { '2fa': true },
                'json->test': new Raw(30),
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "meta" = ?, "options" = ?, "group_id" = 45, "created_at" = ?, "json" = jsonb_set("json"::jsonb, \'{"test"}\', \'30\') where "active" = ?',
            [
                JSON.stringify({ enabled: false, tags: ['white', 'large'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(
                    { '2fa': true, language: { name: 'english', code: 'en' } },
                    stringifyReplacer(builder.getGrammar())
                ),
                date,
                1
            ]
        );
    });

    it('Works Postgres Update Wrapping Json', async () => {
        let builder = getPostgresBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': 'John', 'name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "name" = jsonb_set(jsonb_set("name"::jsonb, \'{"first_name"}\', ?::jsonb), \'{"last_name"}\', ?::jsonb) where "active" = ?',
            ['"John"', '"Doe"', 1]
        );

        builder = getPostgresBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': true, 'name->last_name': false });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "name" = jsonb_set(jsonb_set("name"::jsonb, \'{"first_name"}\', ?::jsonb), \'{"last_name"}\', ?::jsonb) where "active" = ?',
            ['true', 'false', 1]
        );
    });

    it('Works Postgres Update Wrapping Nested Json', async () => {
        const builder = getPostgresBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'meta->name->first_name': 'John', 'meta->name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "meta" = jsonb_set(jsonb_set("meta"::jsonb, \'{"name","first_name"}\', ?::jsonb), \'{"name","last_name"}\', ?::jsonb) where "active" = ?',
            ['"John"', '"Doe"', 1]
        );
    });

    it('Works Postgres Update Wrapping Json Array', async () => {
        const builder = getPostgresBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        const date = new Date('2019-08-06');
        await builder
            .from('users')
            .where('active', 1)
            .update({
                list: [1, 2, 3, 4, 5, 6],
                'options->counter': BigInt('100'),
                'options->2fa': false,
                'options->presets': ['laravel', 'vue'],
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "list" = ?, "group_id" = 45, "created_at" = ?, "options" = jsonb_set(jsonb_set(jsonb_set(jsonb_set("options"::jsonb, \'{"counter"}\', ?::jsonb), \'{"2fa"}\', ?::jsonb), \'{"presets"}\', ?::jsonb), \'{"language"}\', ?::jsonb), "meta" = jsonb_set("meta"::jsonb, \'{"tags"}\', ?::jsonb) where "active" = ?',
            [
                JSON.stringify([1, 2, 3, 4, 5, 6]),
                date,
                '100',
                'false',
                JSON.stringify(['laravel', 'vue'], stringifyReplacer(builder.getGrammar())),
                JSON.stringify({ name: 'english', code: 'en' }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(['white', 'large'], stringifyReplacer(builder.getGrammar())),
                1
            ]
        );
    });

    it('Works Postgres Update Wrapping Json Path Array Index', async () => {
        const builder = getPostgresBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').where('active', 1).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "options" = jsonb_set("options"::jsonb, \'{1,"2fa"}\', ?::jsonb), "meta" = jsonb_set("meta"::jsonb, \'{"tags",0,2}\', ?::jsonb) where "active" = ?',
            ['false', '"large"', 1]
        );
    });

    it('Works Sqlite Can Combine Json On Update', async () => {
        const builder = getSqliteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        const date = new Date('2019-08-06');

        builder
            .from('users')
            .where('active', 1)
            .update({
                'users.meta': { enabled: false },
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                options: { '2fa': true },
                'json->test': new Raw(30),
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "meta" = ?, "options" = ?, "group_id" = 45, "created_at" = ?, "json" = json_set("json", \'$."test"\', 30) where "active" = ?',
            [
                JSON.stringify({ enabled: false, tags: ['white', 'large'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(
                    { '2fa': true, language: { name: 'english', code: 'en' } },
                    stringifyReplacer(builder.getGrammar())
                ),
                date,
                1
            ]
        );
    });

    it('Works Sqlite Update Wrapping Json', async () => {
        let builder = getSqliteBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': 'John', 'name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "name" = json_set(json_set("name", \'$."first_name"\', ?), \'$."last_name"\', ?) where "active" = ?',
            ['John', 'Doe', 1]
        );

        builder = getSqliteBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': true, 'name->last_name': false });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "name" = json_set(json_set("name", \'$."first_name"\', json(\'true\')), \'$."last_name"\', json(\'false\')) where "active" = ?',
            [1]
        );
    });

    it('Works Sqlite Update Wrapping Nested Json', async () => {
        const builder = getSqliteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'meta->name->first_name': 'John', 'meta->name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "meta" = json_set(json_set("meta", \'$."name"."first_name"\', ?), \'$."name"."last_name"\', ?) where "active" = ?',
            ['John', 'Doe', 1]
        );
    });

    it('Works Sqlite Update Wrapping Json Array', async () => {
        const builder = getSqliteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        const date = new Date('2019-08-06');
        await builder
            .from('users')
            .where('active', 1)
            .update({
                list: [1, 2, 3, 4, 5, 6],
                'options->2fa': false,
                'options->presets': ['laravel', 'vue'],
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "list" = ?, "group_id" = 45, "created_at" = ?, "options" = json_set(json_set(json_set("options", \'$."2fa"\', json(\'false\')), \'$."presets"\', json(?)), \'$."language"\', json(?)), "meta" = json_set("meta", \'$."tags"\', json(?)) where "active" = ?',
            [
                JSON.stringify([1, 2, 3, 4, 5, 6], stringifyReplacer(builder.getGrammar())),
                date,
                JSON.stringify(['laravel', 'vue'], stringifyReplacer(builder.getGrammar())),
                JSON.stringify({ name: 'english', code: 'en' }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(['white', 'large'], stringifyReplacer(builder.getGrammar())),
                1
            ]
        );
    });

    it('Works Sqlite Update Wrapping Json Path Array Index', async () => {
        const builder = getSqliteBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').where('active', 1).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update "users" set "options" = json_set("options", \'$[1]."2fa"\', json(\'false\')), "meta" = json_set("meta", \'$."tags"[0][2]\', ?) where "active" = ?',
            ['large', 1]
        );
    });

    it('Works Sqlserver Can Combine Json On Update', async () => {
        const builder = getSqlserverBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        const date = new Date('2019-08-06');

        builder
            .from('users')
            .where('active', 1)
            .update({
                'users.meta': { enabled: false },
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                options: { '2fa': true },
                'json->test': new Raw(30),
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update [users] set [meta] = ?, [options] = ?, [group_id] = 45, [created_at] = ?, [json] = json_query(json_modify([json], \'$."test"\', 30)) where [active] = ?',
            [
                JSON.stringify({ enabled: false, tags: ['white', 'large'] }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(
                    { '2fa': true, language: { name: 'english', code: 'en' } },
                    stringifyReplacer(builder.getGrammar())
                ),
                date,
                1
            ]
        );
    });

    it('Works Sqlserver Update Wrapping Json', async () => {
        let builder = getSqlserverBuilder();
        let spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': 'John', 'name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update [users] set [name] = json_query(json_modify(json_query(json_modify([name], \'$."first_name"\', ?)), \'$."last_name"\', ?)) where [active] = ?',
            ['John', 'Doe', 1]
        );

        builder = getSqlserverBuilder();
        spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'name->first_name': true, 'name->last_name': false });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update [users] set [name] = json_query(json_modify(json_query(json_modify([name], \'$."first_name"\', ?)), \'$."last_name"\', ?)) where [active] = ?',
            [true, false, 1]
        );
    });

    it('Works Sqlserver Update Wrapping Nested Json', async () => {
        const builder = getSqlserverBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();
        await builder
            .from('users')
            .where('active', '=', 1)
            .update({ 'meta->name->first_name': 'John', 'meta->name->last_name': 'Doe' });
        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update [users] set [meta] = json_query(json_modify(json_query(json_modify([meta], \'$."name"."first_name"\', ?)), \'$."name"."last_name"\', ?)) where [active] = ?',
            ['John', 'Doe', 1]
        );
    });

    it('Works Sqlserver Update Wrapping Json Array', async () => {
        const builder = getSqlserverBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        const date = new Date('2019-08-06');
        await builder
            .from('users')
            .where('active', 1)
            .update({
                list: [1, 2, 3, 4, 5, 6],
                'options->2fa': false,
                'options->presets': ['laravel', 'vue'],
                'meta->tags': ['white', 'large'],
                'options->language': { name: 'english', code: 'en' },
                group_id: new Raw('45'),
                created_at: date
            });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update [users] set [list] = ?, [group_id] = 45, [created_at] = ?, [options] = json_query(json_modify(json_query(json_modify(json_query(json_modify([options], \'$."2fa"\', ?)), \'$."presets"\', json_query(?))), \'$."language"\', json_query(?))), [meta] = json_query(json_modify([meta], \'$."tags"\', json_query(?))) where [active] = ?',
            [
                JSON.stringify([1, 2, 3, 4, 5, 6], stringifyReplacer(builder.getGrammar())),
                date,
                false,
                JSON.stringify(['laravel', 'vue'], stringifyReplacer(builder.getGrammar())),
                JSON.stringify({ name: 'english', code: 'en' }, stringifyReplacer(builder.getGrammar())),
                JSON.stringify(['white', 'large'], stringifyReplacer(builder.getGrammar())),
                1
            ]
        );
    });

    it('Works Sqlserver Update Wrapping Json Path Array Index', async () => {
        const builder = getSqlserverBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').where('active', 1).update({
            'options->[1]->2fa': false,
            'meta->tags[0][2]': 'large'
        });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            'update [users] set [options] = json_query(json_modify([options], \'$[1]."2fa"\', ?)), [meta] = json_query(json_modify([meta], case when (select count(*) from openjson([meta], \'$."tags"[0]\')) >= 3 then \'$."tags"[0][2]\' else \'append $."tags"[0]\' end, ?)) where [active] = ?',
            [false, 'large', 1]
        );
    });

    it('Works Sqlserver Update Json With Nullable', async () => {
        const builder = getSqlserverBuilder();
        const spiedUpdate = jest.spyOn(builder.getConnection(), 'update').mockImplementation();

        await builder.from('users').where('active', 1).update({
            'options->[1]': null,
            'options->[2]': '2'
        });

        expect(spiedUpdate).toHaveBeenCalledTimes(1);
        expect(spiedUpdate).toHaveBeenCalledWith(
            "update [users] set [options] = json_query(json_modify(json_query(json_modify(json_query(json_modify([options], case when (select count(*) from openjson([options], '$')) >= 2 then '$[1]' else 'append $' end, '')), 'strict $[1]', ?)), case when (select count(*) from openjson([options], '$')) >= 3 then '$[2]' else 'append $' end, ?)) where [active] = ?",
            [null, '2', 1]
        );
    });

    it('Works Mysql Wrapping Json With String', () => {
        const builder = getMysqlBuilder();
        builder.select('*').from('users').where('items->sku', '=', 'foo-bar');
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."sku"\')) = ?').toBe(
            builder.toSql()
        );
        expect(1).toBe(builder.getRawBindings().where.length);
        expect('foo-bar').toBe(builder.getRawBindings().where[0]);
    });

    it('Works Mysql Wrapping Json With Integer', () => {
        const builder = getMysqlBuilder();
        builder.select('*').from('users').where('items->price', '=', 1);
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?').toBe(
            builder.toSql()
        );
    });

    it('Works Mysql Wrapping Json With Double', () => {
        const builder = getMysqlBuilder();
        builder.select('*').from('users').where('items->price', '=', 1.5);
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"\')) = ?').toBe(
            builder.toSql()
        );
    });

    it('Works Mysql Wrapping Json With Boolean', () => {
        let builder = getMysqlBuilder();
        builder.select('*').from('users').whereNot('items->available', '=', true);
        expect('select * from `users` where not json_extract(`items`, \'$."available"\') = true').toBe(builder.toSql());

        builder = getMysqlBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect('select * from `users` where json_extract(`items`, \'$."available"\') = true').toBe(builder.toSql());

        builder = getMysqlBuilder();
        builder.select('*').from('users').where(new Raw("items->'$.available'"), '=', true);
        expect("select * from `users` where items->'$.available' = true").toBe(builder.toSql());
    });

    it('Works Aggrate', () => {
        let builder = getBuilder();
        builder.select('*').from('users').distinct().setAggregate('count', ['id']);
        expect('select count(distinct "id") as aggregate from "users"').toBe(builder.toSql());
        builder = getBuilder();
        builder.select('*').from('users').distinct('id', 'name').setAggregate('count', ['id']);
        expect('select count(distinct "id", "name") as aggregate from "users"').toBe(builder.toSql());
    });

    it('Works Mysql Wrapping Json With Boolean And Integer That Looks Like One', () => {
        const builder = getMysqlBuilder();
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

        let builder = getMysqlBuilder();
        builder.select("json->'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());

        builder = getMysqlBuilder();
        // prettier-ignore
        builder.select("json->\'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());

        builder = getMysqlBuilder();
        builder.select("json->\\'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());

        builder = getMysqlBuilder();
        // prettier-ignore
        builder.select("json->\\\'))#");
        expect(expectedWithJsonEscaped).toBe(builder.toSql());
    });

    it('Works Mysql Wrapping Json', () => {
        let builder = getMysqlBuilder();
        builder.select('*').from('users').whereRaw('items->\'$."price"\' = 1');
        expect('select * from `users` where items->\'$."price"\' = 1').toBe(builder.toSql());

        builder = getMysqlBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select json_unquote(json_extract(`items`, \'$."price"\')) from `users` where json_unquote(json_extract(`users`.`items`, \'$."price"\')) = ? order by json_unquote(json_extract(`items`, \'$."price"\')) asc'
        ).toBe(builder.toSql());

        builder = getMysqlBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from `users` where json_unquote(json_extract(`items`, \'$."price"."in_usd"\')) = ?').toBe(
            builder.toSql()
        );

        builder = getMysqlBuilder();
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

    it('Works Sqlserver Columns', () => {
        let builder = getSqlserverBuilder();
        expect(builder.from('users').select('name').setAggregate('count', ['*']).toSql()).toBe(
            'select count(*) as aggregate from [users]'
        );

        builder = getSqlserverBuilder();
        expect(builder.from('users').select('name').distinct().toSql()).toBe('select distinct [name] from [users]');
    });

    it('Works Postgress Columns', () => {
        let builder = getPostgresBuilder();
        expect(builder.from('users').select('name').setAggregate('count', ['*']).toSql()).toBe(
            'select count(*) as aggregate from "users"'
        );

        builder = getPostgresBuilder();
        expect(builder.from('users').select('name').distinct().toSql()).toBe('select distinct "name" from "users"');
    });

    it('Works Sqlserver Save Points', () => {
        const builder = getSqlserverBuilder();
        expect(builder.getGrammar().compileSavepoint('trans1')).toBe('SAVE TRANSACTION trans1');
        expect(builder.getGrammar().compileSavepointRollBack('trans1')).toBe('ROLLBACK TRANSACTION trans1');
    });

    it('Works Sqlserver Wrapping Json', () => {
        let builder = getSqlserverBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select json_value([items], \'$."price"\') from [users] where json_value([users].[items], \'$."price"\') = ? order by json_value([items], \'$."price"\') asc'
        ).toBe(builder.toSql());

        builder = getSqlserverBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from [users] where json_value([items], \'$."price"."in_usd"\') = ?').toBe(builder.toSql());

        builder = getSqlserverBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from [users] where json_value([items], \'$."price"."in_usd"\') = ? and json_value([items], \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSqlserverBuilder();
        builder.select('*').from('users').where('items->prices->0', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from [users] where json_value([items], \'$."prices"."0"\') = ? and json_value([items], \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSqlserverBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect("select * from [users] where json_value([items], '$.\"available\"') = 'true'").toBe(builder.toSql());
    });

    it('Works Sqlite Wrapping Json', () => {
        let builder = getSqliteBuilder();
        builder.select('items->price').from('users').where('users.items->price', '=', 1).orderBy('items->price');
        expect(
            'select json_extract("items", \'$."price"\') from "users" where json_extract("users"."items", \'$."price"\') = ? order by json_extract("items", \'$."price"\') asc'
        ).toBe(builder.toSql());

        builder = getSqliteBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1);
        expect('select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ?').toBe(builder.toSql());

        builder = getSqliteBuilder();
        builder.select('*').from('users').where('items->price->in_usd', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from "users" where json_extract("items", \'$."price"."in_usd"\') = ? and json_extract("items", \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSqliteBuilder();
        builder.select('*').from('users').where('items->prices->0', '=', 1).where('items->age', '=', 2);
        expect(
            'select * from "users" where json_extract("items", \'$."prices"."0"\') = ? and json_extract("items", \'$."age"\') = ?'
        ).toBe(builder.toSql());

        builder = getSqliteBuilder();
        builder.select('*').from('users').where('items->available', '=', true);
        expect('select * from "users" where json_extract("items", \'$."available"\') = true').toBe(builder.toSql());
    });

    it('Works Mysql Sounds Like Operator', () => {
        const builder = getMysqlBuilder();
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

        builder = getSqlserverBuilder();
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

        builder = getSqlserverBuilder();
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
