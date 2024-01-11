import { PostgresConfig } from '../../../types/config';
import { DB, config, currentGenericDB, currentPostgresDB, isPostgres, isPostgres16 } from '../fixtures/config';

const maybe = isPostgres() ? describe : describe.skip;

maybe('Postgres Schema Builder', () => {
    const currentDB = currentGenericDB as currentPostgresDB;
    (config[currentDB] as PostgresConfig).search_path = 'public,test_schema_private';

    let Schema = DB.connection(currentDB).getSchemaBuilder();

    const purge = async (): Promise<void> => {
        await DB.purge(currentDB);
        Schema = DB.connection(currentDB).getSchemaBuilder();
    };

    beforeAll(async () => {
        await DB.connection(currentDB).statement('create schema if not exists test_schema_private');
    });

    afterAll(async () => {
        await DB.connection(currentDB).statement('drop table if exists public.test_schema_table');
        await DB.connection(currentDB).statement('drop table if exists private.test_schema_table');

        await DB.connection(currentDB).statement('drop view if exists public.test_schema_foo');
        await DB.connection(currentDB).statement('drop view if exists private.test_schema_foo');

        await DB.connection(currentDB).statement('drop schema test_schema_private cascade');
        await DB.disconnect(currentDB);
    });

    it('Works Drop All Tables On All Schemas', async () => {
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

    it('Works Drop All Tables Uses Dont Drop Config On All Schemas', async () => {
        (config[currentDB] as PostgresConfig).dont_drop = ['spatial_ref_sys', 'test_schema_table'];
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

        (config[currentDB] as PostgresConfig).dont_drop = undefined;
        await purge();
        await Schema.dropTables();
    });

    it('Works Drop All Tables Uses Dont Drop Config On One Schemas', async () => {
        (config[currentDB] as PostgresConfig).dont_drop = ['spatial_ref_sys', 'test_schema_private.test_schema_table'];
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

        (config[currentDB] as PostgresConfig).dont_drop = undefined;
        await purge();
        await Schema.dropTables();
    });

    it('Works Drop All Views On All Schemas', async () => {
        await Schema.createView('create view public.test_schema_foo (id) as select 1');
        await Schema.createView('create view test_schema_private.test_schema_foo (id) as select 1');

        await Schema.dropViews();

        expect(await Schema.hasView('public.test_schema_foo')).toBeFalsy();
        expect(await Schema.hasView('test_schema_private.test_schema_foo')).toBeFalsy();
    });

    it('Works Add Table Comment On New Table', async () => {
        await Schema.create('public.test_schema_posts', table => {
            table.comment('This is a comment');
        });

        const table = (await Schema.getTables()).find(table => table.name === 'test_schema_posts');

        expect(table!.comment).toBe('This is a comment');

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

        const table = (await Schema.getTables()).find(table => table.name === 'test_schema_posts');

        expect(table!.comment).toBe('This is a new comment');

        await Schema.drop('public.test_schema_posts');
    });

    it('Works Get All Tables And Column Listing', async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });
        expect((await Schema.getTables()).map(table => table.name)).toEqual(
            expect.arrayContaining(['test_schema_users'])
        );
        expect((await Schema.getColumns('test_schema_users')).map(column => column.name)).toEqual([
            'id',
            'name',
            'age',
            'color'
        ]);
        await Schema.create('test_schema_posts', table => {
            table.integer('id');
            table.string('title');
        });
        expect((await Schema.getTables()).map(table => table.name)).toEqual(
            expect.arrayContaining(['test_schema_users', 'test_schema_posts'])
        );
        await Schema.drop('test_schema_posts');
        await Schema.drop('test_schema_users');
    });

    it('Works Get All Views', async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });
        await Schema.createView('test_schema_users_view', view =>
            view.as(query => query.select('name', 'age').from('test_schema_users'))
        );
        const view = (await Schema.getViews()).find(table => table.name === 'test_schema_users_view');
        expect(view!.name).toBe('test_schema_users_view');
        expect(view!.schema).toBe('public');
        expect(view!.definition.replace(/(\r\n|\n|\r|(  ))/gm, '').trim()).toBe(
            isPostgres16()
                ? 'SELECT name,age FROM test_schema_users;'
                : 'SELECT test_schema_users.name,test_schema_users.age FROM test_schema_users;'
        );

        await Schema.dropView('test_schema_users_view');
        await Schema.drop('test_schema_users');
    });
});
