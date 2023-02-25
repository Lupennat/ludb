import Raw from '../../query/expression';
import BuilderI from '../../types/query/builder';
import { WhereBasic } from '../../types/query/registry';
import {
    ObjectArrayable,
    getBuilder,
    getMySqlBuilder,
    getMySqlBuilderWithProcessor,
    getPostgresBuilder,
    getPostgresBuilderWithProcessor,
    getSQLiteBuilder,
    getSqlServerBuilder,
    pdo
} from '../fixtures/mocked';

describe('Query Builder Wheres', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Basic Where', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ?');
        expect(builder.getBindings()).toEqual([1]);

        builder = getBuilder();
        expect(() => {
            builder.select('*').from('users').where('id', '>', null);
        }).toThrowError('Illegal operator and value combination.');
    });

    it('Works Where With Queryables', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where(
                query => {
                    query.from('two').select('baz').where('subkey', '=', 'subval');
                },
                '=',
                'test'
            );
        expect(builder.toSql()).toBe('select * from "users" where (select "baz" from "two" where "subkey" = ?) = ?');
        expect(builder.getBindings()).toEqual(['subval', 'test']);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNot('id', '=', query => {
                query.from('two').select('baz').where('subkey', '=', 'subval');
            });
        expect(builder.toSql()).toBe(
            'select * from "users" where not "id" = (select "baz" from "two" where "subkey" = ?)'
        );
        expect(builder.getBindings()).toEqual(['subval']);

        builder = getBuilder();
        expect(() => {
            builder
                .select('*')
                .from('users')
                .where(
                    query => {
                        query.from('one').select('baz').where('subkey', '=', 'subval');
                    },
                    '=',
                    query => {
                        query.from('two').select('baz').where('subkey', '=', 'subval');
                    }
                );
        }).toThrowError('Value Cannot be a closure when column is instance of Query Builder or closure.');
    });

    it('Works Basic Where Not', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereNot('name', 'foo').whereNot('name', '<>', 'bar');
        expect(builder.toSql()).toBe('select * from "users" where not "name" = ? and not "name" <> ?');
        expect(builder.getBindings()).toEqual(['foo', 'bar']);
    });

    it('Works Date Base Wheres Accepts Two Arguments', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereDate('created_at', '2023-02-10');
        expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDate('created_at', new Date('2023-02-10'));
        expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['2023-02-10']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDateNot('created_at', new Date('2023-02-10'));
        expect(builder.toSql()).toBe('select * from `users` where not date(`created_at`) = ?');

        builder = getMySqlBuilder();
        // @ts-expect-error test wrong array will be flatted
        builder.select('*').from('users').whereDate('created_at', [1, 2]);
        expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = ?');
        expect(builder.getBindings()).toEqual([1]);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDay('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDay('created_at', new Date('2023-01-03'));
        expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['03']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDayNot('created_at', new Date('2023-01-03'));
        expect(builder.toSql()).toBe('select * from `users` where not day(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['03']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDay('created_at', 'aa');
        expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['00']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonth('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonth('created_at', new Date('2023-01-03'));
        expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['01']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonthNot('created_at', new Date('2023-01-03'));
        expect(builder.toSql()).toBe('select * from `users` where not month(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['01']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonth('created_at', 'aa');
        expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['00']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereYear('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereYear('created_at', new Date('2023-01-03'));
        expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['2023']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereYearNot('created_at', new Date('2023-01-03'));
        expect(builder.toSql()).toBe('select * from `users` where not year(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['2023']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereYear('created_at', 'aa');
        expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['0000']);
    });

    it('Works Date Base Or Wheres Accepts Two Arguments', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereDate('created_at', '2023-02-10');
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or date(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereDateNot('created_at', '2023-02-10');
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or not date(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereDay('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or day(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereDayNot('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or not day(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereMonth('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or month(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereMonthNot('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or not month(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereYear('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or year(`created_at`) = ?');

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', 1).orWhereYearNot('created_at', 1);
        expect(builder.toSql()).toBe('select * from `users` where `id` = ? or not year(`created_at`) = ?');
    });

    it('Works Date Base Wheres Expression Is Not Bound', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereDate('created_at', new Raw('NOW()')).where('admin', true);
        expect(builder.getBindings()).toEqual([true]);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDay('created_at', new Raw('NOW()'));
        expect(builder.getBindings()).toEqual([]);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonth('created_at', new Raw('NOW()'));
        expect(builder.getBindings()).toEqual([]);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereYear('created_at', new Raw('NOW()'));
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Where Date MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', '2015-12-21');
        expect(builder.getBindings()).toEqual(['2015-12-21']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', new Raw('NOW()'));
        expect(builder.toSql()).toBe('select * from `users` where date(`created_at`) = NOW()');
    });

    it('Works Where Date Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', '2015-12-21');
        expect(builder.toSql()).toBe('select * from "users" where "created_at"::date = ?');
        expect(builder.getBindings()).toEqual(['2015-12-21']);

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', new Raw('NOW()'));
        expect(builder.toSql()).toBe('select * from "users" where "created_at"::date = NOW()');
    });

    it('Works Where Date Sqlite', () => {
        let builder = getSQLiteBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', '2015-12-21');
        expect(builder.toSql()).toBe(
            'select * from "users" where strftime(\'%Y-%m-%d\', "created_at") = cast(? as text)'
        );
        expect(builder.getBindings()).toEqual(['2015-12-21']);

        builder = getSQLiteBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', new Raw('NOW()'));
        expect(builder.toSql()).toBe(
            'select * from "users" where strftime(\'%Y-%m-%d\', "created_at") = cast(NOW() as text)'
        );
    });

    it('Works Where Date SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', '2015-12-21');
        expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as date) = ?');
        expect(builder.getBindings()).toEqual(['2015-12-21']);

        builder = getSqlServerBuilder();
        builder.select('*').from('users').whereDate('created_at', '=', new Raw('NOW()'));
        expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as date) = NOW()');
    });

    it('Works Where Day MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1);
        expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['01']);
    });

    it('Works Where Day Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1);
        expect(builder.toSql()).toBe('select * from "users" where extract(day from "created_at") = ?');
        expect(builder.getBindings()).toEqual(['01']);
    });

    it('Works Where Day Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1);
        expect(builder.toSql()).toBe('select * from "users" where strftime(\'%d\', "created_at") = cast(? as text)');
        expect(builder.getBindings()).toEqual(['01']);
    });

    it('Works Where Day SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1);
        expect(builder.toSql()).toBe('select * from [users] where day([created_at]) = ?');
        expect(builder.getBindings()).toEqual(['01']);
    });

    it('Works Or Where Day MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
        expect(builder.toSql()).toBe('select * from `users` where day(`created_at`) = ? or day(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['01', '02']);
    });

    it('Works Or Where Day Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
        expect(builder.toSql()).toBe(
            'select * from "users" where extract(day from "created_at") = ? or extract(day from "created_at") = ?'
        );
        expect(builder.getBindings()).toEqual(['01', '02']);
    });

    it('Works Or Where Day SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').whereDay('created_at', '=', 1).orWhereDay('created_at', '=', 2);
        expect(builder.toSql()).toBe('select * from [users] where day([created_at]) = ? or day([created_at]) = ?');
        expect(builder.getBindings()).toEqual(['01', '02']);
    });

    it('Works Where Month MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5);
        expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['05']);
    });

    it('Works Where Month Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5);
        expect(builder.toSql()).toBe('select * from "users" where extract(month from "created_at") = ?');
        expect(builder.getBindings()).toEqual(['05']);
    });

    it('Works Where Month Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5);
        expect(builder.toSql()).toBe('select * from "users" where strftime(\'%m\', "created_at") = cast(? as text)');
        expect(builder.getBindings()).toEqual(['05']);
    });

    it('Works Where Month SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5);
        expect(builder.toSql()).toBe('select * from [users] where month([created_at]) = ?');
        expect(builder.getBindings()).toEqual(['05']);
    });

    it('Works Or Where Month MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
        expect(builder.toSql()).toBe('select * from `users` where month(`created_at`) = ? or month(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['05', '06']);
    });

    it('Works Or Where Month Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
        expect(builder.toSql()).toBe(
            'select * from "users" where extract(month from "created_at") = ? or extract(month from "created_at") = ?'
        );
        expect(builder.getBindings()).toEqual(['05', '06']);
    });

    it('Works Or Where Month SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').whereMonth('created_at', '=', 5).orWhereMonth('created_at', '=', 6);
        expect(builder.toSql()).toBe('select * from [users] where month([created_at]) = ? or month([created_at]) = ?');
        expect(builder.getBindings()).toEqual(['05', '06']);
    });

    it('Works Where Year MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014);
        expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['2014']);
    });

    it('Works Where Year Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014);
        expect(builder.toSql()).toBe('select * from "users" where extract(year from "created_at") = ?');
        expect(builder.getBindings()).toEqual(['2014']);
    });

    it('Works Where Year Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014);
        expect(builder.toSql()).toBe('select * from "users" where strftime(\'%Y\', "created_at") = cast(? as text)');
        expect(builder.getBindings()).toEqual(['2014']);
    });

    it('Works Where Year SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014);
        expect(builder.toSql()).toBe('select * from [users] where year([created_at]) = ?');
        expect(builder.getBindings()).toEqual(['2014']);
    });

    it('Works Or Where Year MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
        expect(builder.toSql()).toBe('select * from `users` where year(`created_at`) = ? or year(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['2014', '2015']);
    });

    it('Works Or Where Year Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
        expect(builder.toSql()).toBe(
            'select * from "users" where extract(year from "created_at") = ? or extract(year from "created_at") = ?'
        );
        expect(builder.getBindings()).toEqual(['2014', '2015']);
    });

    it('Works Or Where Year SqlServer', () => {
        const builder = getSqlServerBuilder();
        builder.select('*').from('users').whereYear('created_at', '=', 2014).orWhereYear('created_at', '=', 2015);
        expect(builder.toSql()).toBe('select * from [users] where year([created_at]) = ? or year([created_at]) = ?');
        expect(builder.getBindings()).toEqual(['2014', '2015']);
    });

    it('Works Where Time MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereTime('created_at', '>=', '22:00');
        expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) >= ?');
        expect(builder.getBindings()).toEqual(['22:00']);

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereTime('created_at', '>=', new Date('2023-02-12 22:00:00'));
        expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) >= ?');
        expect(builder.getBindings()).toEqual(['22:00:00']);
    });

    it('Works Where Time Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereTime('created_at', '>=', '22:00');
        expect(builder.toSql()).toBe('select * from "users" where "created_at"::time >= ?');
        expect(builder.getBindings()).toEqual(['22:00']);
    });

    it('Works Where Time Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('*').from('users').whereTime('created_at', '>=', '22:00');
        expect(builder.toSql()).toBe(
            'select * from "users" where strftime(\'%H:%M:%S\', "created_at") >= cast(? as text)'
        );
        expect(builder.getBindings()).toEqual(['22:00']);
    });

    it('Works Where Time SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereTime('created_at', '22:00');
        expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as time) = ?');
        expect(builder.getBindings()).toEqual(['22:00']);

        builder = getSqlServerBuilder();
        builder.select('*').from('users').whereTime('created_at', new Raw('NOW()'));
        expect(builder.toSql()).toBe('select * from [users] where cast([created_at] as time) = NOW()');
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Where Time Operator Optional MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereTime('created_at', '22:00');
        expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['22:00']);
    });

    it('Works Where Time Operator Optional Postgres', () => {
        const builder = getPostgresBuilder();
        builder.select('*').from('users').whereTime('created_at', '22:00');
        expect(builder.toSql()).toBe('select * from "users" where "created_at"::time = ?');
        expect(builder.getBindings()).toEqual(['22:00']);
    });

    it('Works Where Time Operator Optional Sqlite', () => {
        const builder = getSQLiteBuilder();
        builder.select('*').from('users').whereTime('created_at', '22:00');
        expect(builder.toSql()).toBe(
            'select * from "users" where strftime(\'%H:%M:%S\', "created_at") = cast(? as text)'
        );
        expect(builder.getBindings()).toEqual(['22:00']);
    });

    it('Works Or Where Time MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereTime('created_at', '<=', '10:00').orWhereTime('created_at', '22:00');
        expect(builder.toSql()).toBe('select * from `users` where time(`created_at`) <= ? or time(`created_at`) = ?');
        expect(builder.getBindings()).toEqual(['10:00', '22:00']);

        builder = getMySqlBuilder();
        builder
            .select('*')
            .from('users')
            .whereTimeNot('created_at', '<=', '10:00')
            .whereTimeNot('updated_at', '10:00')
            .orWhereTimeNot('created_at', '22:00');
        expect(builder.toSql()).toBe(
            'select * from `users` where not time(`created_at`) <= ? and not time(`updated_at`) = ? or not time(`created_at`) = ?'
        );
        expect(builder.getBindings()).toEqual(['10:00', '10:00', '22:00']);
    });

    it('Works Or Where Time Postgres', () => {
        const builder = getPostgresBuilder();
        builder
            .select('*')
            .from('users')
            .whereTime('created_at', '<=', '10:00')
            .orWhereTime('created_at', '>=', '22:00');
        expect(builder.toSql()).toBe('select * from "users" where "created_at"::time <= ? or "created_at"::time >= ?');
        expect(builder.getBindings()).toEqual(['10:00', '22:00']);
    });

    it('Works Or Where Time SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder
            .select('*')
            .from('users')
            .whereTime('created_at', '<=', '10:00')
            .orWhereTime('created_at', '>=', '22:00');
        expect(builder.toSql()).toBe(
            'select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) >= ?'
        );
        expect(builder.getBindings()).toEqual(['10:00', '22:00']);

        builder = getSqlServerBuilder();
        builder
            .select('*')
            .from('users')
            .whereTime('created_at', '<=', '10:00')
            .orWhereTime('created_at', '>=', new Raw('NOW()'));
        expect(builder.toSql()).toBe(
            'select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) >= NOW()'
        );
        expect(builder.getBindings()).toEqual(['10:00']);
    });

    it('Works Where Nested', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNested(query => {
                query.where('created_at', '>=', '22:00').orWhere('created_at', '<=', '10:00');
            });
        expect(builder.toSql()).toBe('select * from "users" where ("created_at" >= ? or "created_at" <= ?)');
        expect(builder.getBindings()).toEqual(['22:00', '10:00']);
    });

    it('Works Add Nested Where Query', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .addNestedWhereQuery(getBuilder().where('created_at', '>=', '23:00').orWhere('created_at', '<=', '10:00'));
        expect(builder.toSql()).toBe('select * from "users" where ("created_at" >= ? or "created_at" <= ?)');
        expect(builder.getBindings()).toEqual(['23:00', '10:00']);
    });

    it('Works Where Betweens', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereBetween('id', [1, 2]);
        expect(builder.toSql()).toBe('select * from "users" where "id" between ? and ?');
        expect(builder.getBindings()).toEqual([1, 2]);

        builder = getBuilder();
        builder.select('*').from('users').whereNotBetween('id', [1, 2]);
        expect(builder.toSql()).toBe('select * from "users" where "id" not between ? and ?');
        expect(builder.getBindings()).toEqual([1, 2]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereBetween('id', [new Raw(1), new Raw(2)]);
        expect(builder.toSql()).toBe('select * from "users" where "id" between 1 and 2');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereBetween('id', new ObjectArrayable([1, 2]));
        expect(builder.toSql()).toBe('select * from "users" where "id" between ? and ?');
        expect(builder.getBindings()).toEqual([1, 2]);
    });

    it('Works Or Where Betweens', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereBetween('id', [3, 5]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between ? and ?');
        expect(builder.getBindings()).toEqual([1, 3, 5]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereNotBetween('id', [3, 5]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not between ? and ?');
        expect(builder.getBindings()).toEqual([1, 3, 5]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereBetween('id', [new Raw(3), new Raw(4)]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between 3 and 4');
        expect(builder.getBindings()).toEqual([1]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereBetween('id', new ObjectArrayable([3, 4]));
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between ? and ?');
        expect(builder.getBindings()).toEqual([1, 3, 4]);
    });

    it('Works Where Between Columns', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereBetweenColumns('id', ['users.created_at', 'users.updated_at']);
        expect(builder.toSql()).toBe(
            'select * from "users" where "id" between "users"."created_at" and "users"."updated_at"'
        );
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder.select('*').from('users').whereNotBetweenColumns('id', ['users.created_at', 'users.updated_at']);
        expect(builder.toSql()).toBe(
            'select * from "users" where "id" not between "users"."created_at" and "users"."updated_at"'
        );
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereBetweenColumns('id', [new Raw(1), new Raw(2)]);
        expect(builder.toSql()).toBe('select * from "users" where "id" between 1 and 2');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereBetweenColumns('id', new ObjectArrayable(['users.created_at', 'users.updated_at']));
        expect(builder.toSql()).toBe(
            'select * from "users" where "id" between "users"."created_at" and "users"."updated_at"'
        );
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Where Or Between Columns', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', 2)
            .orWhereBetweenColumns('id', ['users.created_at', 'users.updated_at']);
        expect(builder.toSql()).toBe(
            'select * from "users" where "id" = ? or "id" between "users"."created_at" and "users"."updated_at"'
        );
        expect(builder.getBindings()).toEqual([2]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', 2)
            .orWhereNotBetweenColumns('id', ['users.created_at', 'users.updated_at']);
        expect(builder.toSql()).toBe(
            'select * from "users" where "id" = ? or "id" not between "users"."created_at" and "users"."updated_at"'
        );
        expect(builder.getBindings()).toEqual([2]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', 2)
            .orWhereBetweenColumns('id', [new Raw(1), new Raw(2)]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" between 1 and 2');
        expect(builder.getBindings()).toEqual([2]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', 2)
            .orWhereBetweenColumns('id', new ObjectArrayable(['users.created_at', 'users.updated_at']));
        expect(builder.toSql()).toBe(
            'select * from "users" where "id" = ? or "id" between "users"."created_at" and "users"."updated_at"'
        );
        expect(builder.getBindings()).toEqual([2]);
    });

    it('Works Basic Or Wheres', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhere('email', '=', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "email" = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
    });

    it('Works Basic Or Where Not', () => {
        const builder = getBuilder();
        builder.select('*').from('users').orWhereNot('name', 'foo').orWhereNot('name', '<>', 'bar');
        expect(builder.toSql()).toBe('select * from "users" where not "name" = ? or not "name" <> ?');
        expect(builder.getBindings()).toEqual(['foo', 'bar']);
    });

    it('Works Raw Wheres', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereRaw('id = ? or email = ?', [1, 'foo']);
        expect(builder.toSql()).toBe('select * from "users" where id = ? or email = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
    });

    it('Works Raw Or Wheres', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereRaw('email = ?', ['foo']);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or email = ?');
        expect(builder.getBindings()).toEqual([1, 'foo']);
    });

    it('Works Basic Where Ins', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereIn('id', [1, 2, 3]);
        expect(builder.toSql()).toBe('select * from "users" where "id" in (?, ?, ?)');
        expect(builder.getBindings()).toEqual([1, 2, 3]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereIn('id', new ObjectArrayable([1, 2, 3]));
        expect(builder.toSql()).toBe('select * from "users" where "id" in (?, ?, ?)');
        expect(builder.getBindings()).toEqual([1, 2, 3]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereIn('id', [1, 2, 3]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" in (?, ?, ?)');
        expect(builder.getBindings()).toEqual([1, 1, 2, 3]);

        builder = getBuilder();
        expect(() => {
            builder
                .select('*')
                .from('users')
                .where('id', '=', 1)
                // @ts-expect-error test wrong parameter
                .orWhereIn('id', [1, [1, 2, 3]]);
        }).toThrowError('Nested arrays may not be passed to whereIn method.');
    });

    it('Works Basic Where Not Ins', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereIn('id', [1, 2, 3]);
        expect(builder.toSql()).toBe('select * from "users" where "id" in (?, ?, ?)');
        expect(builder.getBindings()).toEqual([1, 2, 3]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNotIn('id', new ObjectArrayable([1, 2, 3]));
        expect(builder.toSql()).toBe('select * from "users" where "id" not in (?, ?, ?)');
        expect(builder.getBindings()).toEqual([1, 2, 3]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereNotIn('id', [1, 2, 3]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not in (?, ?, ?)');
        expect(builder.getBindings()).toEqual([1, 1, 2, 3]);
    });

    it('Works Raw Where Ins', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereIn('id', [new Raw(1)]);
        expect(builder.toSql()).toBe('select * from "users" where "id" in (1)');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereIn('id', [new Raw(1)]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" in (1)');
        expect(builder.getBindings()).toEqual([1]);
    });

    it('Works Empty Raw Ins', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereIn('id', []);
        expect(builder.toSql()).toBe('select * from "users" where 0 = 1');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereIn('id', new ObjectArrayable([]));
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or 0 = 1');
        expect(builder.getBindings()).toEqual([1]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereIn('id', []);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or 0 = 1');
        expect(builder.getBindings()).toEqual([1]);
    });

    it('Works Empty Raw Not Ins', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereNotIn('id', []);
        expect(builder.toSql()).toBe('select * from "users" where 1 = 1');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereNotIn('id', new ObjectArrayable([]));
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or 1 = 1');
        expect(builder.getBindings()).toEqual([1]);

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereNotIn('id', []);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or 1 = 1');
        expect(builder.getBindings()).toEqual([1]);
    });

    it('Works Where Integer In Raw', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereIntegerInRaw('id', ['1', BigInt(2), 3, '0x1f', '0b11', '0o12', 'a']);
        expect(builder.toSql()).toBe('select * from "users" where "id" in (1, 2, 3, 31, 3, 10, 0)');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereIntegerInRaw('id', new ObjectArrayable(['1', BigInt(2), 3, '0x1f', '0b11', '0o12', 'a']));
        expect(builder.toSql()).toBe('select * from "users" where "id" in (1, 2, 3, 31, 3, 10, 0)');
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Or Where Integer In Raw', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereIntegerInRaw('id', ['1', 2]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" in (1, 2)');
        expect(builder.getBindings()).toEqual([1]);
    });

    it('Works Where Integer Not In Raw', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereIntegerNotInRaw('id', ['1', 2]);
        expect(builder.toSql()).toBe('select * from "users" where "id" not in (1, 2)');
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Or Where Integer Not In Raw', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereIntegerNotInRaw('id', ['1', 2]);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? or "id" not in (1, 2)');
        expect(builder.getBindings()).toEqual([1]);
    });

    it('Works Empty Where Integer In Raw', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereIntegerInRaw('id', []);
        expect(builder.toSql()).toBe('select * from "users" where 0 = 1');
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Empty Where Integer Not In Raw', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereIntegerNotInRaw('id', []);
        expect(builder.toSql()).toBe('select * from "users" where 1 = 1');
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Basic Where Column', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereColumn('first_name', 'last_name')
            .orWhereColumn('first_name', 'middle_name');
        expect(builder.toSql()).toBe(
            'select * from "users" where "first_name" = "last_name" or "first_name" = "middle_name"'
        );
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder.select('*').from('users').whereColumn('updated_at', '>', 'created_at');
        expect(builder.toSql()).toBe('select * from "users" where "updated_at" > "created_at"');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        expect(() => {
            builder.select('*').from('users').whereColumn('updated_at', '=');
        }).toThrowError('Second Parameter must be string or Expression.');
    });

    it('Works Array Where Column', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereColumn([['first_name', 'last_name']])
            .orWhereColumn([['updated_at', '>', 'created_at']]);
        expect(builder.toSql()).toBe(
            'select * from "users" where ("first_name" = "last_name") or ("updated_at" > "created_at")'
        );
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Basic Where Column Not', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereColumnNot('first_name', 'last_name')
            .orWhereColumnNot('first_name', 'middle_name');
        expect(builder.toSql()).toBe(
            'select * from "users" where not "first_name" = "last_name" or not "first_name" = "middle_name"'
        );
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        builder.select('*').from('users').whereColumnNot('updated_at', '>', 'created_at');
        expect(builder.toSql()).toBe('select * from "users" where not "updated_at" > "created_at"');
        expect(builder.getBindings()).toEqual([]);

        builder = getBuilder();
        expect(() => {
            builder.select('*').from('users').whereColumnNot('updated_at', '=');
        }).toThrowError('Second Parameter must be string or Expression.');
    });

    it('Works Array Where Column Noy', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereColumnNot([['first_name', 'last_name']])
            .orWhereColumnNot([['updated_at', '>', 'created_at']]);
        expect(builder.toSql()).toBe(
            'select * from "users" where not ("first_name" = "last_name") or not ("updated_at" > "created_at")'
        );
        expect(builder.getBindings()).toEqual([]);
    });

    it('Works Where Fulltext', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereFulltext('body', 'Hello World');
        expect(() => {
            builder.toSql();
        }).toThrowError('This database engine does not support fulltext search operations.');
    });

    it('Works Where Fulltext MySql', () => {
        let builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World');
        expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in natural language mode)');
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltextNot('body', 'Hello World');
        expect(builder.toSql()).toBe(
            'select * from `users` where not match (`body`) against (? in natural language mode)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').where('name', 'Claudio').orWhereFulltext('body', 'Hello World');
        expect(builder.toSql()).toBe(
            'select * from `users` where `name` = ? or match (`body`) against (? in natural language mode)'
        );
        expect(builder.getBindings()).toEqual(['Claudio', 'Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').where('name', 'Claudio').orWhereFulltextNot('body', 'Hello World');
        expect(builder.toSql()).toBe(
            'select * from `users` where `name` = ? or not match (`body`) against (? in natural language mode)'
        );
        expect(builder.getBindings()).toEqual(['Claudio', 'Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World', { expanded: true });
        expect(builder.toSql()).toBe(
            'select * from `users` where match (`body`) against (? in natural language mode with query expansion)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltextNot('body', 'Hello World', { expanded: true });
        expect(builder.toSql()).toBe(
            'select * from `users` where not match (`body`) against (? in natural language mode with query expansion)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder
            .select('*')
            .from('users')
            .where('name', 'Claudio')
            .orWhereFulltext('body', 'Hello World', { expanded: true });
        expect(builder.toSql()).toBe(
            'select * from `users` where `name` = ? or match (`body`) against (? in natural language mode with query expansion)'
        );
        expect(builder.getBindings()).toEqual(['Claudio', 'Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder
            .select('*')
            .from('users')
            .where('name', 'Claudio')
            .orWhereFulltextNot('body', 'Hello World', { expanded: true });
        expect(builder.toSql()).toBe(
            'select * from `users` where `name` = ? or not match (`body`) against (? in natural language mode with query expansion)'
        );
        expect(builder.getBindings()).toEqual(['Claudio', 'Hello World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', '+Hello -World', { mode: 'boolean' });
        expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in boolean mode)');
        expect(builder.getBindings()).toEqual(['+Hello -World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', '+Hello -World', { mode: 'boolean', expanded: true });
        expect(builder.toSql()).toBe('select * from `users` where match (`body`) against (? in boolean mode)');
        expect(builder.getBindings()).toEqual(['+Hello -World']);

        builder = getMySqlBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext(['body', 'title'], 'Car,Plane');
        expect(builder.toSql()).toBe(
            'select * from `users` where match (`body`, `title`) against (? in natural language mode)'
        );
        expect(builder.getBindings()).toEqual(['Car,Plane']);
    });

    it('Works Where Fulltext Postgres', () => {
        let builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World');
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World', { language: 'simple' });
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'simple\', "body")) @@ plainto_tsquery(\'simple\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World', { mode: 'plain' });
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World', { mode: 'phrase' });
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'english\', "body")) @@ phraseto_tsquery(\'english\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World', { mode: 'websearch' });
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'english\', "body")) @@ websearch_to_tsquery(\'english\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext('body', 'Hello World', { language: 'notexist', mode: 'plain' });
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'english\', "body")) @@ plainto_tsquery(\'english\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Hello World']);

        builder = getPostgresBuilderWithProcessor();
        builder.select('*').from('users').whereFulltext(['body', 'title'], 'Car,Plane');
        expect(builder.toSql()).toBe(
            'select * from "users" where (to_tsvector(\'english\', "body") || to_tsvector(\'english\', "title")) @@ plainto_tsquery(\'english\', ?)'
        );
        expect(builder.getBindings()).toEqual(['Car,Plane']);
    });

    it('Works Where Like Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', 'like', '1');
        expect('select * from "users" where "id"::text like ?').toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', 'LIKE', '1');
        expect('select * from "users" where "id"::text LIKE ?').toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', 'ilike', '1');
        expect('select * from "users" where "id"::text ilike ?').toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', 'not like', '1');
        expect('select * from "users" where "id"::text not like ?').toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', 'not ilike', '1');
        expect('select * from "users" where "id"::text not ilike ?').toBe(builder.toSql());
        expect(['1']).toEqual(builder.getBindings());
    });

    it('Works Sub Select Where Ins', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereIn('id', (query: BuilderI): void => {
                query.select('id').from('users').where('age', '>', 25).take(3);
            });
        expect('select * from "users" where "id" in (select "id" from "users" where "age" > ? limit 3)').toBe(
            builder.toSql()
        );
        expect([25]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNotIn('id', (query: BuilderI): void => {
                query.select('id').from('users').where('age', '>', 25).take(3);
            });
        expect('select * from "users" where "id" not in (select "id" from "users" where "age" > ? limit 3)').toBe(
            builder.toSql()
        );
        expect([25]).toEqual(builder.getBindings());
    });

    it('Works Basic Where Nulls', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereNull('id');
        expect('select * from "users" where "id" is null').toBe(builder.toSql());
        expect([]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereNull('id');
        expect('select * from "users" where "id" = ? or "id" is null').toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Json Where Null MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereNull('items->id');
        expect(
            "select * from `users` where (json_extract(`items`, '$.\"id\"') is null OR json_type(json_extract(`items`, '$.\"id\"')) = 'NULL')"
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereNull('id');
        expect('select * from `users` where `id` is null').toBe(builder.toSql());
    });

    it('Works Json Where Not Null MySql', () => {
        const builder = getMySqlBuilder();
        builder.select('*').from('users').whereNotNull('items->id');
        expect(
            "select * from `users` where (json_extract(`items`, '$.\"id\"') is not null AND json_type(json_extract(`items`, '$.\"id\"')) != 'NULL')"
        ).toBe(builder.toSql());
    });

    it('Works Array Where Nulls', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereNull(['id', 'expires_at']);
        expect('select * from "users" where "id" is null and "expires_at" is null').toBe(builder.toSql());
        expect([]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereNull(['id', 'expires_at']);
        expect('select * from "users" where "id" = ? or "id" is null or "expires_at" is null').toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Basic Where Not Nulls', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereNotNull('id');
        expect('select * from "users" where "id" is not null').toBe(builder.toSql());
        expect([]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').where('id', '>', 1).orWhereNotNull('id');
        expect('select * from "users" where "id" > ? or "id" is not null').toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Array Where Not Nulls', () => {
        let builder = getBuilder();
        builder.select('*').from('users').whereNotNull(['id', 'expires_at']);
        expect('select * from "users" where "id" is not null and "expires_at" is not null').toBe(builder.toSql());
        expect([]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').where('id', '>', 1).orWhereNotNull(['id', 'expires_at']);
        expect('select * from "users" where "id" > ? or "id" is not null or "expires_at" is not null').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Shortcut', () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', 1).orWhere('name', 'foo');
        expect('select * from "users" where "id" = ? or "name" = ?').toBe(builder.toSql());
        expect([1, 'foo']).toEqual(builder.getBindings());
    });

    it('Works Where With Array Or Object Conditions', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where([
                ['foo', 1],
                ['bar', 2]
            ]);
        expect('select * from "users" where ("foo" = ? and "bar" = ?)').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').where({ foo: 1, bar: 2 });
        expect('select * from "users" where ("foo" = ? and "bar" = ?)').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where([
                ['foo', 1],
                ['bar', '<', 2]
            ]);
        expect('select * from "users" where ("foo" = ? and "bar" < ?)').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Nested Wheres', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('email', '=', 'foo')
            .orWhere(query => {
                query.where('name', '=', 'bar').where('age', '=', 25);
            });
        expect('select * from "users" where "email" = ? or ("name" = ? and "age" = ?)').toBe(builder.toSql());
        expect(['foo', 'bar', 25]).toEqual(builder.getBindings());
    });

    it('Works Nested Where Bindings', () => {
        const builder = getBuilder();
        builder.where('email', '=', 'foo').where(query => {
            query.selectRaw('?', ['ignore']).where('name', '=', 'bar');
        });
        expect(['foo', 'bar']).toEqual(builder.getBindings());
    });

    it('Works Where Not', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNot(query => {
                query.where('email', '=', 'foo');
            });
        expect('select * from "users" where not ("email" = ?)').toBe(builder.toSql());
        expect(['foo']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('name', '=', 'bar')
            .whereNot(query => {
                query.where('email', '=', 'foo');
            });
        expect('select * from "users" where "name" = ? and not ("email" = ?)').toBe(builder.toSql());
        expect(['bar', 'foo']).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .where('name', '=', 'bar')
            .orWhereNot(query => {
                query.where('email', '=', 'foo');
            });
        expect('select * from "users" where "name" = ? or not ("email" = ?)').toBe(builder.toSql());
        expect(['bar', 'foo']).toEqual(builder.getBindings());
    });

    it('Works Where Not With Array Or Object Conditions', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNot([
                ['foo', 1],
                ['bar', 2]
            ]);

        expect('select * from "users" where not ("foo" = ? and "bar" = ?)').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder.select('*').from('users').whereNot({ foo: 1, bar: 2 });
        expect('select * from "users" where not ("foo" = ? and "bar" = ?)').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());

        builder = getBuilder();
        builder
            .select('*')
            .from('users')
            .whereNot([
                ['foo', 1],
                ['bar', '<', 2]
            ]);
        expect('select * from "users" where not ("foo" = ? and "bar" < ?)').toBe(builder.toSql());
        expect([1, 2]).toEqual(builder.getBindings());
    });

    it('Works Where Exists', () => {
        let builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .whereExists(query => {
                query.select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'));
            });
        expect(
            'select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .whereNotExists(query => {
                query.select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'));
            });
        expect(
            'select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .where('id', '=', 1)
            .orWhereExists(query => {
                query.select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'));
            });
        expect(
            'select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .where('id', '=', 1)
            .orWhereNotExists(query => {
                query.select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'));
            });
        expect(
            'select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .whereExists(getBuilder().select('*').from('products').where('products.id', '=', new Raw('"orders"."id"')));
        expect(
            'select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .whereNotExists(
                getBuilder().select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'))
            );
        expect(
            'select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .where('id', '=', 1)
            .orWhereExists(
                getBuilder().select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'))
            );
        expect(
            'select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .where('id', '=', 1)
            .orWhereNotExists(
                getBuilder().select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'))
            );
        expect(
            'select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());
    });

    it('Works Add Where Exists Query', () => {
        const builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .addWhereExistsQuery(
                getBuilder().select('*').from('products').where('products.id', '=', new Raw('"orders"."id"'))
            );
        expect(
            'select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")'
        ).toBe(builder.toSql());
    });

    it('Works Prepare Value And Operator', () => {
        let builder = getBuilder();
        builder.where('foo', '>', '20');
        let where = builder.getRegistry().wheres[0] as WhereBasic;
        expect(where.operator).toBe('>');
        expect(where.value).toBe('20');

        builder = getBuilder();
        builder.where('>', '20');
        where = builder.getRegistry().wheres[0] as WhereBasic;
        expect(where.operator).toBe('=');
        expect(where.value).toBe('20');
    });

    it('Works Prepare Value And Operator Error', () => {
        const builder = getBuilder();
        expect(() => {
            builder.where('foo');
        }).toThrowError('Illegal operator and value combination.');

        expect(() => {
            builder.where('foo', null, '20');
        }).toThrowError('Illegal operator and value combination.');
    });

    it('Works Providing Null With Operators Builds Correctly', () => {
        let builder = getBuilder();
        builder.select('*').from('users').where('foo', null);
        expect('select * from "users" where "foo" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').where('foo', '=', null);
        expect('select * from "users" where "foo" is null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').where('foo', '!=', null);
        expect('select * from "users" where "foo" is not null').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('users').where('foo', '<>', null);
        expect('select * from "users" where "foo" is not null').toBe(builder.toSql());
    });

    it('Works Dynamic Where', () => {
        const method = 'whereNotFooBarAndNotBazOrNotQux';
        const parameters = ['corge', 'waldo', 'fred'];
        const builder = getBuilder();
        const spiedWhere = jest.spyOn(builder, 'where');

        expect(builder).toEqual(builder.dynamicWhere(method, parameters));
        expect(spiedWhere).toHaveBeenNthCalledWith(1, 'foo_bar', '=', parameters[0], 'and', true);
        expect(spiedWhere).toHaveBeenNthCalledWith(2, 'baz', '=', parameters[1], 'and', true);
        expect(spiedWhere).toHaveBeenNthCalledWith(3, 'qux', '=', parameters[2], 'or', true);
        expect('select * where not "foo_bar" = ? and not "baz" = ? or not "qux" = ?').toBe(builder.toSql());
    });

    it('Works Dynamic Where Is Not Greedy', () => {
        const method = 'whereIosVersionAndNotAndroidVersionOrOrientation';
        const parameters = ['6.1', '4.2', 'Vertical'];
        const builder = getBuilder();
        const spiedWhere = jest.spyOn(builder, 'where');

        builder.dynamicWhere(method, parameters);
        expect(spiedWhere).toHaveBeenNthCalledWith(1, 'ios_version', '=', parameters[0], 'and', false);
        expect(spiedWhere).toHaveBeenNthCalledWith(2, 'android_version', '=', parameters[1], 'and', true);
        expect(spiedWhere).toHaveBeenNthCalledWith(3, 'orientation', '=', parameters[2], 'or', false);
        expect('select * where "ios_version" = ? and not "android_version" = ? or "orientation" = ?').toBe(
            builder.toSql()
        );
    });

    it('Works Where Row Values', () => {
        let builder = getBuilder();
        builder.select('*').from('orders').whereRowValues(['last_update', 'order_number'], '<', [1, 2]);
        expect('select * from "orders" where ("last_update", "order_number") < (?, ?)').toBe(builder.toSql());

        builder = getBuilder();
        builder.select('*').from('orders').whereRowValuesNot(['last_update', 'order_number'], '<', [1, 2]);
        expect('select * from "orders" where not ("last_update", "order_number") < (?, ?)').toBe(builder.toSql());

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .where('company_id', 1)
            .orWhereRowValues(['last_update', 'order_number'], '<', [1, 2]);
        expect('select * from "orders" where "company_id" = ? or ("last_update", "order_number") < (?, ?)').toBe(
            builder.toSql()
        );

        builder = getBuilder();
        builder
            .select('*')
            .from('orders')
            .whereRowValues(['last_update', 'order_number'], '<', [1, new Raw('2')])
            .orWhereRowValuesNot(['last_update', 'order_number'], '<', [1, 2]);
        expect(
            'select * from "orders" where ("last_update", "order_number") < (?, 2) or not ("last_update", "order_number") < (?, ?)'
        ).toBe(builder.toSql());
        expect([1, 1, 2]).toEqual(builder.getBindings());
    });

    it('Works Where Row Values Varity Mismatch', () => {
        const builder = getBuilder();
        expect(() => {
            builder.select('*').from('orders').whereRowValues(['last_update'], '<', [1, 2]);
        }).toThrowError('The number of columns must match the number of values');
    });

    it('Works Where Json Contains MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonContains('options', ['en']);
        expect('select * from `users` where json_contains(`options`, ?)').toBe(builder.toSql());
        expect(['["en"]']).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonContains('users.options->languages', ['en']);
        expect('select * from `users` where json_contains(`users`.`options`, ?, \'$."languages"\')').toBe(
            builder.toSql()
        );
        expect(['["en"]']).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonContains('options->languages', new Raw('\'["en"]\''));
        expect('select * from `users` where `id` = ? or json_contains(`options`, \'["en"]\', \'$."languages"\')').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Contains Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContains('options', ['en']);
        expect('select * from "users" where ("options")::jsonb @> ?').toBe(builder.toSql());
        expect(['["en"]']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContains('users.options->languages', ['en']);
        expect('select * from "users" where ("users"."options"->\'languages\')::jsonb @> ?').toBe(builder.toSql());
        expect(['["en"]']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonContains('options->languages', new Raw('\'["en"]\''));
        expect('select * from "users" where "id" = ? or ("options"->\'languages\')::jsonb @> \'["en"]\'').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Contains Sqlite', () => {
        const builder = getSQLiteBuilder();
        expect(() => {
            builder.select('*').from('users').whereJsonContains('options->languages', ['en']).toSql();
        }).toThrowError('This database engine does not support JSON contains operations.');
    });

    it('Works Where Json Contains SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonContains('options', true);

        expect('select * from [users] where ? in (select [value] from openjson([options]))').toBe(builder.toSql());
        expect(['true']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonContains('users.options->languages', 'en');
        expect(
            'select * from [users] where ? in (select [value] from openjson([users].[options], \'$."languages"\'))'
        ).toBe(builder.toSql());
        expect(['en']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonContains('options->languages', new Raw("'en'"));
        expect(
            "select * from [users] where [id] = ? or 'en' in (select [value] from openjson([options], '$.\"languages\"'))"
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Doesnt Contain MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonDoesntContain('options->languages', ['en']);
        expect('select * from `users` where not json_contains(`options`, ?, \'$."languages"\')').toBe(builder.toSql());
        expect(['["en"]']).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonDoesntContain('options->languages', new Raw('\'["en"]\''));
        expect(
            'select * from `users` where `id` = ? or not json_contains(`options`, \'["en"]\', \'$."languages"\')'
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Doesnt Contain Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonDoesntContain('options->languages', ['en']);
        expect('select * from "users" where not ("options"->\'languages\')::jsonb @> ?').toBe(builder.toSql());
        expect(['["en"]']).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonDoesntContain('options->languages', new Raw('\'["en"]\''));
        expect('select * from "users" where "id" = ? or not ("options"->\'languages\')::jsonb @> \'["en"]\'').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Doesnt Contain Sqlite', () => {
        const builder = getSQLiteBuilder();
        expect(() => {
            builder.select('*').from('users').whereJsonDoesntContain('options->languages', ['en']).toSql();
        }).toThrowError('This database engine does not support JSON contains operations.');
    });

    it('Works Where Json Doesnt Contain SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonDoesntContain('options->languages', 'en');
        expect(
            'select * from [users] where not ? in (select [value] from openjson([options], \'$."languages"\'))'
        ).toBe(builder.toSql());
        expect(['en']).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonDoesntContain('options->languages', new Raw("'en'"));
        expect(
            "select * from [users] where [id] = ? or not 'en' in (select [value] from openjson([options], '$.\"languages\"'))"
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Contains Key', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereJsonContainsKey('users.options->languages');
        expect(() => {
            builder.toSql();
        }).toThrowError('This database engine does not support JSON contains key operations.');
    });

    it('Works Where Json Contains Key MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonContainsKey('users.options->languages');
        expect(
            "select * from `users` where ifnull(json_contains_path(`users`.`options`, 'one', '$.\"languages\"'), 0)"
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->language->primary');
        expect(
            'select * from `users` where ifnull(json_contains_path(`options`, \'one\', \'$."language"."primary"\'), 0)'
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
        expect(
            "select * from `users` where `id` = ? or ifnull(json_contains_path(`options`, 'one', '$.\"languages\"'), 0)"
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->languages[0][1]');
        expect(
            "select * from `users` where ifnull(json_contains_path(`options`, 'one', '$.\"languages\"[0][1]'), 0)"
        ).toBe(builder.toSql());
    });

    it('Works Where Json Contains Key Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContainsKey('users.options->languages');
        expect('select * from "users" where coalesce(("users"."options")::jsonb ?? \'languages\', false)').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->language->primary');
        expect('select * from "users" where coalesce(("options"->\'language\')::jsonb ?? \'primary\', false)').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
        expect('select * from "users" where "id" = ? or coalesce(("options")::jsonb ?? \'languages\', false)').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->languages[0][1]');
        expect(
            'select * from "users" where case when jsonb_typeof(("options"->\'languages\'->0)::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\'->0)::jsonb) >= 2 else false end'
        ).toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->languages->0');
        expect(
            'select * from "users" where case when jsonb_typeof(("options"->\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\')::jsonb) >= 1 else false end'
        ).toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->languages[-1]');
        expect(
            'select * from "users" where case when jsonb_typeof(("options"->\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\')::jsonb) >= 1 else false end'
        ).toBe(builder.toSql());
    });

    it('Works Where Json Contains Key Sqlite', () => {
        let builder = getSQLiteBuilder();
        builder.select('*').from('users').whereJsonContainsKey('users.options->languages');
        expect('select * from "users" where json_type("users"."options", \'$."languages"\') is not null').toBe(
            builder.toSql()
        );

        builder = getSQLiteBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->language->primary');
        expect('select * from "users" where json_type("options", \'$."language"."primary"\') is not null').toBe(
            builder.toSql()
        );

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
        expect('select * from "users" where "id" = ? or json_type("options", \'$."languages"\') is not null').toBe(
            builder.toSql()
        );

        builder = getSQLiteBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->languages[0][1]');
        expect('select * from "users" where json_type("options", \'$."languages"[0][1]\') is not null').toBe(
            builder.toSql()
        );
    });

    it('Works Where Json Contains Key SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonContainsKey('users.options->languages');
        expect("select * from [users] where 'languages' in (select [key] from openjson([users].[options]))").toBe(
            builder.toSql()
        );

        builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->language->primary');
        expect(
            "select * from [users] where 'primary' in (select [key] from openjson([options], '$.\"language\"'))"
        ).toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonContainsKey('options->languages');
        expect("select * from [users] where [id] = ? or 'languages' in (select [key] from openjson([options]))").toBe(
            builder.toSql()
        );

        builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonContainsKey('options->languages[0][1]');
        expect('select * from [users] where 1 in (select [key] from openjson([options], \'$."languages"[0]\'))').toBe(
            builder.toSql()
        );
    });

    it('Works Where Json Doesnt Contain Key MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages');
        expect(
            "select * from `users` where not ifnull(json_contains_path(`options`, 'one', '$.\"languages\"'), 0)"
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
        expect(
            "select * from `users` where `id` = ? or not ifnull(json_contains_path(`options`, 'one', '$.\"languages\"'), 0)"
        ).toBe(builder.toSql());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages[0][1]');
        expect(
            "select * from `users` where not ifnull(json_contains_path(`options`, 'one', '$.\"languages\"[0][1]'), 0)"
        ).toBe(builder.toSql());
    });

    it('Works Where Json Doesnt Contain Key Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages');
        expect('select * from "users" where not coalesce(("options")::jsonb ?? \'languages\', false)').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
        expect('select * from "users" where "id" = ? or not coalesce(("options")::jsonb ?? \'languages\', false)').toBe(
            builder.toSql()
        );

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages[0][1]');
        expect(
            'select * from "users" where not case when jsonb_typeof(("options"->\'languages\'->0)::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\'->0)::jsonb) >= 2 else false end'
        ).toBe(builder.toSql());

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages[-1]');
        expect(
            'select * from "users" where not case when jsonb_typeof(("options"->\'languages\')::jsonb) = \'array\' then jsonb_array_length(("options"->\'languages\')::jsonb) >= 1 else false end'
        ).toBe(builder.toSql());
    });

    it('Works Where Json Doesnt Contain Key Sqlite', () => {
        let builder = getSQLiteBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages');
        expect('select * from "users" where not json_type("options", \'$."languages"\') is not null').toBe(
            builder.toSql()
        );

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
        expect('select * from "users" where "id" = ? or not json_type("options", \'$."languages"\') is not null').toBe(
            builder.toSql()
        );

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages[0][1]');
        expect(
            'select * from "users" where "id" = ? or not json_type("options", \'$."languages"[0][1]\') is not null'
        ).toBe(builder.toSql());
    });

    it('Works Where Json Doesnt Contain Key SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonDoesntContainKey('options->languages');
        expect("select * from [users] where not 'languages' in (select [key] from openjson([options]))").toBe(
            builder.toSql()
        );

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages');
        expect(
            "select * from [users] where [id] = ? or not 'languages' in (select [key] from openjson([options]))"
        ).toBe(builder.toSql());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonDoesntContainKey('options->languages[0][1]');
        expect(
            'select * from [users] where [id] = ? or not 1 in (select [key] from openjson([options], \'$."languages"[0]\'))'
        ).toBe(builder.toSql());
    });

    it('Works Where Json Length', () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereJsonLength('options', 0);
        expect(() => {
            builder.toSql();
        }).toThrowError('This database engine does not support JSON length operations.');
    });

    it('Works Where Json Length MySql', () => {
        let builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonLength('options', 0);
        expect('select * from `users` where json_length(`options`) = ?').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonLengthNot('options', 0);
        expect('select * from `users` where not json_length(`options`) = ?').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonLength('users.options->languages', '>', 0);
        expect('select * from `users` where json_length(`users`.`options`, \'$."languages"\') > ?').toBe(
            builder.toSql()
        );
        expect([0]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').whereJsonLengthNot('users.options->languages', '>', 0);
        expect('select * from `users` where not json_length(`users`.`options`, \'$."languages"\') > ?').toBe(
            builder.toSql()
        );
        expect([0]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
        expect('select * from `users` where `id` = ? or json_length(`options`, \'$."languages"\') = 0').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonLengthNot('options->languages', new Raw('0'));
        expect('select * from `users` where `id` = ? or not json_length(`options`, \'$."languages"\') = 0').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonLength('options->languages', '>', new Raw('0'));
        expect('select * from `users` where `id` = ? or json_length(`options`, \'$."languages"\') > 0').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());

        builder = getMySqlBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonLengthNot('options->languages', '>', new Raw('0'));
        expect('select * from `users` where `id` = ? or not json_length(`options`, \'$."languages"\') > 0').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Length Postgres', () => {
        let builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonLength('options', 0);
        expect('select * from "users" where jsonb_array_length(("options")::jsonb) = ?').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').whereJsonLength('users.options->languages', '>', 0);
        expect('select * from "users" where jsonb_array_length(("users"."options"->\'languages\')::jsonb) > ?').toBe(
            builder.toSql()
        );
        expect([0]).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
        expect(
            'select * from "users" where "id" = ? or jsonb_array_length(("options"->\'languages\')::jsonb) = 0'
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());

        builder = getPostgresBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonLength('options->languages', '>', new Raw('0'));
        expect(
            'select * from "users" where "id" = ? or jsonb_array_length(("options"->\'languages\')::jsonb) > 0'
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Length Sqlite', () => {
        let builder = getSQLiteBuilder();
        builder.select('*').from('users').whereJsonLength('options', 0);
        expect('select * from "users" where json_array_length("options") = ?').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getSQLiteBuilder();
        builder.select('*').from('users').whereJsonLength('users.options->languages', '>', 0);
        expect('select * from "users" where json_array_length("users"."options", \'$."languages"\') > ?').toBe(
            builder.toSql()
        );
        expect([0]).toEqual(builder.getBindings());

        builder = getSQLiteBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
        expect('select * from "users" where "id" = ? or json_array_length("options", \'$."languages"\') = 0').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());

        builder = getSQLiteBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonLength('options->languages', '>', new Raw('0'));
        expect('select * from "users" where "id" = ? or json_array_length("options", \'$."languages"\') > 0').toBe(
            builder.toSql()
        );
        expect([1]).toEqual(builder.getBindings());
    });

    it('Works Where Json Length SqlServer', () => {
        let builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonLength('options', 0);
        expect('select * from [users] where (select count(*) from openjson([options])) = ?').toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').whereJsonLength('users.options->languages', '>', 0);
        expect(
            'select * from [users] where (select count(*) from openjson([users].[options], \'$."languages"\')) > ?'
        ).toBe(builder.toSql());
        expect([0]).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder.select('*').from('users').where('id', '=', 1).orWhereJsonLength('options->languages', new Raw('0'));
        expect(
            'select * from [users] where [id] = ? or (select count(*) from openjson([options], \'$."languages"\')) = 0'
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());

        builder = getSqlServerBuilder();
        builder
            .select('*')
            .from('users')
            .where('id', '=', 1)
            .orWhereJsonLength('options->languages', '>', new Raw('0'));
        expect(
            'select * from [users] where [id] = ? or (select count(*) from openjson([options], \'$."languages"\')) > 0'
        ).toBe(builder.toSql());
        expect([1]).toEqual(builder.getBindings());
    });
});
