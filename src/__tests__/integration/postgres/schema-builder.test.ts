import { DB, config, currentDB, isPostgres } from '../fixtures/config';

const maybe = isPostgres() ? describe : describe.skip;

maybe('Postgres Schema Builder', () => {
    config.connections.postgres.search_path = 'public,test_schema_private';

    let Schema = DB.connection().getSchemaBuilder();

    const hasView = async (schema: string, table: string): Promise<boolean> => {
        return await DB.connection()
            .table('information_schema.views')
            .where('table_catalog', config.connections.postgres.database)
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

    it('Works Drop All Tables On All Schemas', async () => {
        await Schema.create('public.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.create('test_schema_private.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.dropAllTables();

        expect(await Schema.hasTable('public.test_schema_table')).toBeFalsy();
        expect(await Schema.hasTable('test_schema_private.test_schema_table')).toBeFalsy();
    });

    it('Works Drop All Tables Uses Dont Drop Config On All Schemas', async () => {
        config.connections.postgres.dont_drop = ['spatial_ref_sys', 'test_schema_table'];
        await purge();

        await Schema.create('public.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.create('test_schema_private.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.dropAllTables();

        expect(await Schema.hasTable('public.test_schema_table')).toBeTruthy();
        expect(await Schema.hasTable('test_schema_private.test_schema_table')).toBeTruthy();

        config.connections.postgres.dont_drop = undefined;
        await purge();
        await Schema.dropAllTables();
    });

    it('Works Drop All Tables Uses Dont Drop Config On One Schemas', async () => {
        config.connections.postgres.dont_drop = ['spatial_ref_sys', 'test_schema_private.test_schema_table'];
        await purge();

        await Schema.create('public.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.create('test_schema_private.test_schema_table', table => {
            table.increments('id');
        });

        await Schema.dropAllTables();

        expect(await Schema.hasTable('public.test_schema_table')).toBeFalsy();
        expect(await Schema.hasTable('test_schema_private.test_schema_table')).toBeTruthy();

        config.connections.postgres.dont_drop = undefined;
        await purge();
        await Schema.dropAllTables();
    });

    it('Works Drop All Views On All Schemas', async () => {
        await DB.connection().statement('create view public.test_schema_foo (id) as select 1');
        await DB.connection().statement('create view test_schema_private.test_schema_foo (id) as select 1');

        await Schema.dropAllViews();

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
});
