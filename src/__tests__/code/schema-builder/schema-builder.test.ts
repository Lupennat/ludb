import Raw from '../../../query/expression';
import Blueprint from '../../../schema/blueprint';
import Builder from '../../../schema/builders/builder';
import Grammar from '../../../schema/grammars/grammar';
import { MockedSchemaBuilder, getConnection } from '../fixtures/mocked';

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
        }).toThrow("Morph key type must be 'int', 'uuid', or 'ulid'.");
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
        await expect(builder.createDatabase('foo')).rejects.toThrow(
            'This database driver does not support creating databases.'
        );
    });

    it('Works Create View', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(
            builder.createView('foo', view =>
                view.as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).rejects.toThrow('This database driver does not support creating views.');
    });

    it('Works Create Type', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.createType('foo', 'domain', {})).rejects.toThrow(
            'This database driver does not support creating types.'
        );
    });

    it('Works Drop Tables', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropTables()).rejects.toThrow('This database driver does not support dropping tables.');
    });

    it('Works Drop Types', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropTypes()).rejects.toThrow('This database driver does not support dropping types.');
    });

    it('Works Drop Views', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropViews()).rejects.toThrow('This database driver does not support dropping views.');
    });

    it('Works Drop Database If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropDatabaseIfExists('foo')).rejects.toThrow(
            'This database driver does not support dropping databases.'
        );
    });

    it('Works Drop View', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropView('foo')).rejects.toThrow('This database driver does not support dropping views.');
    });

    it('Works Drop View If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropViewIfExists('foo')).rejects.toThrow(
            'This database driver does not support dropping views.'
        );
    });

    it('Works Drop Type', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropType('foo')).rejects.toThrow('This database driver does not support dropping types.');
    });

    it('Works Drop Type If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropTypeIfExists('foo')).rejects.toThrow(
            'This database driver does not support dropping types.'
        );
    });

    it('Works Drop Domain', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropDomain('foo')).rejects.toThrow(
            'This database driver does not support dropping domains.'
        );
    });

    it('Works Drop Domain If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.dropDomainIfExists('foo')).rejects.toThrow(
            'This database driver does not support dropping domains.'
        );
    });

    it('Works Get Tables', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getTables()).rejects.toThrow('This database driver does not support retrieval of tables.');
    });

    it('Works Get Views', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getViews()).rejects.toThrow('This database driver does not support retrieval of views.');
    });

    it('Works Get Types', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getTypes()).rejects.toThrow('This database driver does not support user-defined types.');
    });

    it('Works Has Table', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getTables')
            .mockImplementationOnce(async () => [])
            .mockImplementationOnce(async () => {
                return [
                    {
                        name: 'prefix_table'
                    }
                ];
            });

        expect(await builder.hasTable('table')).toBeFalsy();
        expect(await builder.hasTable('table')).toBeTruthy();
    });

    it('Works Has View', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getViews')
            .mockImplementationOnce(async () => [])
            .mockImplementationOnce(async () => {
                return [
                    {
                        name: 'prefix_view',
                        definition: 'definition'
                    }
                ];
            });

        expect(await builder.hasView('view')).toBeFalsy();
        expect(await builder.hasView('view')).toBeTruthy();
    });

    it('Works Get Column Type', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getColumns').mockImplementation(async table => {
            expect(table).toBe('table');
            return [
                {
                    name: 'column',
                    type_name: 'varchar',
                    type: 'varchar(255)',
                    nullable: true,
                    default: null,
                    auto_increment: false
                }
            ];
        });

        expect(await builder.getColumnType('table', 'column')).toBe('varchar');
        expect(await builder.getColumnType('table', 'column', true)).toBe('varchar(255)');
        await expect(builder.getColumnType('table', 'column2')).rejects.toThrow(
            `There is no column with name 'column2' on table 'prefix_table'.`
        );
    });

    it('Works Has Column', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getColumns').mockImplementation(async table => {
            expect(table).toEqual('users');
            return [
                {
                    name: 'id',
                    type_name: 'int',
                    type: 'int',
                    nullable: false,
                    default: null,
                    auto_increment: true
                },
                {
                    name: 'name',
                    type_name: 'varchar',
                    type: 'varchar',
                    nullable: false,
                    default: null,
                    auto_increment: false
                }
            ];
        });
        expect(await builder.hasColumn('users', 'ID')).toBeTruthy();
        expect(await builder.hasColumn('users', 'address')).toBeFalsy();
    });

    it('Works Has Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'getColumns').mockImplementation(async table => {
            expect(table).toEqual('users');
            return [
                {
                    name: 'id',
                    type_name: 'int',
                    type: 'int',
                    nullable: false,
                    default: null,
                    auto_increment: true
                },
                {
                    name: 'name',
                    type_name: 'varchar',
                    type: 'varchar',
                    nullable: false,
                    default: null,
                    auto_increment: false
                }
            ];
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
        expect(callback).toHaveBeenCalledTimes(1);
        await builder.whenTableHasColumn('users', 'name', callback);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works When Table Doesnt Have Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        jest.spyOn(builder, 'hasColumn').mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await builder.whenTableDoesntHaveColumn('users', 'id', callback);
        expect(callback).toHaveBeenCalledTimes(1);
        await builder.whenTableDoesntHaveColumn('users', 'name', callback);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Get Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getColumns('users')).rejects.toThrow(
            'This database driver does not support retrieval of columns.'
        );
    });

    it('Works Get Indexs', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getIndexes('users')).rejects.toThrow(
            'This database driver does not support retrieval of indexes.'
        );
    });

    it('Works Get Foreign Keys', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        await expect(builder.getForeignKeys('users')).rejects.toThrow(
            'This database driver does not support retrieval of foreign keys.'
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
        expect(resolver).toHaveBeenCalledWith('users', expect.any(Grammar), callback, 'prefix_');
    });

    it('Works Table', async () => {
        const session = getConnection().sessionSchema();
        const builder = new Builder(session);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await builder.table('users', callback);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Create', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        const callback = jest.fn(blueprint => {
            expect(blueprint).toBeInstanceOf(Blueprint);
        });
        await expect(builder.create('users', callback)).rejects.toThrow(
            'This database driver does not support create table.'
        );

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('Works Drop', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.drop('users')).rejects.toThrow('This database driver does not support drop table.');
    });

    it('Works Drop Table If Exists', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.dropTableIfExists('users')).rejects.toThrow(
            'This database driver does not support drop table if exists.'
        );
    });

    it('Works Drop Columns', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.dropColumns('users', ['id', 'name'])).rejects.toThrow(
            'This database driver does not support drop column.'
        );
    });

    it('Works Rename', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.rename('users', new Raw('uzers'))).rejects.toThrow(
            'This database driver does not support rename table.'
        );
    });

    it('Works Enable Foreign Key Constraints', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.enableForeignKeyConstraints()).rejects.toThrow(
            'This database driver does not support foreign key enabling.'
        );
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);
        await expect(builder.disableForeignKeyConstraints()).rejects.toThrow(
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

        expect(callback).toHaveBeenCalledTimes(1);
        expect(called[0]).toEqual('disabled');
        expect(called[1]).toEqual('enabled');
    });

    it('Works Get Connection', async () => {
        const session = getConnection().sessionSchema();
        const builder = new MockedSchemaBuilder(session);

        expect(builder.getConnection()).toEqual(session);
    });
});
