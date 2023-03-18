import Raw from '../../query/expression';
import { DB, isSqlServer } from './fixtures/config';

interface JsonMulti {
    options: string;
    meta: string;
    group_id: number;
    created_at: string;
}

interface Json {
    json_col: string;
}

const maybe = !isSqlServer() ? describe : describe.skip;

maybe('Json', () => {
    const data: Array<[string, boolean, string, any?]> = [
        ['key not exists', true, 'invalid'],
        ['key exists and null', true, 'value', { value: null }],
        ['key exists and "null"', false, 'value', { value: 'null' }],
        ['key exists and not null', false, 'value', { value: false }],
        ['nested key not exists', true, 'nested->invalid'],
        ['nested key exists and null', true, 'nested->value', { nested: { value: null } }],
        ['nested key exists and "null"', false, 'nested->value', { nested: { value: 'null' } }],
        ['nested key exists and not null', false, 'nested->value', { nested: { value: false } }],
        ['array index not exists', true, '[0]', [undefined, 'invalid']],
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
        ['integer key with arrow ', 0, 'json_col->foo->bar->0'],
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
        await Schema.create('test_json_table_multi', table => {
            table.json('options').nullable();
            table.json('meta').nullable();
            table.unsignedInteger('group_id');
            table.dateTime('created_at');
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
                { json_col: { foo: [['array']] } },
                { json_col: { test: [] } }
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
        await Schema.drop('test_json_table_multi');
        await Schema.drop('test_json_table_null');
        await Schema.drop('test_json_table_not_null');
        await Schema.drop('test_json_table_contains');
        await DB.disconnect();
    });

    it('Works Update Wrapping Json', async () => {
        let updatedCount = await DB.connection()
            .table('test_json_table')
            .whereJsonContainsKey('json_col->test')
            .update({
                'json_col->test[0]': 0,
                'json_col->test[1]': 1
            });
        expect(updatedCount).toBe(1);

        expect(
            JSON.parse(
                (await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').sole<Json>())
                    .json_col
            )
        ).toEqual({ test: [0, 1] });

        updatedCount = await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').update({
            'json_col->test[2]': 2,
            'json_col->test[3]': 3
        });

        expect(updatedCount).toBe(1);
        expect(
            JSON.parse(
                (await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').sole<Json>())
                    .json_col
            )
        ).toEqual({ test: [0, 1, 2, 3] });

        updatedCount = await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').update({
            'json_col->test': {}
        });

        expect(updatedCount).toBe(1);
        expect(
            JSON.parse(
                (await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').sole<Json>())
                    .json_col
            )
        ).toEqual({ test: {} });

        updatedCount = await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').update({
            'json_col->test->first_name': 'John',
            'json_col->test->last_name': 'Doe'
        });

        expect(updatedCount).toBe(1);
        expect(
            JSON.parse(
                (await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').sole<Json>())
                    .json_col
            )
        ).toEqual({ test: { first_name: 'John', last_name: 'Doe' } });

        updatedCount = await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').update({
            'json_col->test->first_name': true,
            'json_col->test->last_name': false
        });

        expect(updatedCount).toBe(1);
        expect(
            JSON.parse(
                (await DB.connection().table('test_json_table').whereJsonContainsKey('json_col->test').sole<Json>())
                    .json_col
            )
        ).toEqual({ test: { first_name: true, last_name: false } });
    });

    it('Works Update Wrapping Json Array', async () => {
        await DB.connection()
            .table('test_json_table_multi')
            .insert({ options: {}, meta: {}, group_id: 10, created_at: DB.bindTo.dateTime('2023-03-12 22:00:00') });

        const updatedCount = await DB.connection()
            .table('test_json_table_multi')
            .update({
                'test_json_table_multi.options->2fa': false,
                'test_json_table_multi.options->presets': ['laravel', 'vue'],
                'meta->tags': ['white', 'large'],
                'options->language': 'english',
                group_id: new Raw('45'),
                created_at: DB.bindTo.dateTime('2019-08-06 21:00:00')
            });

        expect(updatedCount).toBe(1);

        const res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual({ '2fa': false, presets: ['laravel', 'vue'], language: 'english' });
        expect(JSON.parse(res.meta)).toEqual({ tags: ['white', 'large'] });
        expect(res.group_id).toBe(45);
        expect(res.created_at).toBe('2019-08-06 21:00:00');

        await DB.connection().table('test_json_table_multi').truncate();
    });

    it('Works Update Wrapping Nested Json Array', async () => {
        await DB.connection()
            .table('test_json_table_multi')
            .insert({
                options: { sharing: {} },
                meta: {},
                group_id: 10,
                created_at: DB.bindTo.dateTime('2023-03-12 22:00:00')
            });

        const updatedCount = await DB.connection()
            .table('test_json_table_multi')
            .update({
                'test_json_table_multi.options->name': 'Lupennat',
                'options->security': { '2fa': false, presets: ['laravel', 'vue'] },
                'options->sharing->twitter': 'username',
                'options->sharing->facebook': 'username',
                group_id: new Raw('45'),
                created_at: DB.bindTo.dateTime('2019-08-06 21:00:00')
            });

        expect(updatedCount).toBe(1);

        const res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual({
            name: 'Lupennat',
            security: { '2fa': false, presets: ['laravel', 'vue'] },
            sharing: { twitter: 'username', facebook: 'username' }
        });
        expect(JSON.parse(res.meta)).toEqual({});
        expect(res.group_id).toBe(45);
        expect(res.created_at).toBe('2019-08-06 21:00:00');

        await DB.connection().table('test_json_table_multi').truncate();
    });

    it('Works Update Wrapping Json Path Array Index', async () => {
        await DB.connection()
            .table('test_json_table_multi')
            .insert({
                options: [
                    { '2fa': false, first: true },
                    { '2fa': false, first: false }
                ],
                meta: { tags: [['white'], 'large'] },
                group_id: 10,
                created_at: DB.bindTo.dateTime('2023-03-12 22:00:00')
            });

        const updatedCount = await DB.connection().table('test_json_table_multi').update({
            'options->[1]->2fa': true,
            'meta->tags[0][0]': 'black'
        });

        expect(updatedCount).toBe(1);

        const res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual([
            { '2fa': false, first: true },
            { '2fa': true, first: false }
        ]);
        expect(JSON.parse(res.meta)).toEqual({ tags: [['black'], 'large'] });
        expect(res.group_id).toBe(10);
        expect(res.created_at).toBe('2023-03-12 22:00:00');

        await DB.connection().table('test_json_table_multi').truncate();
    });

    it('Works Update With Json Prepares Bindings Correctly', async () => {
        await DB.connection()
            .table('test_json_table_multi')
            .insert({
                options: { enable: true, size: 10 },
                meta: {},
                group_id: 10,
                created_at: DB.bindTo.dateTime('2023-03-12 22:00:00')
            });

        let updatedCount = await DB.connection()
            .table('test_json_table_multi')
            .update({ 'options->enable': false, created_at: DB.bindTo.dateTime('2015-05-26 22:02:06') });

        expect(updatedCount).toBe(1);

        let res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual({ enable: false, size: 10 });
        expect(JSON.parse(res.meta)).toEqual({});
        expect(res.group_id).toBe(10);
        expect(res.created_at).toBe('2015-05-26 22:02:06');

        updatedCount = await DB.connection()
            .table('test_json_table_multi')
            .update({ 'options->size': BigInt('45'), created_at: DB.bindTo.dateTime('2015-05-26 22:02:08') });

        expect(updatedCount).toBe(1);

        res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual({ enable: false, size: 45 });
        expect(JSON.parse(res.meta)).toEqual({});
        expect(res.group_id).toBe(10);
        expect(res.created_at).toBe('2015-05-26 22:02:08');

        updatedCount = await DB.connection().table('test_json_table_multi').update({ 'options->size': null });

        expect(updatedCount).toBe(1);

        res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual({ enable: false, size: null });
        expect(JSON.parse(res.meta)).toEqual({});
        expect(res.group_id).toBe(10);
        expect(res.created_at).toBe('2015-05-26 22:02:08');

        updatedCount = await DB.connection()
            .table('test_json_table_multi')
            .update({ 'options->size': new Raw('70') });

        expect(updatedCount).toBe(1);

        res = await DB.connection().table('test_json_table_multi').sole<JsonMulti>();

        expect(JSON.parse(res.options)).toEqual({ enable: false, size: 70 });
        expect(JSON.parse(res.meta)).toEqual({});
        expect(res.group_id).toBe(10);
        expect(res.created_at).toBe('2015-05-26 22:02:08');

        await DB.connection().table('test_json_table_multi').truncate();
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
