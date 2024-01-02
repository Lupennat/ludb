import { DB, currentDB, isPostgres } from '../fixtures/config';

const maybe = isPostgres() ? describe : describe.skip;

maybe('Postgres FullText', () => {
    const Schema = DB.connections[currentDB].getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_fulltext_articles', table => {
            table.id('id');
            table.string('title', 200);
            table.text('body');
            table.fulltext(['title', 'body']);
        });

        await DB.connections[currentDB].table('test_fulltext_articles').insert([
            { title: 'PostgreSQL Tutorial', body: 'DBMS stands for DataBase ...' },
            { title: 'How To Use PostgreSQL Well', body: 'After you went through a ...' },
            { title: 'Optimizing PostgreSQL', body: 'In this tutorial, we show ...' },
            { title: '1001 PostgreSQL Tricks', body: '1. Never run mysqld as root. 2. ...' },
            { title: 'PostgreSQL vs. YourSQL', body: 'In the following database comparison ...' },
            { title: 'PostgreSQL Security', body: 'When configured properly, PostgreSQL ...' }
        ]);
    });

    afterAll(async () => {
        await Schema.drop('test_fulltext_articles');
        await DB.connections[currentDB].disconnect();
    });

    it('Works Where Fulltext', async () => {
        const articles = await DB.connections[currentDB]
            .table('test_fulltext_articles')
            .whereFulltext(['title', 'body'], 'database')
            .orderBy('id')
            .get();

        expect(articles).toHaveLength(2);
        expect('PostgreSQL Tutorial').toBe(articles[0].title);
        expect('PostgreSQL vs. YourSQL').toBe(articles[1].title);
    });

    it('Works Where Fulltext With Web Search', async () => {
        const articles = await DB.connections[currentDB]
            .table('test_fulltext_articles')
            .whereFulltext(['title', 'body'], '+PostgreSQL -YourSQL', { mode: 'websearch' })
            .get();

        expect(articles).toHaveLength(5);
    });

    it('Works Where Fulltext With Plain', async () => {
        const articles = await DB.connections[currentDB]
            .table('test_fulltext_articles')
            .whereFulltext(['title', 'body'], 'PostgreSQL tutorial', { mode: 'plain' })
            .get();

        expect(articles).toHaveLength(2);
    });

    it('Works Where Fulltext With Plain', async () => {
        const articles = await DB.connections[currentDB]
            .table('test_fulltext_articles')
            .whereFulltext(['title', 'body'], 'PostgreSQL tutorial', { mode: 'phrase' })
            .get();

        expect(articles).toHaveLength(1);
    });
});
