import Raw from '../../../../query/expression';
import { getBuilder, getSqlServerBuilder, pdo } from '../../fixtures/mocked';

describe('Builder Pdo Methods Select', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Find Returns First Result By ID', async () => {
        const builder = getBuilder();

        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                {
                    foo: 'bar'
                }
            ];
        });

        const results = await builder.from('users').find(1);
        expect({ foo: 'bar' }).toEqual(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
        expect(spiedConnection).toHaveBeenCalledWith('select * from "users" where "id" = ? limit 1', [1], true);
    });

    it('Works Find Or Returns First Result By ID', async () => {
        const builder = getBuilder();
        const data = {};
        jest.spyOn(builder, 'first')
            .mockImplementationOnce(async () => {
                return data;
            })
            .mockImplementationOnce(async columns => {
                expect(columns).toEqual(['column']);
                return data;
            })
            .mockImplementationOnce(async () => {
                return null;
            })
            .mockImplementationOnce(async () => {
                return null;
            })
            .mockImplementationOnce(async columns => {
                expect(columns).toEqual(['*']);
                return data;
            });

        expect(data).toEqual(await builder.findOr(1, () => 'callback result'));
        expect(data).toEqual(await builder.findOr(1, ['column'], () => 'callback result'));
        expect('callback result').toBe(await builder.findOr(1, () => 'callback result'));
        expect(await builder.findOr(1)).toBeNull();
        expect(data).toBe(await builder.findOr(1));
    });

    it('Works First Method Returns First Result', async () => {
        const builder = getBuilder();

        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                {
                    foo: 'bar'
                }
            ];
        });

        const results = await builder.from('users').where('id', '=', 1).first();
        expect({ foo: 'bar' }).toEqual(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
        expect(spiedConnection).toHaveBeenCalledWith('select * from "users" where "id" = ? limit 1', [1], true);
    });

    it('Works Sole Method Returns Only If Sole', async () => {
        let builder = getBuilder();
        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 2');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }];
        });

        const results = await builder.from('users').where('id', '=', 1).sole('foo');
        expect({ foo: 'bar' }).toEqual(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select * from "users" where "id" = ? limit 2');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }];
        });

        const results2 = await builder.from('users').where('id', '=', 1).sole();
        expect({ foo: 'bar' }).toEqual(results2);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 2');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [];
        });

        await expect(builder.from('users').where('id', '=', 1).sole<string>('foo')).rejects.toThrow(
            'no records were found.'
        );

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 2');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        await expect(builder.from('users').where('id', '=', 1).sole<string>('foo')).rejects.toThrow(
            '2 records were found.'
        );
    });

    it('Works Pluck Method Gets An Array Or Object Of Column Values', async () => {
        let builder = getBuilder();
        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        const results = await builder.from('users').where('id', '=', 1).pluck<string>('foo');

        expect(['bar', 'baz']).toEqual(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                { id: 1, foo: 'bar' },
                { id: null, foo: 'baz' }
            ];
        });

        const results2 = await builder.from('users').where('id', '=', 1).pluck<string>('foo', 'id');
        expect({ 1: 'bar', null: 'baz' }).toEqual(results2);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                { id: Buffer.from('1'), foo: 'bar' },
                { id: Buffer.from('10'), foo: 'baz' }
            ];
        });

        await expect(builder.from('users').where('id', '=', 1).pluck<string>('foo', 'id')).rejects.toThrow(
            'key value [Buffer] is not stringable'
        );

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                { id: [1, 2], foo: 'bar' },
                { id: [3, 4], foo: 'baz' }
            ];
        });

        await expect(builder.from('users').where('id', '=', 1).pluck<string>('foo', 'id')).rejects.toThrow(
            'key value [Array] is not stringable'
        );

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [];
        });

        const results3 = await builder.from('users').where('id', '=', 1).pluck<string>('foo', 'id');
        expect({}).toEqual(results3);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [];
        });

        const results4 = await builder.from('users').where('id', '=', 1).pluck<string>('foo');
        expect([]).toEqual(results4);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                { id: 1, foo: 'bar' },
                { id: null, foo: 'baz' }
            ];
        });

        const results5 = await builder.from('users').where('id', '=', 1).pluck<string>('foo', new Raw('baz as id'));
        expect({ 1: 'bar', null: 'baz' }).toEqual(results5);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                { id: 1, foo: 'bar' },
                { id: null, foo: 'baz' }
            ];
        });

        const results6 = await builder.from('users').where('id', '=', 1).pluck<string>('foo', 'table.id');
        expect({ 1: 'bar', null: 'baz' }).toEqual(results6);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Implode', async () => {
        // Test without glue.
        let builder = getBuilder();
        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        let results = await builder.from('users').where('id', '=', 1).implode('foo');

        expect('barbaz').toEqual(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        results = await builder.from('users').where('id', '=', 1).implode('foo', ',');

        expect('bar,baz').toEqual(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Value Method Returns Single Column', async () => {
        let builder = getBuilder();
        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }];
        });

        const results = await builder.from('users').where('id', '=', 1).value<string>('foo');
        expect('bar').toBe(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [];
        });

        const results2 = await builder.from('users').where('id', '=', 1).value<string>('foo');
        expect(results2).toBeNull();
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Sole Value Method Returns Single Column', async () => {
        const builder = getBuilder();
        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 2');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }];
        });

        const results = await builder.from('users').where('id', '=', 1).soleValue<string>('foo');
        expect('bar').toBe(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works RawValue Method Returns Single Column', async () => {
        let builder = getBuilder();
        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select UPPER("foo") from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ 'UPPER("foo")': 'BAR' }];
        });

        const results = await builder.from('users').where('id', '=', 1).rawValue<string>('UPPER("foo")');
        expect('BAR').toBe(results);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [];
        });

        const results2 = await builder.from('users').where('id', '=', 1).rawValue<string>('"foo"');
        expect(results2).toBeNull();
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Aggregate Functions', async () => {
        let builder = getBuilder();
        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(*) as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').count()).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(distinct access, "id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').count([new Raw('distinct access'), 'id'])).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select exists(select * from "users") as "exists"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ exists: 1 }];
        });

        expect(await builder.from('users').exists()).toBeTruthy();
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select exists(select * from "users") as "exists"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ exists: 0 }];
        });

        expect(await builder.from('users').doesntExist()).toBeTruthy();
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select max("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').max('id')).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select min("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').min('id')).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select sum("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').sum('id')).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select sum("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: null }];
        });

        expect(await builder.from('users').sum('id')).toBe(0);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select avg("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').avg('id')).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select avg("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').average('id')).toBe(1);
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works Aggregate', async () => {
        const builder = getBuilder();

        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(*) as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [];
        });

        expect(await builder.from('users').aggregate('count')).toBeNull();
    });

    it('Works Numeric Aggregate', async () => {
        const builder = getBuilder();

        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count(*) as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count(*) as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: BigInt('100') }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("id") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: 10 }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select least("id", "access") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: 10.4467 }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("id") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: '1055333434343424234343.443' }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("id") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: '9007199254740992' }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("id") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: '-9007199254740992' }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("id") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: '100' }];
            });

        expect(await builder.from('users').numericAggregate('count')).toBe(0);
        expect(await builder.from('users').numericAggregate('count')).toBe(BigInt('100'));
        expect(await builder.from('users').numericAggregate('count', ['id'])).toBe(10);
        expect(await builder.from('users').numericAggregate('least', ['id', 'access'])).toBe(10.4467);
        expect(await builder.from('users').numericAggregate('count', ['id'])).toBe(1.0553334343434243e21);
        expect(await builder.from('users').numericAggregate('count', ['id'])).toBe(BigInt('9007199254740992'));
        expect(await builder.from('users').numericAggregate('count', ['id'])).toBe(BigInt('-9007199254740992'));
        expect(await builder.from('users').numericAggregate('count', ['id'])).toBe(100);
    });

    it('Works SqlServer Exists', async () => {
        const builder = getSqlServerBuilder();
        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select top 1 1 [exists] from [users]');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ exists: 1 }];
        });
        expect(await builder.from('users').exists()).toBeTruthy();
        expect(spiedConnection).toHaveBeenCalledTimes(1);
    });

    it('Works DoesntExistsOr', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async () => {
            return [{ exists: 1 }];
        });

        expect(await builder.from('users').doesntExistOr(() => 123)).toBe(123);

        builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async () => {
            return [{ exists: 0 }];
        });

        expect(
            await builder.from('users').doesntExistOr(() => {
                throw new Error();
            })
        ).toBeTruthy();
    });

    it('Works ExistsOr', async () => {
        let builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async () => {
            return [{ exists: 0 }];
        });

        expect(await builder.from('users').existsOr(() => 123)).toBe(123);

        builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async () => {
            return [{ exists: 1 }];
        });

        expect(
            await builder.from('users').existsOr(() => {
                throw new Error();
            })
        ).toBeTruthy();
    });

    it('Works Aggregate Reset Followed By Get', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count(*) as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: 1 }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select sum("id") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: 2 }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select "column1", "column2" from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ column1: 'foo', column2: 'bar' }];
            });

        builder.from('users').select('column1', 'column2');
        expect(await builder.count()).toBe(1);
        expect(await builder.sum('id')).toBe(2);
        const res = await builder.get();
        expect(res).toEqual([{ column1: 'foo', column2: 'bar' }]);
    });

    it('Works Aggregate Reset Followed By Select Get', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("column1") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: 1 }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select "column2", "column3" from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ column2: 'foo', column3: 'bar' }];
            });

        builder.from('users');
        expect(await builder.count('column1')).toBe(1);
        const res = await builder.select('column2', 'column3').get();
        expect(res).toEqual([{ column2: 'foo', column3: 'bar' }]);
    });

    it('Works Aggregate Reset Followed By Get With Columns', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select')
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select count("column1") as aggregate from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ aggregate: 1 }];
            })
            .mockImplementationOnce(async (query, bindings, useReadPdo) => {
                expect(query).toBe('select "column2", "column3" from "users"');
                expect(bindings).toEqual([]);
                expect(useReadPdo).toBeTruthy();
                return [{ column2: 'foo', column3: 'bar' }];
            });

        builder.from('users');
        expect(await builder.count('column1')).toBe(1);
        const res = await builder.get(['column2', 'column3']);
        expect(res).toEqual([{ column2: 'foo', column3: 'bar' }]);
    });

    it('Works Aggregate With SubSelect', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(*) as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        builder.from('users').selectSub(query => {
            query.from('posts').select('foo', 'bar').where('title', 'foo');
        }, 'post');
        expect(await builder.count()).toBe(1);
        expect('(select "foo", "bar" from "posts" where "title" = ?) as "post"').toBe(
            builder.getGrammar().getValue(builder.getRegistry().columns![0])
        );
        expect(['foo']).toEqual(builder.getBindings());
    });

    it('Works Explain', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe(
                'EXPLAIN select (select "foo", "bar" from "posts" where "title" = ?) as "post" from "users"'
            );
            expect(bindings).toEqual(['foo']);
            expect(useReadPdo).toBeUndefined();
            return [
                {
                    id: 1,
                    select_type: 'SIMPLE',
                    type: 'index',
                    possible_keys: null,
                    key: 'PRIMARY',
                    key_len: 8,
                    ref: null,
                    rows: 1800,
                    Extra: null
                }
            ];
        });

        builder.from('users').selectSub(query => {
            query.from('posts').select('foo', 'bar').where('title', 'foo');
        }, 'post');
        const explain = await builder.explain();
        expect(explain[0]).toEqual({
            id: 1,
            select_type: 'SIMPLE',
            type: 'index',
            possible_keys: null,
            key: 'PRIMARY',
            key_len: 8,
            ref: null,
            rows: 1800,
            Extra: null
        });
    });

    it('Works Lazy Throw Error', () => {
        let builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];
        expect(() => {
            builder.lazy(0);
        }).toThrow('The chunk size should be at least 1');

        expect(() => {
            builder.lazyById(0);
        }).toThrow('The chunk size should be at least 1');

        expect(() => {
            builder.lazyByIdDesc(0);
        }).toThrow('The chunk size should be at least 1');

        builder = getBuilder();
        expect(() => {
            builder.lazy(10);
        }).toThrow('You must specify an orderBy clause when using this function.');
    });

    it('Works Lazy Methods Return Async Generator', () => {
        let builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];
        expect(Symbol.asyncIterator in builder.lazy()).toBeTruthy();
        builder = getBuilder();
        expect(Symbol.asyncIterator in builder.lazyById()).toBeTruthy();
        builder = getBuilder();
        expect(Symbol.asyncIterator in builder.lazyByIdDesc()).toBeTruthy();
    });

    it('Works Lazy Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2'];
        const chunk2 = ['foo3', 'foo4'];
        const chunk3: any[] = [];
        const spiedGet = jest
            .spyOn(builder, 'get')
            .mockImplementationOnce(async () => {
                return chunk1;
            })
            .mockImplementationOnce(async () => {
                return chunk2;
            })
            .mockImplementationOnce(async () => {
                return chunk3;
            });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        for await (const item of builder.lazy(2)) {
            callback(item);
        }

        expect(spiedGet).toHaveBeenCalledTimes(3);
        expect(spiedForPage).toHaveBeenCalledTimes(3);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(2, 2, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(3, 3, 2);
        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, 'foo1');
        expect(callback).toHaveBeenNthCalledWith(2, 'foo2');
        expect(callback).toHaveBeenNthCalledWith(3, 'foo3');
        expect(callback).toHaveBeenNthCalledWith(4, 'foo4');
    });

    it('Works Lazy By Id With Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const chunk2 = [{ someIdField: 10 }, { someIdField: 11 }];
        const chunk3: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk3;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            });

        const callback = jest.fn();

        for await (const item of builder.lazyById(2, 'someIdField')) {
            callback(item);
        }

        expect(spiedClone).toHaveBeenCalledTimes(3);
        expect(spiedForPage.length).toBe(3);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'someIdField');
        expect(spiedForPage[2]).toHaveBeenCalledWith(2, 11, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, { someIdField: 1 });
        expect(callback).toHaveBeenNthCalledWith(2, { someIdField: 2 });
        expect(callback).toHaveBeenNthCalledWith(3, { someIdField: 10 });
        expect(callback).toHaveBeenNthCalledWith(4, { someIdField: 11 });
    });

    it('Works Lazy By Id Desc With Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'desc' }];

        const chunk1 = [{ someIdField: 11 }, { someIdField: 10 }];
        const chunk2 = [{ someIdField: 2 }, { someIdField: 1 }];
        const chunk3: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk3;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            });

        const callback = jest.fn();

        for await (const item of builder.lazyByIdDesc(2, 'someIdField')) {
            callback(item);
        }

        expect(spiedClone).toHaveBeenCalledTimes(3);
        expect(spiedForPage.length).toBe(3);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 10, 'someIdField');
        expect(spiedForPage[2]).toHaveBeenCalledWith(2, 1, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, { someIdField: 11 });
        expect(callback).toHaveBeenNthCalledWith(2, { someIdField: 10 });
        expect(callback).toHaveBeenNthCalledWith(3, { someIdField: 2 });
        expect(callback).toHaveBeenNthCalledWith(4, { someIdField: 1 });
    });

    it('Works Lazy Paginates Using Id Throw Error When Column Is Null Or Does Not Exists', async () => {
        let builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        let chunk1: Array<{ [key: string]: number | null }> = [{ someIdField: 1 }, { notId: 2 }];
        let spiedForPage: jest.SpyInstance[] = [];
        let spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
            return builder;
        });

        let callback = jest.fn();

        try {
            for await (const item of builder.lazyById(2, 'id', 'someIdField')) {
                callback(item);
            }
        } catch (error: any) {
            expect(error.message).toBe(
                'The lazyById operation was aborted because the [someIdField] column is not present in the query result.'
            );
        }

        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, { someIdField: 1 });
        expect(callback).toHaveBeenNthCalledWith(2, { notId: 2 });

        builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'desc' }];

        chunk1 = [{ id: 10 }, { id: null }];
        spiedForPage = [];
        spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
            return builder;
        });

        callback = jest.fn();

        try {
            for await (const item of builder.lazyByIdDesc(2, 'id')) {
                callback(item);
            }
        } catch (error: any) {
            expect(error.message).toBe(
                'The lazyById operation was aborted because the [id] column is not present in the query result.'
            );
        }
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, { id: 10 });
        expect(callback).toHaveBeenNthCalledWith(2, { id: null });
    });

    it('Works Cursor Return Async Generator', async () => {
        const builder = getBuilder();
        builder.from('users');
        expect(Symbol.asyncIterator in builder.cursor()).toBeTruthy();
    });

    it('Works Cursor Can Be Iterate', async () => {
        let builder = getBuilder();
        builder.from('users');
        jest.spyOn(builder.getConnection(), 'cursor').mockImplementationOnce((sql, bindings, useReadPdo) => {
            expect(sql).toBe('select * from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return Promise.resolve(
                (function* () {
                    yield { id: 1 };
                    yield { id: 2 };
                    yield { id: 3 };
                    yield { id: 4 };
                })()
            );
        });

        let callback = jest.fn();

        for await (const item of builder.cursor()) {
            callback(item);
        }

        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, { id: 1 });
        expect(callback).toHaveBeenNthCalledWith(2, { id: 2 });
        expect(callback).toHaveBeenNthCalledWith(3, { id: 3 });
        expect(callback).toHaveBeenNthCalledWith(4, { id: 4 });

        builder = getBuilder();
        builder.from('users').select('id');
        jest.spyOn(builder.getConnection(), 'cursor').mockImplementationOnce((sql, bindings, useReadPdo) => {
            expect(sql).toBe('select "id" from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return Promise.resolve(
                (function* () {
                    yield { id: 1 };
                    yield { id: 2 };
                    yield { id: 3 };
                    yield { id: 4 };
                })()
            );
        });

        callback = jest.fn();

        for await (const item of builder.cursor()) {
            callback(item);
        }

        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, { id: 1 });
        expect(callback).toHaveBeenNthCalledWith(2, { id: 2 });
        expect(callback).toHaveBeenNthCalledWith(3, { id: 3 });
        expect(callback).toHaveBeenNthCalledWith(4, { id: 4 });
    });

    it('Works Chunk With Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2'];
        const chunk2 = ['foo3', 'foo4'];
        const chunk3: any[] = [];
        const spiedGet = jest
            .spyOn(builder, 'get')
            .mockImplementationOnce(async () => {
                return chunk1;
            })
            .mockImplementationOnce(async () => {
                return chunk2;
            })
            .mockImplementationOnce(async () => {
                return chunk3;
            });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(2, results => {
            callback(results);
        });
        expect(spiedGet).toHaveBeenCalledTimes(3);
        expect(spiedForPage).toHaveBeenCalledTimes(3);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(2, 2, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(3, 3, 2);
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk With Orders Throw Error', async () => {
        const builder = getBuilder();

        await expect(builder.chunk(2, () => {})).rejects.toThrow(
            'You must specify an orderBy clause when using this function.'
        );
    });

    it('Works Chunk With Last Chunk Partial', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2'];
        const chunk2 = ['foo3'];
        const spiedGet = jest
            .spyOn(builder, 'get')
            .mockImplementationOnce(async () => {
                return chunk1;
            })
            .mockImplementationOnce(async () => {
                return chunk2;
            });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(2, results => {
            callback(results);
        });
        expect(spiedGet).toHaveBeenCalledTimes(2);
        expect(spiedForPage).toHaveBeenCalledTimes(2);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(2, 2, 2);
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Can Be Stopped By Returning False', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2'];
        const chunk2 = ['foo3'];
        const spiedGet = jest
            .spyOn(builder, 'get')
            .mockImplementationOnce(async () => {
                return chunk1;
            })
            .mockImplementationOnce(async () => {
                return chunk2;
            });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(2, results => {
            callback(results);
            return false;
        });
        expect(spiedGet).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk With Count Zero', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2'];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return chunk1;
        });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(0, results => {
            callback(results);
        });
        expect(spiedGet).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Without Results', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1: any[] = [];

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return chunk1;
        });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(0, results => {
            callback(results);
        });
        expect(spiedGet).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 0);
        expect(callback).toHaveBeenCalledTimes(0);
    });

    it('Works Each', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2'];
        const chunk2 = ['foo3', 'foo4'];
        const chunk3: any[] = [];
        const spiedChunk = jest.spyOn(builder, 'chunk');
        const spiedGet = jest
            .spyOn(builder, 'get')
            .mockImplementationOnce(async () => {
                return chunk1;
            })
            .mockImplementationOnce(async () => {
                return chunk2;
            })
            .mockImplementationOnce(async () => {
                return chunk3;
            });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.each(async item => {
            callback(item);
        }, 2);
        expect(spiedChunk).toHaveBeenCalledTimes(1);
        expect(spiedChunk).toHaveBeenCalledWith(2, expect.any(Function));
        expect(spiedGet).toHaveBeenCalledTimes(3);
        expect(spiedForPage).toHaveBeenCalledTimes(3);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(2, 2, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(3, 3, 2);
        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, 'foo1');
        expect(callback).toHaveBeenNthCalledWith(2, 'foo2');
        expect(callback).toHaveBeenNthCalledWith(3, 'foo3');
        expect(callback).toHaveBeenNthCalledWith(4, 'foo4');
    });

    it('Works Each By Id', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const chunk2 = [{ someIdField: 10 }, { someIdField: 11 }];
        const chunk3: any[] = [];
        const spiedChunk = jest.spyOn(builder, 'chunkById');
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk3;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.eachById(
            result => {
                callback(result);
            },
            2,
            'someIdField'
        );
        expect(spiedChunk).toHaveBeenCalledTimes(1);
        expect(spiedClone).toHaveBeenCalledTimes(3);
        expect(spiedForPage.length).toBe(3);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'someIdField');
        expect(spiedForPage[2]).toHaveBeenCalledWith(2, 11, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, { someIdField: 1 });
        expect(callback).toHaveBeenNthCalledWith(2, { someIdField: 2 });
        expect(callback).toHaveBeenNthCalledWith(3, { someIdField: 10 });
        expect(callback).toHaveBeenNthCalledWith(4, { someIdField: 11 });
    });

    it('Works Each By Id Can Be Stopped By Returning False', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ id: 1 }, { id: 2 }];
        const spiedChunk = jest.spyOn(builder, 'chunkById');
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
            return builder;
        });

        const callback = jest.fn();

        await builder.eachById(result => {
            callback(result);
            return false;
        });
        expect(spiedChunk).toHaveBeenCalledTimes(1);
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(1000, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, { id: 1 });
    });

    it('Works Chunk Map', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2', 'foo5', 'foo7'];

        const spiedChunk = jest.spyOn(builder, 'chunk');
        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return chunk1;
        });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        expect(
            await builder.chunkMap<number, string>(async item => {
                return Number(item.replace('foo', ''));
            })
        ).toEqual([1, 2, 5, 7]);
        expect(spiedChunk).toHaveBeenCalledTimes(1);
        expect(spiedChunk).toHaveBeenCalledWith(1000, expect.any(Function));
        expect(spiedGet).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 1000);
    });

    it('Works Each Can Be Stopped By Returning False', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = ['foo1', 'foo2', 'foo3', 'foo4'];
        const spiedChunk = jest.spyOn(builder, 'chunk');
        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return chunk1;
        });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.each(async (item, index) => {
            callback(item);
            if (index === 2) {
                return false;
            }
            return;
        });
        expect(spiedChunk).toHaveBeenCalledTimes(1);
        expect(spiedChunk).toHaveBeenCalledWith(1000, expect.any(Function));
        expect(spiedGet).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 1000);
        expect(callback).toHaveBeenCalledTimes(3);
        expect(callback).toHaveBeenNthCalledWith(1, 'foo1');
        expect(callback).toHaveBeenNthCalledWith(2, 'foo2');
        expect(callback).toHaveBeenNthCalledWith(3, 'foo3');
    });

    it('Works Chunk Paginates Using Id With Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const chunk2 = [{ someIdField: 10 }, { someIdField: 11 }];
        const chunk3: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk3;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkById(
            2,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(3);
        expect(spiedForPage.length).toBe(3);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'someIdField');
        expect(spiedForPage[2]).toHaveBeenCalledWith(2, 11, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Paginates Using Id Can Be Stopped By Returning False', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ id: 1 }, { id: 2 }];
        const chunk2 = [{ id: 10 }, { id: 11 }];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkById(2, results => {
            callback(results);
            return false;
        });
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Desc Paginates Using Id Can Be Stopped By Returning False', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ id: 1 }, { id: 2 }];
        const chunk2 = [{ id: 10 }, { id: 11 }];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkByIdDesc(2, results => {
            callback(results);
            return false;
        });
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Paginates Using Id Throw Error When Column Is Null Or Does Not Exists', async () => {
        let builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        let chunk1: Array<{ [key: string]: number | null }> = [{ id: 1 }, { notId: 2 }];
        let spiedForPage: jest.SpyInstance[] = [];
        let spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
            return builder;
        });

        let callback = jest.fn();

        await expect(
            builder.chunkById(2, results => {
                callback(results);
            })
        ).rejects.toThrow(
            'The chunkById operation was aborted because the [id] column is not present in the query result.'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);

        builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        chunk1 = [{ id: 1 }, { id: null }];
        spiedForPage = [];
        spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
            return builder;
        });

        callback = jest.fn();

        await expect(
            builder.chunkById(2, results => {
                callback(results);
            })
        ).rejects.toThrow(
            'The chunkById operation was aborted because the [id] column is not present in the query result.'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Desc Paginates Using Id Throw Error When Column Is Null Or Does Not Exists', async () => {
        let builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        let chunk1: Array<{ [key: string]: number | null }> = [{ id: 1 }, { notId: 2 }];
        let spiedForPage: jest.SpyInstance[] = [];
        let spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
            return builder;
        });

        let callback = jest.fn();

        await expect(
            builder.chunkByIdDesc(2, results => {
                callback(results);
            })
        ).rejects.toThrow(
            'The chunkById operation was aborted because the [id] column is not present in the query result.'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);

        builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        chunk1 = [{ id: 1 }, { id: null }];
        spiedForPage = [];
        spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
            return builder;
        });

        callback = jest.fn();

        await expect(
            builder.chunkByIdDesc(2, results => {
                callback(results);
            })
        ).rejects.toThrow(
            'The chunkById operation was aborted because the [id] column is not present in the query result.'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Paginates Using Id With Last Chunk Partial', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const chunk2 = [{ someIdField: 10 }];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkById(
            2,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(2);
        expect(spiedForPage.length).toBe(2);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Desc Paginates Using Id With Last Chunk Partial', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const chunk2 = [{ someIdField: 10 }];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkByIdDesc(
            2,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(2);
        expect(spiedForPage.length).toBe(2);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Paginates Using Id With Count Zero', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
            return builder;
        });

        const callback = jest.fn();

        await builder.chunkById(
            0,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(0, null, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Desc Paginates Using Id With Count Zero', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ someIdField: 1 }, { someIdField: 2 }];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
            return builder;
        });

        const callback = jest.fn();

        await builder.chunkByIdDesc(
            0,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(0, null, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Paginates Using Id Without Results', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
            return builder;
        });

        const callback = jest.fn();

        await builder.chunkById(
            0,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(0, null, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(0);
    });

    it('Works Chunk Desc Paginates Using Id Without Results', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest.spyOn(builder, 'clone').mockImplementationOnce(() => {
            const builder = getBuilder();
            jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                return chunk1;
            });
            spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
            return builder;
        });

        const callback = jest.fn();

        await builder.chunkByIdDesc(
            0,
            results => {
                callback(results);
            },
            'someIdField'
        );
        expect(spiedClone).toHaveBeenCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toHaveBeenCalledWith(0, null, 'someIdField');
        expect(callback).toHaveBeenCalledTimes(0);
    });

    it('Works Chunk Paginates Using Id With Alias', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ table_id: 1 }, { table_id: 2 }];
        const chunk2: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageAfterId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkById(
            2,
            results => {
                callback(results);
            },
            'table.id',
            'table_id'
        );
        expect(spiedClone).toHaveBeenCalledTimes(2);
        expect(spiedForPage.length).toBe(2);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'table.id');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'table.id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Desc Paginates Using Id With Alias', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = [{ table_id: 1 }, { table_id: 2 }];
        const chunk2: any[] = [];
        const spiedForPage: jest.SpyInstance[] = [];
        const spiedClone = jest
            .spyOn(builder, 'clone')
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk1;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            })
            .mockImplementationOnce(() => {
                const builder = getBuilder();
                jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
                    return chunk2;
                });
                spiedForPage.push(jest.spyOn(builder, 'forPageBeforeId'));
                return builder;
            });

        const callback = jest.fn();

        await builder.chunkByIdDesc(
            2,
            results => {
                callback(results);
            },
            'table.id',
            'table_id'
        );
        expect(spiedClone).toHaveBeenCalledTimes(2);
        expect(spiedForPage.length).toBe(2);
        expect(spiedForPage[0]).toHaveBeenCalledWith(2, null, 'table.id');
        expect(spiedForPage[1]).toHaveBeenCalledWith(2, 2, 'table.id');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });
});
