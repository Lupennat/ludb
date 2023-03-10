import PostgresBuilder from '../../../schema/builders/postgres-builder';
import PostgresSchemaGrammar from '../../../schema/grammars/postgres-grammar';
import { getConnection } from '../fixtures/mocked';

describe('Postgres Schema Builder Test', () => {
    it('Works Enable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('SET CONSTRAINTS ALL IMMEDIATE;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new PostgresBuilder(session);
        expect(await builder.enableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('SET CONSTRAINTS ALL DEFERRED;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new PostgresBuilder(session);
        expect(await builder.disableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Create Database', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create database "db"');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create database "db" encoding "latin1"');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new PostgresBuilder(session);
        expect(await builder.createDatabase('db')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('latin1');
        expect(await builder.createDatabase('db')).toBeTruthy();
    });

    it('Works Drop Database If Exists', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop database if exists "db"');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new PostgresBuilder(session);
        expect(await builder.dropDatabaseIfExists('db')).toBeTruthy();
    });

    it('Works Has Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_catalog = ? and table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db', 'public', 'prefix_table']);
                return ['prefix_table'];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_catalog = ? and table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db', 'search_path', 'prefix_table']);
                return ['prefix_table'];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_catalog = ? and table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db', 'schema', 'prefix_table']);
                return ['prefix_table'];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_catalog = ? and table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db2', 'schema2', 'prefix_table2']);
                return ['prefix_table'];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_catalog = ? and table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db', 'claudio', 'prefix_table']);
                return ['prefix_table'];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.hasTable('table')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.hasTable('table')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.hasTable('table')).toBeTruthy();
        expect(await builder.hasTable('db2.schema2.table2')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.hasTable('table')).toBeTruthy();
    });

    it('Works Get Column Listing', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db', 'public', 'prefix_table']);
                return [{ column_name: 'column' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db', 'search_path', 'prefix_table']);
                return [{ column_name: 'column' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db', 'schema', 'prefix_table']);
                return [{ column_name: 'column' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db2', 'schema2', 'prefix_table2']);
                return [{ column_name: 'column' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db', 'claudio', 'prefix_table']);
                return [{ column_name: 'column' }];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
        expect(await builder.getColumnListing('db2.schema2.table2')).toEqual(['column']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
    });

    it('Works Get Column Type', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectOne')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name, data_type from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db', 'public', 'prefix_table', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name, data_type from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db', 'search_path', 'prefix_table', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name, data_type from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db', 'schema', 'prefix_table', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name, data_type from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db2', 'schema2', 'prefix_table2', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name, data_type from information_schema.columns where table_catalog = ? and table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db', 'claudio', 'prefix_table', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async () => {
                return null;
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        expect(await builder.getColumnType('db2.schema2.table2', 'column')).toEqual('int');
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        await expect(builder.getColumnType('table', 'column')).rejects.toThrowError(
            'column "column" not found on table "prefix_table" with schema "public" and database "db".'
        );
    });

    it('Works Drop All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest
            .spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop table "users","companies" cascade');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop table "users","spatial_ref_sys" cascade');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getAllTables')
            .mockResolvedValueOnce(['users', 'companies', 'spatial_ref_sys'])
            .mockResolvedValueOnce(['users', 'companies', 'spatial_ref_sys'])
            .mockResolvedValueOnce([]);

        await builder.dropAllTables();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce(['companies']);
        await builder.dropAllTables();
        await builder.dropAllTables();
        expect(getAllSpied).toBeCalledTimes(3);
        expect(stmtSpied).toBeCalledTimes(2);
    });

    it('Works Drop All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view "view_users","view_companies" cascade');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getAllViews')
            .mockResolvedValueOnce(['view_users', 'view_companies'])
            .mockResolvedValueOnce([]);

        await builder.dropAllViews();
        await builder.dropAllViews();
        expect(getAllSpied).toBeCalledTimes(2);
        expect(stmtSpied).toBeCalledTimes(1);
    });

    it('Works Drop All Types', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop type "enum_status" cascade');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getAllTypes')
            .mockResolvedValueOnce(['enum_status'])
            .mockResolvedValueOnce([]);

        await builder.dropAllTypes();
        await builder.dropAllTypes();
        expect(getAllSpied).toBeCalledTimes(2);
        expect(stmtSpied).toBeCalledTimes(1);
    });

    it('Works Get All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select tablename, concat('\"', schemaname, '\".\"', tablename, '\"') as qualifiedname from pg_catalog.pg_tables where schemaname in ('public')"
                );
                expect(bindings).toBeUndefined();
                return [{ qualifiedname: '"public"."users"', tablename: 'users' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select tablename, concat('\"', schemaname, '\".\"', tablename, '\"') as qualifiedname from pg_catalog.pg_tables where schemaname in ('search_path')"
                );
                expect(bindings).toBeUndefined();
                return [{ tablename: 'users' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select tablename, concat('\"', schemaname, '\".\"', tablename, '\"') as qualifiedname from pg_catalog.pg_tables where schemaname in ('schema')"
                );
                expect(bindings).toBeUndefined();
                return [{ qualifiedname: '', tablename: 'users' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select tablename, concat('\"', schemaname, '\".\"', tablename, '\"') as qualifiedname from pg_catalog.pg_tables where schemaname in ('claudio')"
                );
                expect(bindings).toBeUndefined();
                return [{ qualifiedname: '"public"."users"', tablename: 'users' }];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getAllTables()).toEqual(['"public"."users"']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getAllTables()).toEqual(['users']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getAllTables()).toEqual(['users']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getAllTables()).toEqual(['"public"."users"']);
    });

    it('Works Get All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);

        jest.spyOn(session, 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select viewname, concat('\"', schemaname, '\".\"', viewname, '\"') as qualifiedname from pg_catalog.pg_views where schemaname in ('public')"
                );
                expect(bindings).toBeUndefined();
                return [{ qualifiedname: '"public"."view_users"', viewname: 'view_users' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select viewname, concat('\"', schemaname, '\".\"', viewname, '\"') as qualifiedname from pg_catalog.pg_views where schemaname in ('search_path')"
                );
                expect(bindings).toBeUndefined();
                return [{ viewname: 'view_users' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select viewname, concat('\"', schemaname, '\".\"', viewname, '\"') as qualifiedname from pg_catalog.pg_views where schemaname in ('schema')"
                );
                expect(bindings).toBeUndefined();
                return [{ qualifiedname: '', viewname: 'view_users' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select viewname, concat('\"', schemaname, '\".\"', viewname, '\"') as qualifiedname from pg_catalog.pg_views where schemaname in ('claudio')"
                );
                expect(bindings).toBeUndefined();
                return [{ qualifiedname: '"public"."view_users"', viewname: 'view_users' }];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getAllViews()).toEqual(['"public"."view_users"']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getAllViews()).toEqual(['view_users']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getAllViews()).toEqual(['view_users']);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getAllViews()).toEqual(['"public"."view_users"']);
    });

    it('Works Get All Types', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectColumn').mockImplementationOnce(async (column, sql, bindings) => {
            expect(column).toBe(0);
            expect(sql).toBe(
                'select distinct pg_type.typname from pg_type inner join pg_enum on pg_enum.enumtypid = pg_type.oid'
            );
            expect(bindings).toBeUndefined();
            return ['enum_status'];
        });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllTypes()).toEqual(['enum_status']);
    });
});
