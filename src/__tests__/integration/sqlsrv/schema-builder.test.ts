import { DB, isSqlServer } from '../fixtures/config';

const maybe = isSqlServer() ? describe : describe.skip;

maybe('Postgres Schema Builder', () => {
    const Schema = DB.connection().getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });
    });

    afterAll(async () => {
        await Schema.drop('test_schema_users');
        await DB.disconnect();
    });

    it('Works Get All Tables And Column Listing', async () => {
        expect(await Schema.getAllTables()).toEqual(['test_schema_users']);
        expect(await Schema.getColumnListing('test_schema_users')).toEqual(['id', 'name', 'age', 'color']);
        await Schema.create('test_schema_posts', table => {
            table.integer('id');
            table.string('title');
        });
        expect(await Schema.getAllTables()).toEqual(expect.arrayContaining(['test_schema_users', 'test_schema_posts']));
        await Schema.drop('test_schema_posts');
    });

    it('Works Get All Views', async () => {
        await DB.connection().statement('create view test_schema_users_view AS select name,age FROM test_schema_users');
        expect(await Schema.getAllViews()).toEqual(['test_schema_users_view']);
        await DB.connection().statement('drop view if exists test_schema_users_view;');
        expect(await Schema.getAllViews()).toEqual([]);
    });
});
