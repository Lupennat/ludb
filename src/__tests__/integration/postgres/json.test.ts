import { DB, isPostgres } from '../fixtures/config';

const maybe = isPostgres() ? describe : describe.skip;

maybe('Postgres Json', () => {
    const data: Array<[string, boolean, string, any?]> = [
        ['key not exists', true, 'invalid'],
        ['key exists and null', true, 'value', { value: null }],
        ['key exists and "null"', false, 'value', { value: 'null' }],
        ['key exists and not null', false, 'value', { value: false }],
        ['nested key not exists', true, 'nested->invalid'],
        ['nested key exists and null', true, 'nested->value', { nested: { value: null } }],
        ['nested key exists and "null"', false, 'nested->value', { nested: { value: 'null' } }],
        ['nested key exists and not null', false, 'nested->value', { nested: { value: false } }],
        ['array index not exists', true, '[0]', { 1: 'invalid' }],
        ['array index exists and null', true, '[0]', [null]],
        ['array index exists and "null"', false, '[0]', ['null']],
        ['array index exists and not null', false, '[0]', [false]],
        ['multiple array index not exists', true, '[0][0]', [undefined, [undefined, 'invalid']]],
        ['multiple array index exists and null', true, '[0][0]', [[null]]],
        ['multiple array index exists and "null"', false, '[0][0]', [['null']]],
        ['multiple array index exists and not null', false, '[0][0]', [[false]]],
        ['nested array index not exists', true, 'nested[0]', { nested: [undefined, 'nested->invalid'] }],
        ['nested array index exists and null', true, 'nested->value[1]', { nested: { value: [0, null] } }],
        ['nested array index exists and "null"', false, 'nested->value[1]', { nested: { value: [0, 'null'] } }],
        ['nested array index exists and not null', false, 'nested->value[1]', { nested: { value: [0, false] } }]
    ];

    const dataContains: Array<[string, number, string]> = [
        ['string key', 4, 'json_col->foo'],
        ['nested key exists', 2, 'json_col->foo->bar'],
        ['string key missing', 0, 'json_col->none'],
        ['integer key with arrow ', 1, 'json_col->foo->bar->0'],
        ['integer key with braces', 1, 'json_col->foo->bar[0]'],
        ['integer key missing', 0, 'json_col->foo->bar[1]'],
        ['mixed keys', 1, 'json_col->foo[1]->baz'],
        ['null value', 1, 'json_col->bar']
    ];

    const Schema = DB.connection().getSchemaBuilder();

    beforeAll(async () => {
        await Schema.create('test_json_table', table => {
            table.json('json_col').nullable();
        });
        await Schema.create('test_json_table_null', table => {
            table.id();
            table.json('json_col').nullable();
        });
        await Schema.create('test_json_table_not_null', table => {
            table.id();
            table.json('json_col').nullable();
        });
        await Schema.create('test_json_table_contains', table => {
            table.json('json_col').nullable();
        });
        await DB.connection()
            .table('test_json_table')
            .insert([
                { json_col: { foo: ['bar'] } },
                { json_col: { foo: ['baz'] } },
                { json_col: { foo: [['array']] } }
            ]);
        await DB.connection()
            .table('test_json_table_contains')
            .insert([
                { json_col: { foo: { bar: ['baz'] } } },
                { json_col: { foo: { bar: false } } },
                { json_col: { foo: {} } },
                { json_col: { foo: [{ bar: 'bar' }, { baz: 'baz' }] } },
                { json_col: { bar: null } }
            ]);
    });

    afterAll(async () => {
        await Schema.drop('test_json_table');
        await Schema.drop('test_json_table_null');
        await Schema.drop('test_json_table_not_null');
        await Schema.drop('test_json_table_contains');
        await DB.disconnect();
    });

    it('Works Json Path Update', async () => {
        let updatedCount = await DB.connection().table('test_json_table').where('json_col->foo[0]', 'baz').update({
            'json_col->foo[0]': 'updated'
        });
        expect(updatedCount).toBe(1);

        updatedCount = await DB.connection().table('test_json_table').where('json_col->foo[0][0]', 'array').update({
            'json_col->foo[0][0]': 'updated'
        });
        expect(updatedCount).toBe(1);
    });

    it.each(data)(
        'Works Json Where Null %s',
        async (_description: string, expected: boolean, key: string, value: any = { value: 123 }) => {
            const id = await DB.connection().table('test_json_table_null').insertGetId({
                json_col: value
            });
            expect(
                await DB.connection()
                    .table('test_json_table_null')
                    .whereNull(`json_col->${key}`)
                    .where('id', id)
                    .exists()
            )[expected ? 'toBeTruthy' : 'toBeFalsy']();
        }
    );

    it.each(data)(
        'Works Json Where Not Null %s',
        async (_description: string, expected: boolean, key: string, value: any = { value: 123 }) => {
            const id = await DB.connection().table('test_json_table_not_null').insertGetId({
                json_col: value
            });

            expect(
                await DB.connection()
                    .table('test_json_table_not_null')
                    .whereNotNull(`json_col->${key}`)
                    .where('id', id)
                    .exists()
            )[!expected ? 'toBeTruthy' : 'toBeFalsy']();
        }
    );

    it.each(dataContains)(
        'Works Where Json Contains Key %s',
        async (_description: string, count: number, column: string) => {
            expect(count).toBe(
                await DB.connection().table('test_json_table_contains').whereJsonContainsKey(column).count()
            );
        }
    );
});
