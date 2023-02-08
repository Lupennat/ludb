import { Pdo } from 'lupdo';
import { Dictionary } from 'lupdo/dist/typings/types/pdo-statement';
import Connection from '../connections/connection';
import Builder from '../query/builder';
import Grammar from '../query/grammars/grammar';
import MySqlGrammar from '../query/grammars/mysql-grammar';
import PostgresGrammar from '../query/grammars/postgres-grammar';
import MySqlProcessor from '../query/processors/mysql-processor';
import Processor from '../query/processors/processor';
import BuilderI from '../types/query/builder';

describe('Query Builder', () => {
    const pdo = new Pdo('fake', {});
    const connection = new Connection(
        pdo,
        {
            driver: 'fake',
            name: 'fake',
            prefix: ''
        },
        'database',
        ''
    );

    afterAll(async () => {
        await pdo.disconnect();
    });

    function getBuilder(): BuilderI {
        return new Builder(connection.session(), new Grammar(), new Processor());
    }

    function getMySqlBuilderWithProcessor(): BuilderI {
        return new Builder(connection.session(), new MySqlGrammar(), new MySqlProcessor());
    }

    function getPostgresBuilder(): BuilderI {
        return new Builder(connection.session(), new PostgresGrammar(), new Processor());
    }

    it('Works Basic Select', async () => {
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

    it('Works Basic Table Wrapping Protects Quotation Marks', async () => {
        const builder = getBuilder();
        builder.select('*').from('some"table');
        expect(builder.toSql()).toBe('select * from "some""table"');
    });

    it('Works Alias Wrapping As Whole Constant', async () => {
        const builder = getBuilder();
        builder.select('x.y as foo.bar').from('baz');
        expect(builder.toSql()).toBe('select "x"."y" as "foo.bar" from "baz"');
    });

    it('Works Alias Wrapping With Spaces In Database Name', async () => {
        const builder = getBuilder();
        builder.select('w x.y.z as foo.bar').from('baz');
        expect(builder.toSql()).toBe('select "w x"."y"."z" as "foo.bar" from "baz"');
    });

    it('Works Adding Selects', async () => {
        const builder = getBuilder();
        builder.select('foo').addSelect('bar').addSelect(['baz', 'boom']).from('users');
        expect(builder.toSql()).toBe('select "foo", "bar", "baz", "boom" from "users"');
    });

    it('Works Basic Select With Prefix', async () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('users');
        expect(builder.toSql()).toBe('select * from "prefix_users"');
    });

    it('Works Basic Select Distinct', async () => {
        const builder = getBuilder();
        builder.distinct().select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
    });

    it('Works Basic Select Distinct On Columns', async () => {
        let builder = getBuilder();
        builder.distinct('foo').select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct "foo", "bar" from "users"');
        builder = getPostgresBuilder();
        builder.distinct('foo').select('foo', 'bar').from('users');
        expect(builder.toSql()).toBe('select distinct on ("foo") "foo", "bar" from "users"');
    });

    it('Works Basic Alias', async () => {
        const builder = getBuilder();
        builder.select('foo as bar').from('users');
        expect(builder.toSql()).toBe('select "foo" as "bar" from "users"');
    });

    it('Works Alias With Prefix', async () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('users as people');
        expect(builder.toSql()).toBe('select * from "prefix_users" as "prefix_people"');
    });

    it('Works Join Aliases With Prefix', async () => {
        const builder = getBuilder();
        builder.getGrammar().setTablePrefix('prefix_');
        builder.select('*').from('services').join('translations AS t', 't.item_id', '=', 'services.id');
        expect(builder.toSql()).toBe(
            'select * from "prefix_services" inner join "prefix_translations" as "prefix_t" on "prefix_t"."item_id" = "prefix_services"."id"'
        );
    });

    it('Works Basic Table Wrapping', async () => {
        const builder = getBuilder();
        builder.select('*').from('public.users');
        expect(builder.toSql()).toBe('select * from "public"."users"');
    });

    it('Works When Callback', async () => {
        const callback = (query: BuilderI, condition: boolean) => {
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

    it('Works When Callback With Return', async () => {
        const callback = (query: BuilderI, condition: boolean) => {
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

    it('Works When Callback With Default', async () => {
        const callback = (query: BuilderI, condition: string | number) => {
            expect(condition).toBe('truthy');
            return query.where('id', '=', 1);
        };
        const defaultCB = (query: BuilderI, condition: string | number) => {
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

    it('Works Unless Callback', async () => {
        const callback = (query: BuilderI, condition: boolean) => {
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

    it('Works Unless Callback With Return', async () => {
        const callback = (query: BuilderI, condition: boolean) => {
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

    it('Works Unless Callback With Default', async () => {
        const callback = (query: BuilderI, condition: string | number) => {
            expect(condition).toBe(0);
            return query.where('id', '=', 1);
        };
        const defaultCB = (query: BuilderI, condition: string | number) => {
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

    it('Works Tap Callback', async () => {
        const callback = (query: BuilderI) => {
            query.where('id', '=', 1);
        };
        const builder = getBuilder();
        builder.select('*').from('users').tap(callback).where('email', 'foo');
        expect(builder.toSql()).toBe('select * from "users" where "id" = ? and "email" = ?');
    });

    it('Works Basic Where', async () => {
        const builder = getBuilder();
        builder.select('*').from('users').where('id', '=', 1);
        expect(builder.toSql()).toBe('select * from "users" where "id" = ?');
        expect(builder.getBindings()).toEqual([1]);
    });

    it('Works Basic Where Not', async () => {
        const builder = getBuilder();
        builder.select('*').from('users').whereNot('name', 'foo').whereNot('name', '<>', 'bar');
        expect(builder.toSql()).toBe('select * from "users" where not "name" = ? and not "name" <> ?');
        expect(builder.getBindings()).toEqual(['foo', 'bar']);
    });

    // it.only('Works Basic Wheres With Array Values', async () => {
    //     const builder = getBuilder();
    //     builder.select('*').from('users').where('id', [12]);
    //     expect(builder.toSql()).toBe('select * from "users" where not "name" = ? and not "name" <> ?');
    //     expect(builder.getBindings()).toEqual(['foo', 'bar']);
    // });

    // public function testWheresWithArrayValue()
    // {
    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->where('id', [12]);
    //     $this->assertSame('select * from "users" where "id" = ?', $builder->toSql());
    //     $this->assertEquals([0 => 12], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->where('id', '=', [12, 30]);
    //     $this->assertSame('select * from "users" where "id" = ?', $builder->toSql());
    //     $this->assertEquals([0 => 12], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->where('id', '!=', [12, 30]);
    //     $this->assertSame('select * from "users" where "id" != ?', $builder->toSql());
    //     $this->assertEquals([0 => 12], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->where('id', '<>', [12, 30]);
    //     $this->assertSame('select * from "users" where "id" <> ?', $builder->toSql());
    //     $this->assertEquals([0 => 12], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->where('id', '=', [[12, 30]]);
    //     $this->assertSame('select * from "users" where "id" = ?', $builder->toSql());
    //     $this->assertEquals([0 => 12], $builder->getBindings());
    // }

    // public function testMySqlWrappingProtectsQuotationMarks()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->From('some`table');
    //     $this->assertSame('select * from `some``table`', $builder->toSql());
    // }

    // public function testDateBasedWheresAcceptsTwoArguments()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereDate('created_at', 1);
    //     $this->assertSame('select * from `users` where date(`created_at`) = ?', $builder->toSql());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', 1);
    //     $this->assertSame('select * from `users` where day(`created_at`) = ?', $builder->toSql());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', 1);
    //     $this->assertSame('select * from `users` where month(`created_at`) = ?', $builder->toSql());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', 1);
    //     $this->assertSame('select * from `users` where year(`created_at`) = ?', $builder->toSql());
    // }

    // public function testDateBasedOrWheresAcceptsTwoArguments()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->where('id', 1)->orWhereDate('created_at', 1);
    //     $this->assertSame('select * from `users` where `id` = ? or date(`created_at`) = ?', $builder->toSql());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->where('id', 1)->orWhereDay('created_at', 1);
    //     $this->assertSame('select * from `users` where `id` = ? or day(`created_at`) = ?', $builder->toSql());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->where('id', 1)->orWhereMonth('created_at', 1);
    //     $this->assertSame('select * from `users` where `id` = ? or month(`created_at`) = ?', $builder->toSql());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->where('id', 1)->orWhereYear('created_at', 1);
    //     $this->assertSame('select * from `users` where `id` = ? or year(`created_at`) = ?', $builder->toSql());
    // }

    // public function testDateBasedWheresExpressionIsNotBound()
    // {
    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->whereDate('created_at', new Raw('NOW()'))->where('admin', true);
    //     $this->assertEquals([true], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', new Raw('NOW()'));
    //     $this->assertEquals([], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', new Raw('NOW()'));
    //     $this->assertEquals([], $builder->getBindings());

    //     $builder = $this->getBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', new Raw('NOW()'));
    //     $this->assertEquals([], $builder->getBindings());
    // }

    // public function testWhereDateMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereDate('created_at', '=', '2015-12-21');
    //     $this->assertSame('select * from `users` where date(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => '2015-12-21'], $builder->getBindings());

    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereDate('created_at', '=', new Raw('NOW()'));
    //     $this->assertSame('select * from `users` where date(`created_at`) = NOW()', $builder->toSql());
    // }

    // public function testWhereDayMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', '=', 1);
    //     $this->assertSame('select * from `users` where day(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 1], $builder->getBindings());
    // }

    // public function testOrWhereDayMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', '=', 1)->orWhereDay('created_at', '=', 2);
    //     $this->assertSame('select * from `users` where day(`created_at`) = ? or day(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 1, 1 => 2], $builder->getBindings());
    // }

    // public function testOrWhereDayPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', '=', 1)->orWhereDay('created_at', '=', 2);
    //     $this->assertSame('select * from "users" where extract(day from "created_at") = ? or extract(day from "created_at") = ?', $builder->toSql());
    //     $this->assertEquals([0 => 1, 1 => 2], $builder->getBindings());
    // }

    // public function testOrWhereDaySqlServer()
    // {
    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', '=', 1)->orWhereDay('created_at', '=', 2);
    //     $this->assertSame('select * from [users] where day([created_at]) = ? or day([created_at]) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 1, 1 => 2], $builder->getBindings());
    // }

    // public function testWhereMonthMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', '=', 5);
    //     $this->assertSame('select * from `users` where month(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 5], $builder->getBindings());
    // }

    // public function testOrWhereMonthMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', '=', 5)->orWhereMonth('created_at', '=', 6);
    //     $this->assertSame('select * from `users` where month(`created_at`) = ? or month(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 5, 1 => 6], $builder->getBindings());
    // }

    // public function testOrWhereMonthPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', '=', 5)->orWhereMonth('created_at', '=', 6);
    //     $this->assertSame('select * from "users" where extract(month from "created_at") = ? or extract(month from "created_at") = ?', $builder->toSql());
    //     $this->assertEquals([0 => 5, 1 => 6], $builder->getBindings());
    // }

    // public function testOrWhereMonthSqlServer()
    // {
    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', '=', 5)->orWhereMonth('created_at', '=', 6);
    //     $this->assertSame('select * from [users] where month([created_at]) = ? or month([created_at]) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 5, 1 => 6], $builder->getBindings());
    // }

    // public function testWhereYearMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', '=', 2014);
    //     $this->assertSame('select * from `users` where year(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 2014], $builder->getBindings());
    // }

    // public function testOrWhereYearMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', '=', 2014)->orWhereYear('created_at', '=', 2015);
    //     $this->assertSame('select * from `users` where year(`created_at`) = ? or year(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 2014, 1 => 2015], $builder->getBindings());
    // }

    // public function testOrWhereYearPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', '=', 2014)->orWhereYear('created_at', '=', 2015);
    //     $this->assertSame('select * from "users" where extract(year from "created_at") = ? or extract(year from "created_at") = ?', $builder->toSql());
    //     $this->assertEquals([0 => 2014, 1 => 2015], $builder->getBindings());
    // }

    // public function testOrWhereYearSqlServer()
    // {
    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', '=', 2014)->orWhereYear('created_at', '=', 2015);
    //     $this->assertSame('select * from [users] where year([created_at]) = ? or year([created_at]) = ?', $builder->toSql());
    //     $this->assertEquals([0 => 2014, 1 => 2015], $builder->getBindings());
    // }

    // public function testWhereTimeMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '>=', '22:00');
    //     $this->assertSame('select * from `users` where time(`created_at`) >= ?', $builder->toSql());
    //     $this->assertEquals([0 => '22:00'], $builder->getBindings());
    // }

    // public function testWhereTimeOperatorOptionalMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '22:00');
    //     $this->assertSame('select * from `users` where time(`created_at`) = ?', $builder->toSql());
    //     $this->assertEquals([0 => '22:00'], $builder->getBindings());
    // }

    // public function testWhereTimeOperatorOptionalPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '22:00');
    //     $this->assertSame('select * from "users" where "created_at"::time = ?', $builder->toSql());
    //     $this->assertEquals([0 => '22:00'], $builder->getBindings());
    // }

    // public function testWhereTimeSqlServer()
    // {
    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '22:00');
    //     $this->assertSame('select * from [users] where cast([created_at] as time) = ?', $builder->toSql());
    //     $this->assertEquals([0 => '22:00'], $builder->getBindings());

    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', new Raw('NOW()'));
    //     $this->assertSame('select * from [users] where cast([created_at] as time) = NOW()', $builder->toSql());
    //     $this->assertEquals([], $builder->getBindings());
    // }

    // public function testOrWhereTimeMySql()
    // {
    //     $builder = $this->getMySqlBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '<=', '10:00')->orWhereTime('created_at', '>=', '22:00');
    //     $this->assertSame('select * from `users` where time(`created_at`) <= ? or time(`created_at`) >= ?', $builder->toSql());
    //     $this->assertEquals([0 => '10:00', 1 => '22:00'], $builder->getBindings());
    // }

    // public function testOrWhereTimePostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '<=', '10:00')->orWhereTime('created_at', '>=', '22:00');
    //     $this->assertSame('select * from "users" where "created_at"::time <= ? or "created_at"::time >= ?', $builder->toSql());
    //     $this->assertEquals([0 => '10:00', 1 => '22:00'], $builder->getBindings());
    // }

    // public function testOrWhereTimeSqlServer()
    // {
    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '<=', '10:00')->orWhereTime('created_at', '>=', '22:00');
    //     $this->assertSame('select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) >= ?', $builder->toSql());
    //     $this->assertEquals([0 => '10:00', 1 => '22:00'], $builder->getBindings());

    //     $builder = $this->getSqlServerBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '<=', '10:00')->orWhereTime('created_at', new Raw('NOW()'));
    //     $this->assertSame('select * from [users] where cast([created_at] as time) <= ? or cast([created_at] as time) = NOW()', $builder->toSql());
    //     $this->assertEquals([0 => '10:00'], $builder->getBindings());
    // }

    // public function testWhereDatePostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereDate('created_at', '=', '2015-12-21');
    //     $this->assertSame('select * from "users" where "created_at"::date = ?', $builder->toSql());
    //     $this->assertEquals([0 => '2015-12-21'], $builder->getBindings());

    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereDate('created_at', new Raw('NOW()'));
    //     $this->assertSame('select * from "users" where "created_at"::date = NOW()', $builder->toSql());
    // }

    // public function testWhereDayPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereDay('created_at', '=', 1);
    //     $this->assertSame('select * from "users" where extract(day from "created_at") = ?', $builder->toSql());
    //     $this->assertEquals([0 => 1], $builder->getBindings());
    // }

    // public function testWhereMonthPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereMonth('created_at', '=', 5);
    //     $this->assertSame('select * from "users" where extract(month from "created_at") = ?', $builder->toSql());
    //     $this->assertEquals([0 => 5], $builder->getBindings());
    // }

    // public function testWhereYearPostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereYear('created_at', '=', 2014);
    //     $this->assertSame('select * from "users" where extract(year from "created_at") = ?', $builder->toSql());
    //     $this->assertEquals([0 => 2014], $builder->getBindings());
    // }

    // public function testWhereTimePostgres()
    // {
    //     $builder = $this->getPostgresBuilder();
    //     $builder->select('*')->from('users')->whereTime('created_at', '>=', '22:00');
    //     $this->assertSame('select * from "users" where "created_at"::time >= ?', $builder->toSql());
    //     $this->assertEquals([0 => '22:00'], $builder->getBindings());
    // }
});
