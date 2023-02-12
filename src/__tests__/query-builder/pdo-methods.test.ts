import BuilderI from '../../types/query/builder';
import { getBuilder, pdo } from '../fixtures/mocked';

describe('Query Builder Pdo Methods', () => {
    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Increment Many Argument Validation', async () => {
        const builder = getBuilder();
        // @ts-expect-error test arguments validation
        await expect(builder.from('users').incrementEach({ col: 'a' })).rejects.toThrowError(
            "Non-numeric value passed as increment amount for column: 'col'."
        );
    });

    it('Works Find Returns First Result By ID', async () => {
        const builder = getBuilder();

        const spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(_query: BuilderI, results: Dictionary[]): Dictionary[] => {
            return results;
        });

        const spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
            return [
                {
                    foo: 'bar'
                }
            ];
        });

        const results = await builder.from('users').find(1);
        expect({ foo: 'bar' }).toEqual(results);
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedConnection).toBeCalledWith('select * from "users" where "id" = ? limit 1', [1], true);
        expect(spyedProcessor).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledWith(builder, [{ foo: 'bar' }]);
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
        const spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(_query: BuilderI, results: Dictionary[]): Dictionary[] => {
            return results;
        });

        const spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
            return [
                {
                    foo: 'bar'
                }
            ];
        });

        const results = await builder.from('users').where('id', '=', 1).first();
        expect({ foo: 'bar' }).toEqual(results);
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedConnection).toBeCalledWith('select * from "users" where "id" = ? limit 1', [1], true);
        expect(spyedProcessor).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledWith(builder, [{ foo: 'bar' }]);
    });

    it('Works Pluck Method Gets Collection Of Column Values', async () => {
        let builder = getBuilder();

        let spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(query: BuilderI, results: Dictionary[]): Dictionary[] => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
            return results;
        });

        let spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        const results = await builder.from('users').where('id', '=', 1).pluck<string>('foo');

        expect(['bar', 'baz']).toEqual(results.all());
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(query: BuilderI, results: Dictionary[]): Dictionary[] => {
            expect(query).toEqual(builder);
            expect(results).toEqual([
                { id: 1, foo: 'bar' },
                { id: 10, foo: 'baz' }
            ]);
            return results;
        });

        spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
            return [
                { id: 1, foo: 'bar' },
                { id: 10, foo: 'baz' }
            ];
        });

        const results2 = await builder.from('users').where('id', '=', 1).pluck<{ [key: string]: string }>('foo', 'id');
        expect({ 1: 'bar', 10: 'baz' }).toEqual(results2.all());
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledTimes(1);
    });

    it('Works Implode', async () => {
        // Test without glue.
        let builder = getBuilder();
        let spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(query: BuilderI, results: Dictionary[]): Dictionary[] => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
            return results;
        });

        let spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        let results = await builder.from('users').where('id', '=', 1).implode('foo');

        expect('barbaz').toEqual(results);
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledTimes(1);

        builder = getBuilder();
        spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(query: BuilderI, results: Dictionary[]): Dictionary[] => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }, { foo: 'baz' }]);
            return results;
        });

        spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async () => {
            return [{ foo: 'bar' }, { foo: 'baz' }];
        });

        results = await builder.from('users').where('id', '=', 1).implode('foo', ',');

        expect('bar,baz').toEqual(results);
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledTimes(1);
    });

    it('Works Value Method Returns Single Column', async () => {
        const builder = getBuilder();
        const spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(query: BuilderI, results: Dictionary[]): Dictionary[] => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ foo: 'bar' }]);
            return results;
        });

        const spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select "foo" from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ foo: 'bar' }];
        });

        const results = await builder.from('users').where('id', '=', 1).value<string>('foo');
        expect('bar').toBe(results);
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledTimes(1);
    });

    it('Works RawValue Method Returns Single Column', async () => {
        const builder = getBuilder();
        const spyedProcessor = jest.spyOn(builder.getProcessor(), 'processSelect');
        spyedProcessor.mockImplementation(<Dictionary>(query: BuilderI, results: Dictionary[]): Dictionary[] => {
            expect(query).toEqual(builder);
            expect(results).toEqual([{ 'UPPER("foo")': 'BAR' }]);
            return results;
        });

        const spyedConnection = jest.spyOn(builder.getConnection(), 'select');
        spyedConnection.mockImplementationOnce(async (query, bindings, useReadPdo) => {
            expect(query).toBe('select UPPER("foo") from "users" where "id" = ? limit 1');
            expect(bindings).toEqual([1]);
            expect(useReadPdo).toBeTruthy();
            return [{ 'UPPER("foo")': 'BAR' }];
        });

        const results = await builder.from('users').where('id', '=', 1).rawValue<string>('UPPER("foo")');
        expect('BAR').toBe(results);
        expect(spyedConnection).toBeCalledTimes(1);
        expect(spyedProcessor).toBeCalledTimes(1);
    });
});
