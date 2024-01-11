import QueryBuilderI from '../../types/query/query-builder';
import { DB, currentGenericDB } from './fixtures/config';

describe('QueryBuilder', () => {
    const Schema = DB.connection(currentGenericDB).getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_query_builder_posts', table => {
            table.increments('id');
            table.string('title');
            table.text('content');
            table.timestamp('created_at');
        });

        await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .insert([
                { title: 'Foo Post', content: 'Lorem Ipsum.', created_at: '2017-11-12 13:14:15' },
                { title: 'Bar Post', content: 'Lorem Ipsum.', created_at: '2018-01-02 03:04:05' },
                { title: 'Foo Post', content: 'Lorem Ipsum.', created_at: '2020-08-09 10:07:08' },
                { title: 'Bat Post', content: 'Lorem Ipsum.', created_at: '2019-03-15 02:01:00' }
            ]);

        await Schema.create('test_query_builder_accounting', table => {
            table.increments('id');
            table.float('wallet_1');
            table.float('wallet_2');
            table.integer('user_id');
            table.string('name', 20);
        });

        await DB.connection(currentGenericDB)
            .table('test_query_builder_accounting')
            .insert([
                {
                    wallet_1: '100.11',
                    wallet_2: '200.11',
                    user_id: 1,
                    name: 'Taylor'
                },
                {
                    wallet_1: '15.11',
                    wallet_2: '300.11',
                    user_id: 2,
                    name: 'Otwell'
                }
            ]);
    });

    afterAll(async () => {
        await Schema.drop('test_query_builder_posts');
        await Schema.drop('test_query_builder_accounting');
        await DB.connection(currentGenericDB).disconnect();
    });

    it('Works Increment', async () => {
        const queryLogs: string[] = [];
        DB.connection(currentGenericDB).listen(query => {
            queryLogs.push(query.sql);
        });

        await DB.connection(currentGenericDB).table('test_query_builder_accounting').where('user_id', 2).incrementEach(
            {
                wallet_1: 10,
                wallet_2: -20
            },
            { name: 'foo' }
        );

        expect(1).toBe(queryLogs.length);

        let rows = await DB.connection(currentGenericDB).table('test_query_builder_accounting').get();

        expect(2).toBe(rows.length);

        // other rows are not affected.
        expect({
            id: 1,
            wallet_1: '100.11',
            wallet_2: '200.11',
            user_id: 1,
            name: 'Taylor'
        }).toEqual(rows[0]);

        expect({
            id: 2,
            wallet_1: (15.11 + 10).toFixed(2),
            wallet_2: (300.11 - 20).toFixed(2),
            user_id: 2,
            name: 'foo'
        }).toEqual(rows[1]);

        // without the second argument.
        let affectedRowsCount = await DB.connection(currentGenericDB)
            .table('test_query_builder_accounting')
            .where('user_id', 2)
            .incrementEach({
                wallet_1: 20,
                wallet_2: 20
            });

        expect(1).toBe(affectedRowsCount);

        rows = await DB.connection(currentGenericDB).table('test_query_builder_accounting').get();

        expect({
            id: 2,
            wallet_1: (15.11 + 10 + 20).toFixed(2),
            wallet_2: (300.11 - 20 + 20).toFixed(2),
            user_id: 2,
            name: 'foo'
        }).toEqual(rows[1]);

        // Test Can affect multiple rows at once.
        affectedRowsCount = await DB.connection(currentGenericDB).table('test_query_builder_accounting').incrementEach({
            wallet_1: 31.5,
            wallet_2: '-32.5'
        });

        expect(2).toBe(affectedRowsCount);

        rows = await DB.connection(currentGenericDB).table('test_query_builder_accounting').get();
        expect({
            id: 1,
            wallet_1: (100.11 + 31.5).toFixed(2),
            wallet_2: (200.11 - 32.5).toFixed(2),
            user_id: 1,
            name: 'Taylor'
        }).toEqual(rows[0]);

        expect({
            id: 2,
            wallet_1: (15.11 + 10 + 20 + 31.5).toFixed(2),
            wallet_2: (300.11 - 20 + 20 - 32.5).toFixed(2),
            user_id: 2,
            name: 'foo'
        }).toEqual(rows[1]);

        // In case of a conflict, the second argument wins and sets a fixed value:
        affectedRowsCount = await DB.connection(currentGenericDB)
            .table('test_query_builder_accounting')
            .incrementEach(
                {
                    wallet_1: 3000
                },
                { wallet_1: DB.bindTo.float(1.51) }
            );

        expect(2).toBe(affectedRowsCount);

        rows = await DB.connection(currentGenericDB).table('test_query_builder_accounting').get();

        expect('1.51').toBe(rows[0].wallet_1);
        expect('1.51').toBe(rows[1].wallet_1);
    });

    it('Works Sole', async () => {
        const expected = { id: 2, title: 'Bar Post' };
        const res = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .where('title', 'Bar Post')
            .select('id', 'title')
            .sole();
        expect(expected).toEqual(res);
    });

    it('Works Sole With Parameters', async () => {
        let expected: { [key: string]: any } = { id: 2 };

        let res = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .where('title', 'Bar Post')
            .sole('id');
        expect(expected).toEqual(res);

        res = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .where('title', 'Bar Post')
            .sole(['id']);
        expect(expected).toEqual(res);

        expected = { id: 2, title: 'Bar Post' };

        res = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .where('title', 'Bar Post')
            .sole(['id', 'title']);
        expect(expected).toEqual(res);
    });

    it('Works Sole Fails For Multiple Records', async () => {
        await expect(
            DB.connection(currentGenericDB).table('test_query_builder_posts').where('title', 'Foo Post').sole()
        ).rejects.toThrow('2 records were found.');
    });

    it('Works Sole Fails If No Records', async () => {
        await expect(
            DB.connection(currentGenericDB).table('test_query_builder_posts').where('title', 'Baz Post').sole()
        ).rejects.toThrow('no records were found.');
    });

    it('Works Select', async () => {
        const expected = { id: 1, title: 'Foo Post' };

        expect(expected).toEqual(
            await DB.connection(currentGenericDB).table('test_query_builder_posts').select('id', 'title').first()
        );
        expect(expected).toEqual(
            await DB.connection(currentGenericDB).table('test_query_builder_posts').select(['id', 'title']).first()
        );
        const res = await DB.connection(currentGenericDB).table('test_query_builder_posts').select().first();
        expect(4).toBe(Object.keys(res!).length);
    });

    it('Works Select Replaces Existing Selects', async () => {
        expect({ id: 1, title: 'Foo Post' }).toEqual(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .select('content')
                .select(['id', 'title'])
                .first()
        );
    });

    it('Works Select With Sub Query', async () => {
        expect({ id: 1, title: 'Foo Post', foo: 'Lorem Ipsum.' }).toEqual(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .select([
                    'id',
                    'title',
                    {
                        foo: query => {
                            query.select('content');
                        }
                    }
                ])
                .first()
        );
    });

    it('Works Add Select', async () => {
        const expected = { id: 1, title: 'Foo Post', content: 'Lorem Ipsum.' };
        expect(expected).toEqual(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .select('id')
                .addSelect('title', 'content')
                .first()
        );
        expect(expected).toEqual(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .select('id')
                .addSelect(['title', 'content'])
                .first()
        );
        expect(expected).toEqual(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .addSelect(['id', 'title', 'content'])
                .first()
        );
        const res = await DB.connection(currentGenericDB).table('test_query_builder_posts').addSelect([]).first();
        expect(4).toBe(Object.keys(res!).length);
        expect({ id: 1 }).toEqual(
            await DB.connection(currentGenericDB).table('test_query_builder_posts').select('id').addSelect([]).first()
        );
    });

    it('Works Add Select With Sub Query', async () => {
        expect({ id: 1, title: 'Foo Post', foo: 'Lorem Ipsum.' }).toEqual(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .addSelect([
                    'id',
                    'title',
                    {
                        foo: query => {
                            query.select('content');
                        }
                    }
                ])
                .first()
        );
    });

    it('Works From With Alias', async () => {
        expect(4).toBe(
            (await DB.connection(currentGenericDB).table('test_query_builder_posts', 'alias').select('alias.*').get())
                .length
        );
    });

    it('Works From With Sub Query', async () => {
        expect('Fake Post').toBe(
            (await DB.connection(currentGenericDB)
                .table(query => {
                    query.selectRaw("'Fake Post' as title");
                }, 'test_query_builder_posts')
                .first())!.title
        );
    });

    it('Works Where Value Sub Query', async () => {
        const subQuery = (query: QueryBuilderI): void => {
            query.selectRaw("'Sub query value'");
        };
        expect(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where(subQuery, 'Sub query value')
                .exists()
        ).toBeTruthy();
        expect(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where(subQuery, 'Does not match')
                .exists()
        ).toBeFalsy();
        expect(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where(subQuery, '!=', 'Does not match')
                .exists()
        ).toBeTruthy();
    });

    it('Works Where Value Sub Query QueryBuilder', async () => {
        const subQuery = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .selectRaw("'Sub query value'")
            .limit(1);

        expect(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where(subQuery, 'Sub query value')
                .exists()
        ).toBeTruthy();
        expect(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where(subQuery, 'Does not match')
                .exists()
        ).toBeFalsy();
        expect(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where(subQuery, '!=', 'Does not match')
                .exists()
        ).toBeTruthy();
    });

    it('Works Where Not', async () => {
        const results = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .whereNot(query => {
                query.where('title', 'Foo Post');
            })
            .get();

        expect(2).toBe(results.length);
        expect(results[0].title).toBe('Bar Post');
    });

    it('Works Where Not Input String Parameter', async () => {
        let results = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .whereNot('title', 'Foo Post')
            .get();
        expect(2).toBe(results.length);
        expect(results[0].title).toBe('Bar Post');

        results = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .whereNot('title', 'Foo Post')
            .whereNot('title', 'Bar Post')
            .get();
        expect('Bat Post').toBe(results[0].title);
    });

    it('Works Or Where Not', async () => {
        const results = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .where('id', 1)
            .orWhereNot(query => {
                query.where('title', 'Foo Post');
            })
            .get();
        expect(3).toBe(results.length);
    });

    it('Works Where Date', async () => {
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereDate('created_at', '2018-01-02')
                .count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereDate('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Or Where Date', async () => {
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereDate('created_at', '2018-01-02')
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereDate('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Where Day', async () => {
        expect(1).toBe(
            await DB.connection(currentGenericDB).table('test_query_builder_posts').whereDay('created_at', '02').count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB).table('test_query_builder_posts').whereDay('created_at', 2).count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereDay('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Or Where Day', async () => {
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereDay('created_at', '02')
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereDay('created_at', 2)
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereDay('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Where Month', async () => {
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereMonth('created_at', '01')
                .count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB).table('test_query_builder_posts').whereMonth('created_at', 1).count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereMonth('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Or Where Month', async () => {
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereMonth('created_at', '01')
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereMonth('created_at', 1)
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereMonth('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Where Year', async () => {
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereYear('created_at', '2018')
                .count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereYear('created_at', 2018)
                .count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereYear('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Or Where Year', async () => {
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereYear('created_at', '2018')
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereYear('created_at', 2018)
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereYear('created_at', new Date('2018-01-02'))
                .count()
        );
    });

    it('Works Where Time', async () => {
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereTime('created_at', '03:04:05')
                .count()
        );
        expect(1).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .whereTime('created_at', new Date('2018-01-02 03:04:05'))
                .count()
        );
    });

    it('Works Or Where Time', async () => {
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereTime('created_at', '03:04:05')
                .count()
        );
        expect(2).toBe(
            await DB.connection(currentGenericDB)
                .table('test_query_builder_posts')
                .where('id', 1)
                .orWhereTime('created_at', new Date('2018-01-02 03:04:05'))
                .count()
        );
    });

    it('Works Where Nested', async () => {
        const results = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .where('content', 'Lorem Ipsum.')
            .whereNested(query => {
                query.where('title', 'Bat Post').orWhere('title', 'Bar Post');
            })
            .count();
        expect(2).toBe(results);
    });

    it('Works Chunk Map', async () => {
        const queries: string[] = [];
        DB.connection(currentGenericDB).listen(query => {
            queries.push(query.sql);
        });

        const results = await DB.connection(currentGenericDB)
            .table('test_query_builder_posts')
            .orderBy('id')
            .chunkMap(post => {
                return post.title;
            }, 1);

        expect(4).toBe(results.length);
        expect('Foo Post').toBe(results[0]);
        expect('Bar Post').toBe(results[1]);
        expect(5).toBe(queries.length);
    });
});

// }
