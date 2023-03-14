import { DB, isMySql } from '../fixtures/config';

const maybe = isMySql() ? describe : describe.skip;

maybe('MySql Schema Builder', () => {
    const Schema = DB.connection().getSchemaBuilder();

    afterAll(async () => {
        await DB.disconnect();
    });

    it('Works Add Comment To Table', async () => {
        await Schema.create('test_schema_users', table => {
            table.id();
            table.comment('This is a comment');
        });

        const tableInfo = await DB.connection()
            .table('information_schema.tables')
            .where('table_schema', DB.connection().getDatabaseName())
            .where('table_name', 'test_schema_users')
            .select('table_comment as table_comment')
            .first();

        expect(tableInfo!.table_comment).toBe('This is a comment');
        await Schema.drop('test_schema_users');
    });

    it('Works Get All Tables And Column Listing', async () => {
        await Schema.create('test_schema_posts', table => {
            table.id();
            table.string('title');
        });

        expect((await Schema.getAllTables()).find(name => name === 'test_schema_posts')).toBe('test_schema_posts');
        expect(await Schema.getColumnListing('test_schema_posts')).toEqual(['id', 'title']);

        await Schema.drop('test_schema_posts');
    });
});
