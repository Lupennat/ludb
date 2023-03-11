import { DB, currentDB } from '../fixtures/config';

const maybe = currentDB === 'mysql' || currentDB === 'maria' ? describe : describe.skip;

maybe('MySql FullText', () => {
    const Schema = DB.connection().getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('articles', table => {
            table.id('id');
            table.string('title', 200);
            table.text('body');
            table.fulltext(['title', 'body']);
        });

        await DB.connection()
            .table('articles')
            .insert([
                { title: 'MySQL Tutorial', body: 'DBMS stands for DataBase ...' },
                { title: 'How To Use MySQL Well', body: 'After you went through a ...' },
                { title: 'Optimizing MySQL', body: 'In this tutorial, we show ...' },
                { title: '1001 MySQL Tricks', body: '1. Never run mysqld as root. 2. ...' },
                { title: 'MySQL vs. YourSQL', body: 'In the following database comparison ...' },
                { title: 'MySQL Security', body: 'When configured properly, MySQL ...' }
            ]);
    });

    afterAll(async () => {
        await Schema.drop('articles');
        await DB.disconnect();
    });

    /** @link https://dev.mysql.com/doc/refman/8.0/en/fulltext-natural-language.html */
    it('Works WhereFulltext', async () => {
        const articles = await DB.connection().table('articles').whereFulltext(['title', 'body'], 'database').get();

        expect(articles).toHaveLength(2);
        expect('MySQL Tutorial').toBe(articles[0].title);
        expect('MySQL vs. YourSQL').toBe(articles[1].title);
    });

    /** @link https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html */
    it('Works WhereFulltextWithBooleanMode', async () => {
        const articles = await DB.connection()
            .table('articles')
            .whereFulltext(['title', 'body'], '+MySQL -YourSQL', { mode: 'boolean' })
            .get();

        expect(articles).toHaveLength(5);
    });

    /** @link https://dev.mysql.com/doc/refman/8.0/en/fulltext-query-expansion.html */
    it('Works WhereFulltextWithExpandedQuery', async () => {
        const articles = await DB.connection()
            .table('articles')
            .whereFulltext(['title', 'body'], 'database', { expanded: true })
            .get();

        expect(articles).toHaveLength(6);
    });
});
