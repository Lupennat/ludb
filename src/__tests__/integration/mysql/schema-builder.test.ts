import { DB, currentDB } from '../fixtures/config';

const maybe = currentDB === 'mysql' || currentDB === 'maria' ? describe : describe.skip;

maybe('MySql FullText', () => {
    const Schema = DB.connection().getSchemaBuilder();

    it('Works Add Comment To Table', async () => {
        await Schema.create('users', table => {
            table.id();
            table.comment('This is a comment');
        });

        const tableInfo = await DB.connection()
            .table('information_schema.tables')
            .where('table_schema', DB.connection().getDatabaseName())
            .where('table_name', 'users')
            .select('table_comment as table_comment')
            .first();

        expect(tableInfo!.table_comment).toBe('This is a comment');
        await Schema.drop('users');
        await DB.disconnect();
    });
});
