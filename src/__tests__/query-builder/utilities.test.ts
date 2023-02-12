import BuilderI from '../../types/query/builder';
import { getBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Utilities', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works When Callback', () => {
        const callback = (query: BuilderI, condition: boolean): void => {
            expect(condition).toBeTruthy();
            query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').when(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').when(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works When Callback With Return', () => {
        const callback = (query: BuilderI, condition: boolean): BuilderI => {
            expect(condition).toBeTruthy();
            return query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').when(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').when(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works When Callback With Default', () => {
        const callback = (query: BuilderI, condition: string | number): BuilderI => {
            expect(condition).toBe('truthy');
            return query.where('id', '=', 1);
        };
        const defaultCB = (query: BuilderI, condition: string | number): BuilderI => {
            expect(condition).toBe(0);
            return query.where('id', '=', 2);
        };
        let builder = getBuilder();
        builder.select('*').from('users').when<string>('truthy', callback, defaultCB).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
        builder = getBuilder();
        builder.select('*').from('users').when<number>(0, callback, defaultCB).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([2, 'foo']);
    });

    it('Works Unless Callback', () => {
        const callback = (query: BuilderI, condition: boolean): void => {
            expect(condition).toBeFalsy();
            query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').unless(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').unless(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works Unless Callback With Return', () => {
        const callback = (query: BuilderI, condition: boolean): BuilderI => {
            expect(condition).toBeFalsy();
            return query.where('id', '=', 1);
        };
        let builder = getBuilder();
        builder.select('*').from('users').unless(false, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        builder = getBuilder();
        builder.select('*').from('users').unless(true, callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "email" = ?');
    });

    it('Works Unless Callback With Default', () => {
        const callback = (query: BuilderI, condition: string | number): BuilderI => {
            expect(condition).toBe(0);
            return query.where('id', '=', 1);
        };
        const defaultCB = (query: BuilderI, condition: string | number): BuilderI => {
            expect(condition).toBe('truthy');
            return query.where('id', '=', 2);
        };
        let builder = getBuilder();
        builder.select('*').from('users').unless<number>(0, callback, defaultCB).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
        builder = getBuilder();
        builder.select('*').from('users').unless<string>('truthy', callback, defaultCB).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
        expect(builder.getBindings()).toEqual([2, 'foo']);
    });

    it('Works Tap Callback', () => {
        const callback = (query: BuilderI): void => {
            query.where('id', '=', 1);
        };
        const builder = getBuilder();
        builder.select('*').from('users').tap(callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    });
});
