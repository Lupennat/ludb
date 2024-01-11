import { DB, currentGenericDB, currentSqliteDB, isSqlite } from '../fixtures/config';

const maybe = isSqlite() ? describe : describe.skip;

maybe('Postgres Schema QueryBuilder', () => {
    const currentDB = currentGenericDB as currentSqliteDB;
    const Schema = DB.connection(currentDB).getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });
        await Schema.createView('test_schema_users_view', view =>
            view.as(query => query.select('name', 'age').from('test_schema_users'))
        );
    });

    afterAll(async () => {
        await Schema.drop('test_schema_users');
        await DB.connection(currentDB).disconnect();
    });

    it('Works Get Tables And Column Listing', async () => {
        expect(await Schema.getTables()).toEqual([{ name: 'test_schema_users' }]);
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
        expect(await Schema.getTables()).toEqual([{ name: 'test_schema_posts' }, { name: 'test_schema_users' }]);
        await Schema.drop('test_schema_posts');
    });

    it('Works Get Views', async () => {
        let views = await Schema.getViews();
        expect(views.length).toBe(1);
        expect(views[0].name).toBe('test_schema_users_view');
        expect(views[0].definition).toBe(
            'CREATE VIEW "test_schema_users_view" as select "name", "age" from "test_schema_users"'
        );

        await Schema.dropView('test_schema_users_view');
        views = await Schema.getViews();
        expect(views.length).toBe(0);
    });
});
