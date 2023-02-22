import Collection from '../../../collections/collection';
import Raw from '../../../query/expression';
import { getBuilder, getSqlServerBuilder, pdo } from '../../fixtures/mocked';

describe('Query Builder Pdo Methods Select', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Find Returns First Result By ID', async () => {
        const builder = getBuilder();

        const spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });

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
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedConnection).toBeCalledWith('select * from "users" where "id" = ? limit 1', [1], true);
        expect(spiedProcessor).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledWith(builder, [{ foo: 'bar' }]);
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
            });

        expect(data).toEqual(await builder.findOr(1, () => 'callback result'));
        expect(data).toEqual(await builder.findOr(1, ['column'], () => 'callback result'));
        expect('callback result').toBe(await builder.findOr(1, () => 'callback result'));
    });

    it('Works First Method Returns First Result', async () => {
        const builder = getBuilder();
        const spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });

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
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedConnection).toBeCalledWith('select * from "users" where "id" = ? limit 1', [1], true);
        expect(spiedProcessor).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledWith(builder, [{ foo: 'bar' }]);
    });

    it('Works Pluck Method Gets Collection Of Column Values', async () => {
        let builder = getBuilder();

        let spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((query, results) => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
            return results;
        });

        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        const results = await builder.from('users').where('id', '=', 1).pluck<string>('foo');

        expect(['bar', 'baz']).toEqual(results.all());
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((query, results) => {
            expect(query).toEqual(builder);
            expect(results).toEqual([
                { id: 1, foo: 'bar' },
                { id: 10, foo: 'baz' }
            ]);
            return results;
        });

        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [
                { id: 1, foo: 'bar' },
                { id: 10, foo: 'baz' }
            ];
        });

        const results2 = await builder.from('users').where('id', '=', 1).pluck<{ [key: string]: string }>('foo', 'id');
        expect({ 1: 'bar', 10: 'baz' }).toEqual(results2.all());
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);
    });

    it('Works Implode', async () => {
        // Test without glue.
        let builder = getBuilder();
        let spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((query, results) => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
            return results;
        });

        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        let results = await builder.from('users').where('id', '=', 1).implode('foo');

        expect('barbaz').toEqual(results);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((query, results) => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
            return results;
        });

        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        results = await builder.from('users').where('id', '=', 1).implode('foo', ',');

        expect('bar,baz').toEqual(results);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);
    });

    it('Works Value Method Returns Single Column', async () => {
        const builder = getBuilder();
        const spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((query, results) => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }]);
            return results;
        });

        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }];
        });

        const results = await builder.from('users').where('id', '=', 1).value<string>('foo');
        expect('bar').toBe(results);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);
    });

    it('Works RawValue Method Returns Single Column', async () => {
        const builder = getBuilder();
        const spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((query, results) => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ 'UPPER("foo")': 'BAR' }]);
            return results;
        });

        const spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select UPPER("foo") from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ 'UPPER("foo")': 'BAR' }];
        });

        const results = await builder.from('users').where('id', '=', 1).rawValue<string>('UPPER("foo")');
        expect('BAR').toBe(results);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);
    });

    it('Works Aggregate Functions', async () => {
        let builder = getBuilder();
        let spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });

        let spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(*) as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').count()).toBe(1);
        expect(spiedProcessor).toBeCalledTimes(1);
        expect(spiedConnection).toBeCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(distinct access, "id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').count([new Raw('distinct access'), 'id'])).toBe(1);
        expect(spiedConnection).toBeCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select exists(select * from "users") as "exists"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ exists: 1 }];
        });

        expect(await builder.from('users').exists()).toBeTruthy();
        expect(spiedConnection).toBeCalledTimes(1);

        builder = getBuilder();
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select exists(select * from "users") as "exists"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ exists: 0 }];
        });

        expect(await builder.from('users').doesntExist()).toBeTruthy();
        expect(spiedConnection).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select max("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').max('id')).toBe(1);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select min("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').min('id')).toBe(1);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select sum("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').sum('id')).toBe(1);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select sum("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: null }];
        });

        expect(await builder.from('users').sum('id')).toBe(0);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select avg("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').avg('id')).toBe(1);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
        spiedConnection = jest.spyOn(builder.getConnection(), 'select');
        spiedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select avg("id") as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        expect(await builder.from('users').average('id')).toBe(1);
        expect(spiedConnection).toBeCalledTimes(1);
        expect(spiedProcessor).toBeCalledTimes(1);
    });

    it('Works Aggregate', async () => {
        const builder = getBuilder();
        const spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
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
        const spiedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spiedProcessor.mockImplementation((_query, results) => {
            return results;
        });
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
        expect(spiedConnection).toBeCalledTimes(1);
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

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation((_query, results) => {
            return results;
        });

        builder.from('users').select('column1', 'column2');
        expect(await builder.count()).toBe(1);
        expect(await builder.sum('id')).toBe(2);
        const res = await builder.get();
        expect(res.all()).toEqual([{ column1: 'foo', column2: 'bar' }]);
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

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation((_query, results) => {
            return results;
        });

        builder.from('users');
        expect(await builder.count('column1')).toBe(1);
        const res = await builder.select('column2', 'column3').get();
        expect(res.all()).toEqual([{ column2: 'foo', column3: 'bar' }]);
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

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation((_query, results) => {
            return results;
        });

        builder.from('users');
        expect(await builder.count('column1')).toBe(1);
        const res = await builder.get(['column2', 'column3']);
        expect(res.all()).toEqual([{ column2: 'foo', column3: 'bar' }]);
    });

    it('Works Aggregate With SubSelect', async () => {
        const builder = getBuilder();
        jest.spyOn(builder.getConnection(), 'select').mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select count(*) as aggregate from "users"');
            expect(bindings).toEqual([]);
            expect(useReadPdo).toBeTruthy();
            return [{ aggregate: 1 }];
        });

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation((_query, results) => {
            return results;
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

        jest.spyOn(builder.getProcessor(), 'processSelect').mockImplementation((_query, results) => {
            return results;
        });

        builder.from('users').selectSub(query => {
            query.from('posts').select('foo', 'bar').where('title', 'foo');
        }, 'post');
        const explain = await builder.explain();
        expect(explain).toBeInstanceOf(Collection);
        expect(explain.first()).toEqual({
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

    it('Works Chunk With Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection(['foo1', 'foo2']) as Collection<unknown>;
        const chunk2 = new Collection(['foo3', 'foo4']) as Collection<unknown>;
        const chunk3 = new Collection() as Collection<unknown>;
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
        expect(spiedGet).toBeCalledTimes(3);
        expect(spiedForPage).toBeCalledTimes(3);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(2, 2, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(3, 3, 2);
        expect(callback).toBeCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk With Last Chunk Partial', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection(['foo1', 'foo2']) as Collection<unknown>;
        const chunk2 = new Collection(['foo3']) as Collection<unknown>;
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
        expect(spiedGet).toBeCalledTimes(2);
        expect(spiedForPage).toBeCalledTimes(2);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(spiedForPage).toHaveBeenNthCalledWith(2, 2, 2);
        expect(callback).toBeCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Can Be Stopped By Returning False', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection(['foo1', 'foo2']) as Collection<unknown>;
        const chunk2 = new Collection(['foo3']) as Collection<unknown>;
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
        expect(spiedGet).toBeCalledTimes(1);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 2);
        expect(callback).toBeCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk With Count Zero', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection(['foo1', 'foo2']) as Collection<unknown>;

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return chunk1;
        });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(0, results => {
            callback(results);
        });
        expect(spiedGet).toBeCalledTimes(1);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 0);
        expect(callback).toBeCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Without Results', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection() as Collection<unknown>;

        const spiedGet = jest.spyOn(builder, 'get').mockImplementationOnce(async () => {
            return chunk1;
        });
        const spiedForPage = jest.spyOn(builder, 'forPage');

        const callback = jest.fn();

        await builder.chunk(0, results => {
            callback(results);
        });
        expect(spiedGet).toBeCalledTimes(1);
        expect(spiedForPage).toBeCalledTimes(1);
        expect(spiedForPage).toHaveBeenNthCalledWith(1, 1, 0);
        expect(callback).toBeCalledTimes(0);
    });

    it('Works Chunk Paginates Using Id With Last Chunk Complete', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection([{ someIdField: 1 }, { someIdField: 2 }]) as Collection<unknown>;
        const chunk2 = new Collection([{ someIdField: 10 }, { someIdField: 11 }]) as Collection<unknown>;
        const chunk3 = new Collection() as Collection<unknown>;
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
        expect(spiedClone).toBeCalledTimes(3);
        expect(spiedForPage.length).toBe(3);
        expect(spiedForPage[0]).toBeCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toBeCalledWith(2, 2, 'someIdField');
        expect(spiedForPage[2]).toBeCalledWith(2, 11, 'someIdField');
        expect(callback).toBeCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Paginates Using Id With Last Chunk Partial', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection([{ someIdField: 1 }, { someIdField: 2 }]) as Collection<unknown>;
        const chunk2 = new Collection([{ someIdField: 10 }]) as Collection<unknown>;
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
        expect(spiedClone).toBeCalledTimes(2);
        expect(spiedForPage.length).toBe(2);
        expect(spiedForPage[0]).toBeCalledWith(2, null, 'someIdField');
        expect(spiedForPage[1]).toBeCalledWith(2, 2, 'someIdField');
        expect(callback).toBeCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
        expect(callback).toHaveBeenNthCalledWith(2, chunk2);
    });

    it('Works Chunk Paginates Using Id With Count Zero', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection([{ someIdField: 1 }, { someIdField: 2 }]) as Collection<unknown>;
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
        expect(spiedClone).toBeCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toBeCalledWith(0, null, 'someIdField');
        expect(callback).toBeCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });

    it('Works Chunk Paginates Using Id Without Results', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection() as Collection<unknown>;
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
        expect(spiedClone).toBeCalledTimes(1);
        expect(spiedForPage.length).toBe(1);
        expect(spiedForPage[0]).toBeCalledWith(0, null, 'someIdField');
        expect(callback).toBeCalledTimes(0);
    });

    it('Works Chunk Paginates Using Id With Alias', async () => {
        const builder = getBuilder();
        builder.getRegistry().orders = [{ column: 'foobar', direction: 'asc' }];

        const chunk1 = new Collection([{ table_id: 1 }, { table_id: 2 }]) as Collection<unknown>;
        const chunk2 = new Collection() as Collection<unknown>;
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
        expect(spiedClone).toBeCalledTimes(2);
        expect(spiedForPage.length).toBe(2);
        expect(spiedForPage[0]).toBeCalledWith(2, null, 'table.id');
        expect(spiedForPage[1]).toBeCalledWith(2, 2, 'table.id');
        expect(callback).toBeCalledTimes(1);
        expect(callback).toHaveBeenNthCalledWith(1, chunk1);
    });
});