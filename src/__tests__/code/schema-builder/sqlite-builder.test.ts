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

    it('Works Create View', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(grammar, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create view "prefix_foo" as select "id", "name" from "baz" where "type" in (\'bar\', \'bax\')'
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create temporary view "prefix_foo" ("id", "name") as select "id", "name" from "baz" where "type" in (\'bar\', \'bax\')'
                );
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new MockedSQLiteSchemaBuilder(session);
        expect(
            await builder.createView('foo', view =>
                view.as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView('foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .temporary()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
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

    it('Works Drop View If Exists', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(grammar, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view if exists "prefix_view"');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        expect(await builder.dropViewIfExists('view')).toBeTruthy();
    });

    it('Works Get Columns', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'select name, type, not "notnull" as "nullable", dflt_value as "default", pk as "primary" from pragma_table_info("prefix_table") order by cid asc'
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'column', type: 'int', nullable: 0, default: null, primary: 1 }];
        });
        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: false,
                default: null,
                name: 'column',
                nullable: false,
                type: 'int',
                type_name: 'int'
            }
        ]);
    });

    it('Works Get Indexes', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select "primary" as name, group_concat(col) as columns, 1 as "unique", 1 as "primary" from (select name as col from pragma_table_info("prefix_table") where pk > 0 order by pk, cid) group by name union select name, group_concat(col) as columns, "unique", origin = "pk" as "primary" from (select il.*, ii.name as col from pragma_index_list(prefix_table) il, pragma_index_info(il.name) ii order by il.seq, ii.seqno) group by name, "unique", "primary"'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'COLUMN_IDX',
                        columns: 'column1,column2',
                        unique: true,
                        primary: false
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select "primary" as name, group_concat(col) as columns, 1 as "unique", 1 as "primary" from (select name as col from pragma_table_info("prefix_table") where pk > 0 order by pk, cid) group by name union select name, group_concat(col) as columns, "unique", origin = "pk" as "primary" from (select il.*, ii.name as col from pragma_index_list(prefix_table) il, pragma_index_info(il.name) ii order by il.seq, ii.seqno) group by name, "unique", "primary"'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'COLUMN_IDX',
                        columns: 'column1,column2',
                        unique: true,
                        primary: true
                    },
                    {
                        name: 'PRIMARY',
                        columns: 'column1,column2',
                        unique: true,
                        primary: true
                    }
                ];
            });
        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'column_idx',
                primary: false,
                unique: true
            }
        ]);
        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'column_idx',
                primary: true,
                unique: true
            }
        ]);
    });

    it('Works Get Foreign Keys', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'select group_concat("from") as columns, "table" as foreign_table, group_concat("to") as foreign_columns, on_update, on_delete from (select * from pragma_foreign_key_list("prefix_table") as fkl inner join pragmar_index_list("prefix_table") as il on il.seq = fkl.id order by id desc, seq) group by id, "table", on_update, on_delete'
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    columns: 'column1,column2',
                    foreign_schema: 'db',
                    foreign_table: 'prefix_table2',
                    foreign_columns: 'column3,column4',
                    on_update: 'NO ACTION',
                    on_delete: 'NO ACTION'
                }
            ];
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getForeignKeys('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'db',
                foreign_table: 'prefix_table2',
                name: '',
                on_delete: 'no action',
                on_update: 'no action'
            }
        ]);
    });

    it('Works Drop Tables', async () => {
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

        await builder.dropTables();
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue(':memory:');
        await builder.dropTables();
    });

    it('Works Drop Views', async () => {
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
        await builder.dropViews();
    });

    it('Works Get Tables With Size', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select exists (select 1 from pragma_compile_options where compile_options = 'ENABLE_DBSTAT_VTAB') as enabled"
                );
                expect(bindings).toBeUndefined();
                return [{ enabled: true }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select m.tbl_name as name, sum(s.pgsize) as size from sqlite_master as m join dbstat as s on s.name = m.name where m.type in ('table', 'index') and m.tbl_name not like 'sqlite_%' group by m.tbl_name order by m.tbl_name"
                );
                expect(bindings).toBeUndefined();
                return [{ name: 'prefix_users', size: 100 }];
            });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getTables()).toEqual([{ name: 'prefix_users', size: 100 }]);
    });

    it('Works Get Tables Without Size', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select exists (select 1 from pragma_compile_options where compile_options = 'ENABLE_DBSTAT_VTAB') as enabled"
                );
                expect(bindings).toBeUndefined();
                return [];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name"
                );
                expect(bindings).toBeUndefined();
                return [{ name: 'prefix_users' }];
            });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getTables()).toEqual([{ name: 'prefix_users' }]);
    });

    it('Works Get Tables Without Size Error', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select exists (select 1 from pragma_compile_options where compile_options = 'ENABLE_DBSTAT_VTAB') as enabled"
                );
                expect(bindings).toBeUndefined();
                throw new Error('not enabled');
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name"
                );
                expect(bindings).toBeUndefined();
                return [{ name: 'prefix_users' }];
            });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getTables()).toEqual([{ name: 'prefix_users' }]);
    });

    it('Works Get Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new SQLiteSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe("select name, sql as definition from sqlite_master where type = 'view' order by name");
            expect(bindings).toBeUndefined();
            return [{ name: 'view_users', definition: 'definition' }];
        });

        const builder = new MockedSQLiteSchemaBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getViews()).toEqual([
            {
                definition: 'definition',
                name: 'view_users'
            }
        ]);
    });
});
