import Raw from '../../../query/expression';
import { getBuilder, pdo } from '../fixtures/mocked';

describe('QueryBuilder Joins', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Limits And Offsets', () => {
        let builder = getBuilder();
        builder.select('*').from('users').offset(5).limit(10);
        expect('select * from "users" limit 10 offset 5').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').offset(null).limit(null);
        expect('select * from "users" offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').offset().limit();
        expect('select * from "users" offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').limit(null);
        expect('select * from "users"').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').limit(0);
        expect('select * from "users" limit 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').skip(5).take(10);
        expect('select * from "users" limit 10 offset 5').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').skip().take();
        expect('select * from "users" offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').skip(0).take(0);
        expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').skip(-5).take(-10);
        expect('select * from "users" offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').skip(null).take(null);
        expect('select * from "users" offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').skip(5).take(null);
        expect('select * from "users" offset 5').toBe(builder.toSql());
    });

    it('Works For Page', () => {
        let builder = getBuilder();
        builder.select('*').from('users').forPage(2, 15);
        expect('select * from "users" limit 15 offset 15').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').forPage(2);
        expect('select * from "users" limit 15 offset 15').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').forPage(0, 15);
        expect('select * from "users" limit 15 offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').forPage(-2, 15);
        expect('select * from "users" limit 15 offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').forPage(2, 0);
        expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').forPage(0, 0);
        expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').forPage(-2, 0);
        expect('select * from "users" limit 0 offset 0').toBe(builder.toSql());
    });

    it('Works For Page Before Id', () => {
        let builder = getBuilder();
        builder.select('*').from('users').forPageBeforeId();
        expect('select * from "users" where "id" < ? order by "id" desc limit 15').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').forPageBeforeId(10);
        expect('select * from "users" where "id" < ? order by "id" desc limit 10').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').forPageBeforeId(10, 2);
        expect('select * from "users" where "id" < ? order by "id" desc limit 10').toBe(builder.toSql());
        expect([2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').orderBy('id', 'asc').forPageBeforeId(10, 2, 'id');
        expect('select * from "users" where "id" < ? order by "id" desc limit 10').toBe(builder.toSql());
        expect([2]).toEqual(builder.getBindings());
    });

    it('Works For Page After Id', () => {
        let builder = getBuilder();
        builder.select('*').from('users').forPageAfterId();
        expect('select * from "users" where "id" > ? order by "id" asc limit 15').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').forPageAfterId(10);
        expect('select * from "users" where "id" > ? order by "id" asc limit 10').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').forPageAfterId(10, 2);
        expect('select * from "users" where "id" > ? order by "id" asc limit 10').toBe(builder.toSql());
        expect([2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').orderBy(new Raw('id'), 'desc').forPageAfterId(10, 2, 'id');
        expect('select * from "users" where "id" > ? order by "id" asc limit 10').toBe(builder.toSql());
        expect([2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').orderByRaw('name desc').forPageAfterId(10, 2, 'id');
        expect('select * from "users" where "id" > ? order by name desc, "id" asc limit 10').toBe(builder.toSql());
        expect([2]).toEqual(builder.getBindings());
    });
});
