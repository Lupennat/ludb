import { PostgresConfig } from '../../../types/config';
import { DB, config, currentDB, isPostgres } from '../fixtures/config';

const maybe = isPostgres() ? describe : describe.skip;

maybe('Postgres Schema Builder', () => {
    (config.connections[currentDB] as PostgresConfig).search_path = 'public,test_schema_private';

    let Schema = DB.connection().getSchemaBuilder();

    const hasView = async (schema: string, table: string): Promise<boolean> => {
        return await DB.connection()
            .table('information_schema.views')
            .where('table_catalog', (config.connections[currentDB] as PostgresConfig).database)
            .where('table_schema', schema)
            .where('table_name', table)
            .exists();
    };

    const purge = async (): Promise<void> => {
        await DB.purge(currentDB);
        Schema = DB.connection().getSchemaBuilder();
    };

    beforeAll(async () => {
        await DB.connection().statement('create schema if not exists test_schema_private');
    });

    afterAll(async () => {
        await DB.connection().statement('drop table if exists public.test_schema_table');
        await DB.connection().statement('drop table if exists private.test_schema_table');

        await DB.connection().statement('drop view if exists public.test_schema_foo');
        await DB.connection().statement('drop view if exists private.test_schema_foo');

        await DB.connection().statement('drop schema test_schema_private cascade');
        await DB.disconnect();
    });

    it('Works Drop Tables On All Schemas', async () => {
        await Schema.create('public.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.create('test_schema_private.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.dropTables();

        expect(await Schema.hasTable('public.test_schema_table')).toBeFalsy();
        expect(await Schema.hasTable('test_schema_private.test_schema_table')).toBeFalsy();
    });

    it('Works Drop Tables Uses Dont Drop Config On All Schemas', async () => {
        (config.connections[currentDB] as PostgresConfig).dont_drop = ['spatial_ref_sys', 'test_schema_table'];
        await purge();

        await Schema.create('public.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.create('test_schema_private.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.dropTables();

        expect(await Schema.hasTable('public.test_schema_table')).toBeTruthy();
        expect(await Schema.hasTable('test_schema_private.test_schema_table')).toBeTruthy();

        (config.connections[currentDB] as PostgresConfig).dont_drop = undefined;
        await purge();
        await Schema.dropTables();
    });

    it('Works Drop Tables Uses Dont Drop Config On One Schemas', async () => {
        (config.connections[currentDB] as PostgresConfig).dont_drop = [
            'spatial_ref_sys',
            'test_schema_private.test_schema_table'
        ];
        await purge();

        await Schema.create('public.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.create('test_schema_private.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.dropTables();

        expect(await Schema.hasTable('public.test_schema_table')).toBeFalsy();
        expect(await Schema.hasTable('test_schema_private.test_schema_table')).toBeTruthy();

        (config.connections[currentDB] as PostgresConfig).dont_drop = undefined;
        await purge();
        await Schema.dropTables();
    });

    it('Works Drop Views On All Schemas', async () => {
        await DB.connection().statement('create view public.test_schema_foo (id) as select 1');
        await DB.connection().statement('create view test_schema_private.test_schema_foo (id) as select 1');

        await Schema.dropViews();

        expect(await hasView('public', 'test_schema_foo')).toBeFalsy();
        expect(await hasView('test_schema_private', 'test_schema_foo')).toBeFalsy();
    });

    it('Works Add Table Comment On New Table', async () => {
        await Schema.create('public.test_schema_posts', table => {
            table.comment('This is a comment');
        });

        expect('This is a comment').toBe(
            (await DB.connection().selectOne(
                "select obj_description('public.test_schema_posts'::regclass, 'pg_class')"
            ))!.obj_description
        );

        await Schema.drop('public.test_schema_posts');
    });

    it('Works Add Table Comment On New Table', async () => {
        await Schema.create('public.test_schema_posts', table => {
            table.id();
            table.comment('This is a comment');
        });

        await Schema.table('public.test_schema_posts', table => {
            table.comment('This is a new comment');
        });

        expect('This is a new comment').toBe(
            (await DB.connection().selectOne(
                "select obj_description('public.test_schema_posts'::regclass, 'pg_class')"
            ))!.obj_description
        );
        await Schema.drop('public.test_schema_posts');
    });

    it('Works Get Tables And Column Listing', async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });

        await DB.connection().statement('create view test_schema_users_view AS select name,age FROM test_schema_users');

        expect(await Schema.getTables()).toEqual(
            expect.arrayContaining(['"public"."test_schema_users"', '"public"."spatial_ref_sys"'])
        );
        expect(await Schema.getColumns('test_schema_users')).toEqual(['id', 'name', 'age', 'color']);
        await Schema.create('test_schema_posts', table => {
            table.integer('id');
            table.string('title');
        });
        expect(await Schema.getTables()).toEqual(
            expect.arrayContaining(['"public"."test_schema_users"', '"public"."test_schema_posts"'])
        );
        await Schema.drop('test_schema_posts');
        await DB.connection().statement('drop view if exists test_schema_users_view;');
        await Schema.drop('test_schema_users');
    });

    it('Works Get Views', async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });

        await DB.connection().statement('create view test_schema_users_view AS select name,age FROM test_schema_users');

        expect(await Schema.getViews()).toEqual(
            expect.arrayContaining([
                '"public"."geography_columns"',
                '"public"."geometry_columns"',
                '"public"."test_schema_users_view"'
            ])
        );
        await DB.connection().statement('drop view if exists test_schema_users_view;');
        expect(await Schema.getViews()).toEqual(
            expect.arrayContaining(['"public"."geography_columns"', '"public"."geometry_columns"'])
        );
        await Schema.drop('test_schema_users');
    });
});
