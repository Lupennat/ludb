import SqlServerBuilder from '../../schema/builders/sqlserver-builder';
import SqlServerSchemaGrammar from '../../schema/grammars/sqlserver-grammar';
import { getConnection } from '../fixtures/mocked';

describe('SqlServer Schema Builder Test', () => {
    it('Works Enable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'EXEC sp_msforeachtable @command1="print \'?\'", @command2="ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";'
            );
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlServerBuilder(session);
        expect(await builder.enableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlServerBuilder(session);
        expect(await builder.disableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Create Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('create database "db"');
            expect(bindings).toBeUndefined();
            return true;
        });
        const builder = new SqlServerBuilder(session);
        expect(await builder.createDatabase('db')).toBeTruthy();
    });

    it('Works Drop Database If Exists', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop database if exists "db"');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlServerBuilder(session);
        expect(await builder.dropDatabaseIfExists('db')).toBeTruthy();
    });

    it('Works Has Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select * from sys.sysobjects where id = object_id(?) and xtype in ('U', 'V')");
            expect(bindings).toEqual(['prefix_table']);
            return ['prefix_table'];
        });
        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.hasTable('table')).toBeTruthy();
    });

    it('Works Get Column Listing', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('select name from sys.columns where object_id = object_id(?)');
            expect(bindings).toEqual(['prefix_table']);
            return [{ name: 'column' }];
        });
        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
    });

    it('Works Get Column Type', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectOne')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select c.name, t.name 'type' from sys.columns c inner join sys.types t on c.user_type_id = t.user_type_id where object_id = object_id(?) and c.name = ?"
                );
                expect(bindings).toEqual(['prefix_table', 'column']);
                return { name: 'column', type: 'int' };
            })
            .mockImplementationOnce(async () => {
                return null;
            });
        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        await expect(builder.getColumnType('table', 'column')).rejects.toThrowError(
            'column "column" not found on table "prefix_table" with database "db".'
        );
    });

    it('Works Drop All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql.replace(/\s\s+/g, ' ')).toBe(
                    `DECLARE @sql NVARCHAR(MAX) = N''; SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' FROM sys.foreign_keys; EXEC sp_executesql @sql;`
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe("EXEC sp_msforeachtable 'DROP TABLE ?'");
                expect(bindings).toBeUndefined();
                return true;
            });
        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        await builder.dropAllTables();
    });

    it('Works Drop All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql.replace(/\s\s+/g, ' ')).toBe(
                "DECLARE @sql NVARCHAR(MAX) = N''; SELECT @sql += 'DROP VIEW ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + QUOTENAME(name) + ';' FROM sys.views; EXEC sp_executesql @sql;"
            );
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        await builder.dropAllViews();
    });

    it('Works Get All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select name, type from sys.tables where type = 'U'");
            expect(bindings).toBeUndefined();
            return [{ type: 'table', name: 'users' }];
        });

        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllTables()).toEqual(['users']);
    });

    it('Works Get All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SqlServerSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select name, type from sys.objects where type = 'V'");
            expect(bindings).toBeUndefined();
            return [{ type: 'table', name: 'view_users' }];
        });

        const builder = new SqlServerBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllViews()).toEqual(['view_users']);
    });
});
