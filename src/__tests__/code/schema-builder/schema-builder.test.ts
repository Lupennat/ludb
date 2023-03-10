import Raw from '../../../query/expression';
import Blueprint from '../../../schema/blueprint';
import Builder from '../../../schema/builders/builder';
import Grammar from '../../../schema/grammars/grammar';
import { MockedSchemaBuilder, getConnection, getConnection2 } from '../fixtures/mocked';

describe('Schema Builder Test', () => {
    it('Works With Default String Length', async () => {
        expect(Builder.defaultStringLength).toBe(255);
        Builder.withDefaultStringLength(100);
        expect(Builder.defaultStringLength).toBe(100);
        Builder.withDefaultStringLength(255);
        expect(Builder.defaultStringLength).toBe(255);
    });

    it('Works With Default Morph Key Type', async () => {
        expect(Builder.defaultMorphKeyType).toBe('int');
        Builder.withDefaultMorphKeyType('ulid');
        expect(Builder.defaultMorphKeyType).toBe('ulid');
        Builder.withDefaultMorphKeyType('uuid');
        expect(Builder.defaultMorphKeyType).toBe('uuid');
        Builder.withDefaultMorphKeyType('int');
        expect(Builder.defaultMorphKeyType).toBe('int');
        expect(() => {
            // @ts-expect-error test wrong parameter
            Builder.withDefaultMorphKeyType('not-valid');
        }).toThrowError("Morph key type must be 'int', 'uuid', or 'ulid'.");
        Builder.morphUsingUuids();
        expect(Builder.defaultMorphKeyType).toBe('uuid');
        Builder.morphUsingUlids();
        expect(Builder.defaultMorphKeyType).toBe('ulid');
        Builder.morphUsingInts();
        expect(Builder.defaultMorphKeyType).toBe('int');
    });

    it('Works Create Database', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.createDatabase('foo')).rejects.toThrowError(
            'This database driver does not support creating databases.'
        );
    });

    it('Works Drop All Tables', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropAllTables()).rejects.toThrowError(
            'This database driver does not support dropping tables.'
        );
    });

    it('Works Drop All Types', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropAllTypes()).rejects.toThrowError(
            'This database driver does not support dropping types.'
        );
    });

    it('Works Drop All Views', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropAllViews()).rejects.toThrowError(
            'This database driver does not support dropping views.'
        );
    });

    it('Works Drop Database If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropDatabaseIfExists('foo')).rejects.toThrowError(
            'This database driver does not support dropping databases.'
        );
    });

    it('Works Get All Tables', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getAllTables()).rejects.toThrowError(
            'This database driver does not support retrieval of table names.'
        );
    });

    it('Works Get All Views', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getAllViews()).rejects.toThrowError(
            'This database driver does not support retrieval of view names.'
        );
    });

    it('Works Get All Types', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getAllTypes()).rejects.toThrowError(
            'This database driver does not support retrieval of type names.'
        );
    });

    it('Works Has Table', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session.getSchemaGrammar(), 'compileTableExists').mockReturnValue('sql');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (query, bindings) => {
                expect(query).toBe('sql');
                expect(bindings).toEqual(['prefix_table']);
                return [];
            })
            .mockImplementationOnce(async () => {
                return ['prefix_table'];
            });
        expect(await builder.hasTable('table')).toBeFalsy();
        expect(await builder.hasTable('table')).toBeTruthy();
    });

    it('Works Has Column', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getColumnListing').mockImplementation(async table => {
            expect(table).toEqual('users');
            return ['id', 'name'];
        });
        expect(await builder.hasColumn('users', 'ID')).toBeTruthy();
        expect(await builder.hasColumn('users', 'address')).toBeFalsy();
    });

    it('Works Has Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getColumnListing').mockImplementation(async table => {
            expect(table).toEqual('users');
            return ['id', 'name'];
        });
        expect(await builder.hasColumns('users', ['ID', 'name'])).toBeTruthy();
        expect(await builder.hasColumns('users', ['ID', 'address'])).toBeFalsy();
    });

    it('Works When Table Has Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'hasColumn').mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await builder.whenTableHasColumn('users', 'id', callback);
        expect(callback).toBeCalledTimes(1);
        await builder.whenTableHasColumn('users', 'name', callback);
        expect(callback).toBeCalledTimes(1);
    });

    it('Works When Table Doesnt Have Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'hasColumn').mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await builder.whenTableDoesntHaveColumn('users', 'id', callback);
        expect(callback).toBeCalledTimes(1);
        await builder.whenTableDoesntHaveColumn('users', 'name', callback);
        expect(callback).toBeCalledTimes(1);
    });

    it('Works Get Column Type', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getColumnType('users', 'id')).rejects.toThrowError(
            'This database driver does not support column type.'
        );
    });

    it('Works Get Column Listing', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getColumnListing('users')).rejects.toThrowError(
            'This database driver does not support column listing.'
        );
    });

    it('Works Blueprint Resolver', () => {
        const session = getConnection().sessionSchema();
        jest.spyOn(session, 'getConfig')
            .mockImplementationOnce(option => {
                expect(option).toBe('prefix_indexes');
                return true;
            })
            .mockImplementationOnce(option => {
                expect(option).toBe('prefix');
                return 'prefix_';
            });
        const builder = new MockedSchemaBuilder(session);
        const resolver = jest.fn();
        builder.blueprintResolver(resolver);
        const callback = jest.fn();
        builder.createBlueprint('users', callback);
        expect(resolver).toBeCalledWith('users', expect.any(Grammar), callback, 'prefix_');
    });

    it('Works Table', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await builder.table('users', callback);
        expect(callback).toBeCalledTimes(1);
    });

    it('Works Create', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await expect(builder.create('users', callback)).rejects.toThrowError(
            'This database driver does not support create table.'
        );

        expect(callback).toBeCalledTimes(1);
    });

    it('Works Drop', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.drop('users')).rejects.toThrowError('This database driver does not support drop table.');
    });

    it('Works Drop If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.dropIfExists('users')).rejects.toThrowError(
            'This database driver does not support drop table if exists.'
        );
    });

    it('Works Drop Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.dropColumns('users', ['id', 'name'])).rejects.toThrowError(
            'This database driver does not support drop column.'
        );
    });

    it('Works Rename', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.rename('users', new Raw('uzers'))).rejects.toThrowError(
            'This database driver does not support rename table.'
        );
    });

    it('Works Enable Foreign Key Constraints', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.enableForeignKeyConstraints()).rejects.toThrowError(
            'This database driver does not support foreign key enabling.'
        );
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.disableForeignKeyConstraints()).rejects.toThrowError(
            'This database driver does not support foreign key disabling.'
        );
    });

    it('Works Without Foreign Key Constraints', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        const called: string[] = [];
        jest.spyOn(builder, 'disableForeignKeyConstraints').mockImplementationOnce(async () => {
            called.push('disabled');
            return true;
        });
        jest.spyOn(builder, 'enableForeignKeyConstraints').mockImplementationOnce(async () => {
            called.push('enabled');
            return true;
        });
        const callback = jest.fn(() => {
            expect(called).toEqual(['disabled']);
        });

        await builder.withoutForeignKeyConstraints(callback);

        expect(callback).toBeCalledTimes(1);
        expect(called[0]).toEqual('disabled');
        expect(called[1]).toEqual('enabled');
    });

    it('Works Get Connection', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);

        expect(builder.getConnection()).toEqual(session);
    });

    it('Works Set Connection', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        const session2 = getConnection2().sessionSchema();
        builder.setConnection(session2);
        expect(builder.getConnection()).toEqual(session2);
        expect(builder.getConnection()).not.toEqual(session);
    });
});
