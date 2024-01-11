import { DB, currentGenericDB, currentMysqlDB, isMysql } from '../fixtures/config';

const maybe = isMysql() ? describe : describe.skip;

maybe('Mysql Schema QueryBuilder', () => {
    const currentDB = currentGenericDB as currentMysqlDB;
    const Schema = DB.connection(currentDB).getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_schema_users', table => {
            table.integer('id');
            table.collation('utf8_unicode_ci');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });

        await Schema.createView('test_schema_users_view', view =>
            view.as(query => query.select('name', 'age').from('test_schema_users'))
        );
    });

    afterAll(async () => {
        await Schema.dropTableIfExists('test_schema_users');
        await Schema.dropViewIfExists('test_schema_users_view');
        await DB.connection(currentDB).disconnect();
    });

    it('Works Add Comment To Table', async () => {
        await Schema.create('test_schema_posts', table => {
            table.id();
            table.comment('This is a comment');
        });

        const table = (await Schema.getTables()).find(table => table.name === 'test_schema_posts');

        expect(table!.comment).toBe('This is a comment');

        await Schema.drop('test_schema_posts');
    });

    it('Works Get Tables', async () => {
        let tables = await Schema.getTables();
        expect(tables.length).toBe(1);
        expect(['utf8_unicode_ci', 'utf8mb3_unicode_ci'].includes(tables[0].collation)).toBeTruthy();
        expect(tables[0].size).toBeGreaterThan(1);
        expect(tables[0].comment).toBe('');
        expect(tables[0].engine).toBe('InnoDB');
        expect(tables[0].name).toBe('test_schema_users');

        await Schema.create('test_schema_posts', table => {
            table.collation('utf8_unicode_ci');
            table.integer('id');
            table.string('title');
        });

        tables = await Schema.getTables();
        expect(tables.length).toBe(2);
        expect(['utf8_unicode_ci', 'utf8mb3_unicode_ci'].includes(tables[0].collation)).toBeTruthy();
        expect(tables[0].size).toBeGreaterThan(1);
        expect(tables[0].comment).toBe('');
        expect(tables[0].engine).toBe('InnoDB');
        expect(tables[0].name).toBe('test_schema_posts');

        await Schema.drop('test_schema_posts');
    });

    it('Works Get Views', async () => {
        let views = await Schema.getViews();
        expect(views.length).toBe(1);
        expect(views[0].name).toBe('test_schema_users_view');
        expect(views[0].definition).toBe(
            'select `tempdb`.`test_schema_users`.`name` AS `name`,`tempdb`.`test_schema_users`.`age` AS `age` from `tempdb`.`test_schema_users`'
        );

        await Schema.dropView('test_schema_users_view');
        views = await Schema.getViews();
        expect(views.length).toBe(0);
    });
});
