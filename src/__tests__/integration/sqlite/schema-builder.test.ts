import { DB, currentDB, isSqlite } from '../fixtures/config';

const maybe = isSqlite() ? describe : describe.skip;

maybe('Postgres Schema QueryBuilder', () => {
    const Schema = DB.connections[currentDB].getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });
        await DB.connections[currentDB].statement(
            'CREATE view test_schema_users_view AS select name,age FROM test_schema_users'
        );
    });

    afterAll(async () => {
        await Schema.drop('test_schema_users');
        await DB.connections[currentDB].disconnect();
    });

    it('Works Get Tables And Column Listing', async () => {
        expect(await Schema.getTables()).toEqual(['test_schema_users']);
        expect(await Schema.getColumns('test_schema_users')).toEqual(['id', 'name', 'age', 'color']);
        await Schema.create('test_schema_posts', table => {
            table.integer('id');
            table.string('title');
        });
        expect(await Schema.getTables()).toEqual(expect.arrayContaining(['test_schema_users', 'test_schema_posts']));
        await Schema.drop('test_schema_posts');
    });

    it('Works Get Views', async () => {
        expect(await Schema.getViews()).toEqual(['test_schema_users_view']);
        await DB.connections[currentDB].statement('DROP VIEW IF EXISTS test_schema_users_view;');
        expect(await Schema.getViews()).toEqual([]);
    });
});
