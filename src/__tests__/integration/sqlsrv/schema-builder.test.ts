import { DB, currentGenericDB, currentSqlserverDB, isSqlserver } from '../fixtures/config';

const maybe = isSqlserver() ? describe : describe.skip;

maybe('Postgres Schema QueryBuilder', () => {
    const currentDB = currentGenericDB as currentSqlserverDB;
    const Schema = DB.connection(currentDB).getSchemaBuilder();

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
        await DB.connection(currentDB).disconnect();
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
        await DB.connection(currentDB).statement(
            'create view test_schema_users_view AS select name,age FROM test_schema_users'
        );
        expect(await Schema.getViews()).toEqual(['test_schema_users_view']);
        await DB.connection(currentDB).statement('drop view if exists test_schema_users_view;');
        expect(await Schema.getViews()).toEqual([]);
    });
});
