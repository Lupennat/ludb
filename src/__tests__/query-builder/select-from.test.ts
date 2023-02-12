import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Raw from '../../query/expression';
import { getBuilder, getMySqlBuilder, getMySqlBuilderWithProcessor, getPostgresBuilder, pdo } from '../fixtures/mocked';
describe('Query Builder Select-From', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Basic Select', () => {
        const builder = getBuilder();
        builder.select('*').from('users');
        expect(builder.toSql()).toBe('select * from "users"');
    });

    it('Works Basic Select With Get Columns', async () => {
        const builder = getBuilder();
        const spyProcess = jest.spyOn(builder.getProcessor(), 'processSelect');
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async <T = Dictionary>(sql: string): Promise<T[]> => {
                expect('select * from "users"').toBe(sql);
                return [];
            })
            .mockImplementationOnce(async <T = Dictionary>(sql: string): Promise<T[]> => {
                expect('select "foo", "bar" from "users"').toBe(sql);
                return [];
            })
            .mockImplementationOnce(async <T = Dictionary>(sql: string): Promise<T[]> => {
                expect('select "baz" from "users"').toBe(sql);
                return [];
            });

        await builder.from('users').get();
        expect(builder.getRegistry().columns).toBeNull();

        await builder.from('users').get(['foo', 'bar']);
        expect(builder.getRegistry().columns).toBeNull();

        await builder.from('users').get('baz');
        expect(builder.getRegistry().columns).toBeNull();

        expect('select * from "users"').toBe(builder.toSql());
        expect(builder.getRegistry().columns).toBeNull();

        expect(spyProcess).toBeCalledTimes(3);
    });

    it('Works Basic Select User Write Pdo', async () => {
        let builder = getMySqlBuilderWithProcessor();
        let spyConnection = jest.spyOn(builder.getConnection(), 'select');

        await builder.useWritePdo().select('*').from('users').get();
        expect(spyConnection).toBeCalledWith('select * from `users`', [], false);

        builder = getMySqlBuilderWithProcessor();
        spyConnection = jest.spyOn(builder.getConnection(), 'select');

        await builder.select('*').from('users').get();
        expect(spyConnection).toBeCalledWith('select * from `users`', [], true);
    });

    it('Works Basic Table Wrapping Protects Quotation Marks', () => {
        const builder = getBuilder();
        builder.select('*').from('some"table');
        expect(builder.toSql()).toBe('select * from "some""table"');
    });

    it('Works Alias Wrapping As Whole Constant', () => {
        const builder = getBuilder();
        builder.select('x.y as foo.bar').from('baz');
        expect(builder.toSql()).toBe('select "x"."y" as "foo.bar" from "baz"');
    });

    it('Works Alias Wrapping With Spaces In Database Name', () => {
        const builder = getBuilder();
        builder.select('w x.y.z as foo.bar').from('baz');
        expect(builder.toSql()).toBe('select "w x"."y"."z" as "foo.bar" from "baz"');
    });

    it('Works Adding Selects', () => {
        const builder = getBuilder();
        builder.select('foo').addSelect('bar').addSelect(['baz', 'boom']).from('users');
        expect(builder.toSql()).toBe('select "foo", "bar", "baz", "boom" from "users"');
    });

    it('Works Basic Select With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('users');
        expect(builder.toSql()).toBe('select * from "prefix_users"');
    });

    it('Works Basic Select Distinct', () => {
        const builder = getBuilder();
        builder.distinct().select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
    });

    it('Works Basic Select Distinct On Columns', () => {
        let builder = getBuilder();
        builder.distinct('foo').select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
        builder = getPostgresBuilder();
        builder.distinct('foo').select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct on ("foo") "foo", "bar" from "users"');
    });

    it('Works Basic Alias', () => {
        const builder = getBuilder();
        builder.select('foo as bar').from('users');
        expect(builder.toSql()).toBe('select "foo" as "bar" from "users"');
    });

    it('Works Alias With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('users as people');
        expect(builder.toSql()).toBe('select * from "prefix_users" as "prefix_people"');
    });

    it('Works Join Aliases With Prefix', () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('services').join('translations AS t', 't.item_id', '=', 'services.id');
        expect(builder.toSql()).toBe(
            'select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"'
        );
    });

    it('Works Basic Table Wrapping', () => {
        const builder = getBuilder();
        builder.select('*').from('public.users');
        expect(builder.toSql()).toBe('select * from "public"."users"');
    });

    it('Works Mysql Wrapping Protectets Quotation Marks', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('some`table');
        expect(builder.toSql()).toBe('select * from `some``table`');
    });

    it('Works Full Sub Selects', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('email', '=', 'foo')
            .orWhere('id', '=', query => {
                query.select(new Raw('max(id)')).from('users').where('email', '=', 'bar');
            });

        expect(
            'select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)'
        ).toBe(builder.toSql());
        expect(['foo', 'bar']).toEqual(builder.getBindings());
    });

    it('Works Raw Expressions In Select', () => {
        const builder = getBuilder();
        builder.select(new Raw('substr(foo, 6)')).from('users');
        expect('select substr(foo, 6) from "users"').toBe(builder.toSql());
    });
});
