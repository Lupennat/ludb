import { DB, currentGenericDB } from './fixtures/config';

describe('Aggregate', () => {
    const Schema = DB.connection(currentGenericDB).getSchemaBuilder();
    beforeAll(async () => {
        await Schema.create('test_aggregate_users', table => {
            table.increments('id');
            table.integer('c');
            table.string('name');
            table.integer('balance').nullable();
        });

        await DB.connection(currentGenericDB)
            .table('test_aggregate_users')
            .insert([
                { c: 1, name: 'test-name1', balance: -10 },
                { c: 2, name: 'test-name2', balance: -10 },
                { c: 3, name: 'test-name3', balance: 0 },
                { c: 4, name: 'test-name4', balance: +10 },
                { c: 5, name: 'test-name5', balance: +20 },
                { c: 6, name: 'test-name5', balance: null }
            ]);
    });

    afterAll(async () => {
        await Schema.drop('test_aggregate_users');
        await DB.connection(currentGenericDB).disconnect();
    });

    it('Works Min Max', async () => {
        expect(-10).toBe(await DB.connection(currentGenericDB).table('test_aggregate_users').min('balance'));
        expect(
            await DB.connection(currentGenericDB).table('test_aggregate_users').where('name', 'no-name').min('balance')
        ).toBeNull();
        expect(10).toBe(
            await DB.connection(currentGenericDB).table('test_aggregate_users').where('c', '>', 3).min('balance')
        );

        expect(20).toBe(await DB.connection(currentGenericDB).table('test_aggregate_users').max('balance'));
        expect(
            await DB.connection(currentGenericDB).table('test_aggregate_users').where('name', 'no-name').max('balance')
        ).toBeNull();
        expect(0).toBe(
            await DB.connection(currentGenericDB).table('test_aggregate_users').where('c', '<', 4).max('balance')
        );
    });

    it('Works Avg', async () => {
        expect(2).toBe(Number(await DB.connection(currentGenericDB).table('test_aggregate_users').avg('balance')));
        expect(
            await DB.connection(currentGenericDB).table('test_aggregate_users').where('name', 'no-name').avg('balance')
        ).toBeNull();
        expect(15).toBe(
            Number(
                await DB.connection(currentGenericDB).table('test_aggregate_users').where('c', '>', 3).avg('balance')
            )
        );

        expect(2).toBe(Number(await DB.connection(currentGenericDB).table('test_aggregate_users').average('balance')));
        expect(
            await DB.connection(currentGenericDB)
                .table('test_aggregate_users')
                .where('name', 'no-name')
                .average('balance')
        ).toBeNull();
        expect(-10).toBe(
            Number(
                await DB.connection(currentGenericDB)
                    .table('test_aggregate_users')
                    .where('c', '<', 3)
                    .average('balance')
            )
        );
    });

    it('Works Sum', async () => {
        expect(10).toBe(Number(await DB.connection(currentGenericDB).table('test_aggregate_users').sum('balance')));
        const result = await DB.connection(currentGenericDB)
            .table('test_aggregate_users')
            .where('name', 'no-name')
            .sum('balance');
        expect(result).not.toBeNull();
        expect(0).toBe(Number(result));
        expect(20).toBe(
            Number(
                await DB.connection(currentGenericDB).table('test_aggregate_users').where('c', '>', 1).sum('balance')
            )
        );
    });
});
