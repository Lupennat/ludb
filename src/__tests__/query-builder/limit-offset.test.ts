import { getBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Joins', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Limits And Offsets', () => {
        let builder = getBuilder();
        builder.select('*').from('users').offset(5).limit(10);
        expect('select * from "users" limit 10 offset 5').toBe(builder.toSql());

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
});
