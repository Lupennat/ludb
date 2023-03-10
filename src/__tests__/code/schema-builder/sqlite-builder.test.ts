import { existsSync, unlinkSync, writeFileSync } from 'node:fs';

import SQLiteSchemaGrammar from '../../../schema/grammars/sqlite-grammar';
import { MockedSQLiteSchemaBuilder, getConnection } from '../fixtures/mocked';

describe('SQLite Schema Builder Test', () => {
    it('Works Enable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('PRAGMA foreign_keys = ON;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        expect(await builder.enableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('PRAGMA foreign_keys = OFF;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        expect(await builder.disableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Create Database', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        const builder = new MockedSQLiteSchemaBuilder(session);
        const path = __dirname + '/db.sql';
        expect(await builder.createDatabase(path)).toBeTruthy();
        expect(existsSync(path)).toBeTruthy();
        unlinkSync(path);
        jest.spyOn(builder, 'writeFile').mockImplementationOnce(async () => {
            throw new Error('fake');
        });
        expect(await builder.createDatabase(path)).toBeFalsy();
        expect(existsSync(path)).toBeFalsy();
    });

    it('Works Drop Database If Exists', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const builder = new MockedSQLiteSchemaBuilder(session);
        const path = __dirname + '/db-drop.sql';
        expect(await builder.dropDatabaseIfExists(path)).toBeTruthy();
        writeFileSync(path, '');
        expect(existsSync(path)).toBeTruthy();
        expect(await builder.dropDatabaseIfExists(path)).toBeTruthy();
        expect(existsSync(path)).toBeFalsy();
        jest.spyOn(builder, 'existFile').mockReturnValueOnce(true);
        expect(await builder.dropDatabaseIfExists(path)).toBeFalsy();
    });

    it('Works Has Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select * from sqlite_master where type = 'table' and name = ?");
            expect(bindings).toEqual(['prefix_table']);
            return ['prefix_table'];
        });
        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.hasTable('table')).toBeTruthy();
    });

    it('Works Get Column Listing', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('pragma table_info("prefix_table")');
            expect(bindings).toBeUndefined();
            return [{ name: 'column' }];
        });
        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
    });

    it('Works Get Column Type', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('pragma table_xinfo("prefix_table")');
                expect(bindings).toBeUndefined();
                return [{ name: 'column', type: 'int' }];
            })
            .mockImplementationOnce(async () => {
                return [];
            });
        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        await expect(builder.getColumnType('table', 'column')).rejects.toThrowError(
            'column "column" not found on table "prefix_table" with database "db".'
        );
    });

    it('Works Drop All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('PRAGMA writable_schema = 1;');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe("delete from sqlite_master where type in ('table', 'index', 'trigger')");
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('PRAGMA writable_schema = 0;');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('vacuum');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        jest.spyOn(builder, 'createDatabase').mockImplementationOnce(async name => {
            expect(name).toBe('db');
            return true;
        });

        await builder.dropAllTables();
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue(':memory:');
        await builder.dropAllTables();
    });

    it('Works Drop All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('PRAGMA writable_schema = 1;');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe("delete from sqlite_master where type in ('view')");
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('PRAGMA writable_schema = 0;');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('vacuum');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        await builder.dropAllViews();
    });

    it('Works Get All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select type, name from sqlite_master where type = 'table' and name not like 'sqlite_%'");
            expect(bindings).toBeUndefined();
            return [{ type: 'table', name: 'users' }];
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllTables()).toEqual(['users']);
    });

    it('Works Get All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select type, name from sqlite_master where type = 'view'");
            expect(bindings).toBeUndefined();
            return [{ type: 'table', name: 'view_users' }];
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllViews()).toEqual(['view_users']);
    });
});
