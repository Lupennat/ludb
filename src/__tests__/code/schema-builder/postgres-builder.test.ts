import Raw from '../../../query/expression';
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

    it('Works Create View', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(grammar, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create view schema.prefix_foo as select "id", "name" from "baz" where "type" in (\'bar\', \'bax\')'
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create temporary recursive view schema.prefix_foo ("id", "name") with(security_barrier=true) as select "id", "name" from "baz" where "type" in (\'bar\', \'bax\') with local check option'
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create temporary recursive view schema.prefix_foo ("id", "name") with(security_invoker=true) as select "id", "name" from "baz" where "type" in (\'bar\', \'bax\') with cascade check option'
                );
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new PostgresBuilder(session);
        expect(
            await builder.createView(new Raw('schema.prefix_foo'), view =>
                view.as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView(new Raw('schema.prefix_foo'), view =>
                view
                    .columnNames(['id', 'name'])
                    .temporary()
                    .withRecursive()
                    .withSecurityBarrier()
                    .withCheckLocal()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView(new Raw('schema.prefix_foo'), view =>
                view
                    .columnNames(['id', 'name'])
                    .temporary()
                    .withRecursive()
                    .withSecurityInvoker()
                    .withCheckCascade()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
    });

    it('Works Has Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const builder = new PostgresBuilder(session);

        jest.spyOn(builder, 'getTables').mockImplementation(async () => {
            return [
                {
                    name: 'prefix_table',
                    schema: 'public',
                    comment: ''
                },
                {
                    name: 'prefix_table',
                    schema: 'search_path',
                    comment: ''
                },
                {
                    name: 'prefix_table',
                    schema: 'schema',
                    comment: ''
                },
                {
                    name: 'prefix_table2',
                    schema: 'schema2',
                    comment: ''
                },
                {
                    name: 'prefix_table',
                    schema: 'claudio',
                    comment: ''
                }
            ];
        });

        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.hasTable('table')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.hasTable('table')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.hasTable('table')).toBeTruthy();
        expect(await builder.hasTable('schema2.table2')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.hasTable('table')).toBeTruthy();
        expect(await builder.hasTable('table2')).toBeFalsy();
    });

    it('Works Has View', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const builder = new PostgresBuilder(session);

        jest.spyOn(builder, 'getViews').mockImplementation(async () => {
            return [
                {
                    name: 'prefix_table',
                    schema: 'public',
                    comment: '',
                    definition: ''
                },
                {
                    name: 'prefix_table',
                    schema: 'search_path',
                    comment: '',
                    definition: ''
                },
                {
                    name: 'prefix_table',
                    schema: 'schema',
                    comment: '',
                    definition: ''
                },
                {
                    name: 'prefix_table2',
                    schema: 'schema2',
                    comment: '',
                    definition: ''
                },
                {
                    name: 'prefix_table',
                    schema: 'claudio',
                    comment: '',
                    definition: ''
                }
            ];
        });

        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.hasView('table')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.hasView('table')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.hasView('table')).toBeTruthy();
        expect(await builder.hasView('schema2.table2')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.hasView('table')).toBeTruthy();
        expect(await builder.hasView('table2')).toBeFalsy();
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

    it('Works Drop View If Exists', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(grammar, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view if exists "prefix_view"');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new PostgresBuilder(session);
        expect(await builder.dropViewIfExists('view')).toBeTruthy();
    });

    it('Works Get Columns', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select a.attname as name, t.typname as type_name, format_type(a.atttypid, a.atttypmod) as type, (select tc.collcollate from pg_catalog.pg_collation tc where tc.oid = a.attcollation) as collation, not a.attnotnull as nullable, (select pg_get_expr(adbin, adrelid) from pg_attrdef where c.oid = pg_attrdef.adrelid and pg_attrdef.adnum = a.attnum) as default, col_description(c.oid, a.attnum) as comment from pg_attribute a, pg_class c, pg_type t, pg_namespace n where c.relname = 'prefix_table' and n.nspname = 'public' and a.attnum > 0 and a.attrelid = c.oid and a.atttypid = t.oid and n.oid = c.relnamespace order by a.attnum"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'column',
                        type_name: 'varchar',
                        type: 'varchar(255)',
                        collation: 'collation',
                        nullable: 1,
                        default: null,
                        comment: 'comment'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select a.attname as name, t.typname as type_name, format_type(a.atttypid, a.atttypmod) as type, (select tc.collcollate from pg_catalog.pg_collation tc where tc.oid = a.attcollation) as collation, not a.attnotnull as nullable, (select pg_get_expr(adbin, adrelid) from pg_attrdef where c.oid = pg_attrdef.adrelid and pg_attrdef.adnum = a.attnum) as default, col_description(c.oid, a.attnum) as comment from pg_attribute a, pg_class c, pg_type t, pg_namespace n where c.relname = 'prefix_table' and n.nspname = 'search_path' and a.attnum > 0 and a.attrelid = c.oid and a.atttypid = t.oid and n.oid = c.relnamespace order by a.attnum"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'column',
                        type_name: 'varchar',
                        type: 'varchar(255)',
                        collation: 'collation',
                        nullable: 1,
                        default: null,
                        comment: 'comment'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select a.attname as name, t.typname as type_name, format_type(a.atttypid, a.atttypmod) as type, (select tc.collcollate from pg_catalog.pg_collation tc where tc.oid = a.attcollation) as collation, not a.attnotnull as nullable, (select pg_get_expr(adbin, adrelid) from pg_attrdef where c.oid = pg_attrdef.adrelid and pg_attrdef.adnum = a.attnum) as default, col_description(c.oid, a.attnum) as comment from pg_attribute a, pg_class c, pg_type t, pg_namespace n where c.relname = 'prefix_table' and n.nspname = 'schema' and a.attnum > 0 and a.attrelid = c.oid and a.atttypid = t.oid and n.oid = c.relnamespace order by a.attnum"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'serial',
                        type_name: 'int4',
                        type: 'integer',
                        collation: null,
                        nullable: 0,
                        default: "nextval('types_serial_seq'::regclass)",
                        comment: null
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select a.attname as name, t.typname as type_name, format_type(a.atttypid, a.atttypmod) as type, (select tc.collcollate from pg_catalog.pg_collation tc where tc.oid = a.attcollation) as collation, not a.attnotnull as nullable, (select pg_get_expr(adbin, adrelid) from pg_attrdef where c.oid = pg_attrdef.adrelid and pg_attrdef.adnum = a.attnum) as default, col_description(c.oid, a.attnum) as comment from pg_attribute a, pg_class c, pg_type t, pg_namespace n where c.relname = 'prefix_table2' and n.nspname = 'schema2' and a.attnum > 0 and a.attrelid = c.oid and a.atttypid = t.oid and n.oid = c.relnamespace order by a.attnum"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'column',
                        type_name: 'varchar',
                        type: 'varchar(255)',
                        collation: 'collation',
                        nullable: 1,
                        default: null,
                        comment: 'comment'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select a.attname as name, t.typname as type_name, format_type(a.atttypid, a.atttypmod) as type, (select tc.collcollate from pg_catalog.pg_collation tc where tc.oid = a.attcollation) as collation, not a.attnotnull as nullable, (select pg_get_expr(adbin, adrelid) from pg_attrdef where c.oid = pg_attrdef.adrelid and pg_attrdef.adnum = a.attnum) as default, col_description(c.oid, a.attnum) as comment from pg_attribute a, pg_class c, pg_type t, pg_namespace n where c.relname = 'prefix_table' and n.nspname = 'claudio' and a.attnum > 0 and a.attrelid = c.oid and a.atttypid = t.oid and n.oid = c.relnamespace order by a.attnum"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'column',
                        type_name: 'varchar',
                        type: 'varchar(255)',
                        collation: 'collation',
                        nullable: 1,
                        default: null,
                        comment: 'comment'
                    }
                ];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: false,
                name: 'column',
                type_name: 'varchar',
                type: 'varchar(255)',
                collation: 'collation',
                nullable: true,
                default: null,
                comment: 'comment'
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: false,
                name: 'column',
                type_name: 'varchar',
                type: 'varchar(255)',
                collation: 'collation',
                nullable: true,
                default: null,
                comment: 'comment'
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: true,
                name: 'serial',
                type_name: 'int4',
                type: 'integer',
                collation: '',
                nullable: false,
                default: "nextval('types_serial_seq'::regclass)",
                comment: ''
            }
        ]);
        expect(await builder.getColumns('schema2.table2')).toEqual([
            {
                auto_increment: false,
                name: 'column',
                type_name: 'varchar',
                type: 'varchar(255)',
                collation: 'collation',
                nullable: true,
                default: null,
                comment: 'comment'
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: false,
                name: 'column',
                type_name: 'varchar',
                type: 'varchar(255)',
                collation: 'collation',
                nullable: true,
                default: null,
                comment: 'comment'
            }
        ]);
    });

    it('Works Get Indexes', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select ic.relname as name, string_agg(a.attname, \',\' order by indseq.ord) as columns, am.amname as "type", i.indisunique as "unique", i.indisprimary as "primary" from pg_index i join pg_class tc on tc.oid = i.indrelid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class ic on ic.oid = i.indexrelid join pg_am am on am.oid = ic.relam join lateral unnest(i.indkey) with ordinality as indseq(num, ord) on true left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = indseq.num where tc.relname = \'prefix_table\' and tn.nspname = \'public\' group by ic.relname, am.amname, i.indisunique, i.indisprimary'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'index',
                        columns: 'column1,column2',
                        type: 'PRIMARY',
                        unique: 0,
                        primary: 1
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select ic.relname as name, string_agg(a.attname, \',\' order by indseq.ord) as columns, am.amname as "type", i.indisunique as "unique", i.indisprimary as "primary" from pg_index i join pg_class tc on tc.oid = i.indrelid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class ic on ic.oid = i.indexrelid join pg_am am on am.oid = ic.relam join lateral unnest(i.indkey) with ordinality as indseq(num, ord) on true left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = indseq.num where tc.relname = \'prefix_table\' and tn.nspname = \'search_path\' group by ic.relname, am.amname, i.indisunique, i.indisprimary'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'index',
                        columns: 'column1,column2',
                        type: 'PRIMARY',
                        unique: 0,
                        primary: 1
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select ic.relname as name, string_agg(a.attname, \',\' order by indseq.ord) as columns, am.amname as "type", i.indisunique as "unique", i.indisprimary as "primary" from pg_index i join pg_class tc on tc.oid = i.indrelid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class ic on ic.oid = i.indexrelid join pg_am am on am.oid = ic.relam join lateral unnest(i.indkey) with ordinality as indseq(num, ord) on true left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = indseq.num where tc.relname = \'prefix_table\' and tn.nspname = \'schema\' group by ic.relname, am.amname, i.indisunique, i.indisprimary'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'index',
                        columns: 'column1,column2',
                        type: 'PRIMARY',
                        unique: 0,
                        primary: 1
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select ic.relname as name, string_agg(a.attname, \',\' order by indseq.ord) as columns, am.amname as "type", i.indisunique as "unique", i.indisprimary as "primary" from pg_index i join pg_class tc on tc.oid = i.indrelid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class ic on ic.oid = i.indexrelid join pg_am am on am.oid = ic.relam join lateral unnest(i.indkey) with ordinality as indseq(num, ord) on true left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = indseq.num where tc.relname = \'prefix_table2\' and tn.nspname = \'schema2\' group by ic.relname, am.amname, i.indisunique, i.indisprimary'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'index',
                        columns: 'column1,column2',
                        type: 'PRIMARY',
                        unique: 0,
                        primary: 1
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select ic.relname as name, string_agg(a.attname, \',\' order by indseq.ord) as columns, am.amname as "type", i.indisunique as "unique", i.indisprimary as "primary" from pg_index i join pg_class tc on tc.oid = i.indrelid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class ic on ic.oid = i.indexrelid join pg_am am on am.oid = ic.relam join lateral unnest(i.indkey) with ordinality as indseq(num, ord) on true left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = indseq.num where tc.relname = \'prefix_table\' and tn.nspname = \'claudio\' group by ic.relname, am.amname, i.indisunique, i.indisprimary'
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'index',
                        columns: 'column1,column2',
                        type: 'PRIMARY',
                        unique: 0,
                        primary: 1
                    }
                ];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'index',
                primary: true,
                type: 'primary',
                unique: false
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'index',
                primary: true,
                type: 'primary',
                unique: false
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'index',
                primary: true,
                type: 'primary',
                unique: false
            }
        ]);
        expect(await builder.getIndexes('schema2.table2')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'index',
                primary: true,
                type: 'primary',
                unique: false
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                name: 'index',
                primary: true,
                type: 'primary',
                unique: false
            }
        ]);
    });

    it('Works Get Foreign Keys', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select c.conname as name, string_agg(la.attname, ',' order by conseq.ord) as columns, fn.nspname as foreign_schema, fc.relname as foreign_table, string_agg(fa.attname, ',' order by conseq.ord) as foreign_columns, c.confupdtype as on_update, c.confdeltype as on_delete from pg_constraint c join pg_class tc on c.conrelid = tc.oid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class fc on c.confrelid = fc.oid join pg_namespace fn on fn.oid = fc.relnamespace join lateral unnest(c.conkey) with ordinality as conseq(num, ord) on true join pg_attribute la on la.attrelid = c.conrelid and la.attnum = conseq.num join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = c.confkey[conseq.ord] where c.contype = 'f' and tc.relname = 'prefix_table' and tn.nspname = 'public' group by c.conname, fn.nspname, fc.relname, c.confupdtype, c.confdeltype"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'foreign',
                        columns: 'column1,column2',
                        foreign_schema: 'public',
                        foreign_table: 'prefix_table2',
                        foreign_columns: 'column3,column4',
                        on_update: 'a',
                        on_delete: 'c'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select c.conname as name, string_agg(la.attname, ',' order by conseq.ord) as columns, fn.nspname as foreign_schema, fc.relname as foreign_table, string_agg(fa.attname, ',' order by conseq.ord) as foreign_columns, c.confupdtype as on_update, c.confdeltype as on_delete from pg_constraint c join pg_class tc on c.conrelid = tc.oid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class fc on c.confrelid = fc.oid join pg_namespace fn on fn.oid = fc.relnamespace join lateral unnest(c.conkey) with ordinality as conseq(num, ord) on true join pg_attribute la on la.attrelid = c.conrelid and la.attnum = conseq.num join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = c.confkey[conseq.ord] where c.contype = 'f' and tc.relname = 'prefix_table' and tn.nspname = 'search_path' group by c.conname, fn.nspname, fc.relname, c.confupdtype, c.confdeltype"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'foreign',
                        columns: 'column1,column2',
                        foreign_schema: 'public',
                        foreign_table: 'prefix_table2',
                        foreign_columns: 'column3,column4',
                        on_update: 'a',
                        on_delete: 'c'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select c.conname as name, string_agg(la.attname, ',' order by conseq.ord) as columns, fn.nspname as foreign_schema, fc.relname as foreign_table, string_agg(fa.attname, ',' order by conseq.ord) as foreign_columns, c.confupdtype as on_update, c.confdeltype as on_delete from pg_constraint c join pg_class tc on c.conrelid = tc.oid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class fc on c.confrelid = fc.oid join pg_namespace fn on fn.oid = fc.relnamespace join lateral unnest(c.conkey) with ordinality as conseq(num, ord) on true join pg_attribute la on la.attrelid = c.conrelid and la.attnum = conseq.num join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = c.confkey[conseq.ord] where c.contype = 'f' and tc.relname = 'prefix_table' and tn.nspname = 'schema' group by c.conname, fn.nspname, fc.relname, c.confupdtype, c.confdeltype"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'foreign',
                        columns: 'column1,column2',
                        foreign_schema: 'public',
                        foreign_table: 'prefix_table2',
                        foreign_columns: 'column3,column4',
                        on_update: 'a',
                        on_delete: 'c'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select c.conname as name, string_agg(la.attname, ',' order by conseq.ord) as columns, fn.nspname as foreign_schema, fc.relname as foreign_table, string_agg(fa.attname, ',' order by conseq.ord) as foreign_columns, c.confupdtype as on_update, c.confdeltype as on_delete from pg_constraint c join pg_class tc on c.conrelid = tc.oid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class fc on c.confrelid = fc.oid join pg_namespace fn on fn.oid = fc.relnamespace join lateral unnest(c.conkey) with ordinality as conseq(num, ord) on true join pg_attribute la on la.attrelid = c.conrelid and la.attnum = conseq.num join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = c.confkey[conseq.ord] where c.contype = 'f' and tc.relname = 'prefix_table2' and tn.nspname = 'schema2' group by c.conname, fn.nspname, fc.relname, c.confupdtype, c.confdeltype"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'foreign',
                        columns: 'column1,column2',
                        foreign_schema: 'public',
                        foreign_table: 'prefix_table2',
                        foreign_columns: 'column3,column4',
                        on_update: 'a',
                        on_delete: 'c'
                    }
                ];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select c.conname as name, string_agg(la.attname, ',' order by conseq.ord) as columns, fn.nspname as foreign_schema, fc.relname as foreign_table, string_agg(fa.attname, ',' order by conseq.ord) as foreign_columns, c.confupdtype as on_update, c.confdeltype as on_delete from pg_constraint c join pg_class tc on c.conrelid = tc.oid join pg_namespace tn on tn.oid = tc.relnamespace join pg_class fc on c.confrelid = fc.oid join pg_namespace fn on fn.oid = fc.relnamespace join lateral unnest(c.conkey) with ordinality as conseq(num, ord) on true join pg_attribute la on la.attrelid = c.conrelid and la.attnum = conseq.num join pg_attribute fa on fa.attrelid = c.confrelid and fa.attnum = c.confkey[conseq.ord] where c.contype = 'f' and tc.relname = 'prefix_table' and tn.nspname = 'claudio' group by c.conname, fn.nspname, fc.relname, c.confupdtype, c.confdeltype"
                );
                expect(bindings).toBeUndefined();
                return [
                    {
                        name: 'foreign',
                        columns: 'column1,column2',
                        foreign_schema: 'public',
                        foreign_table: 'prefix_table2',
                        foreign_columns: 'column3,column4',
                        on_update: 'zz',
                        on_delete: 'zz'
                    }
                ];
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getForeignKeys('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'public',
                foreign_table: 'prefix_table2',
                name: 'foreign',
                on_delete: 'cascade',
                on_update: 'no action'
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('search_path');
        expect(await builder.getForeignKeys('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'public',
                foreign_table: 'prefix_table2',
                name: 'foreign',
                on_delete: 'cascade',
                on_update: 'no action'
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('').mockReturnValueOnce('schema');
        expect(await builder.getForeignKeys('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'public',
                foreign_table: 'prefix_table2',
                name: 'foreign',
                on_delete: 'cascade',
                on_update: 'no action'
            }
        ]);
        expect(await builder.getForeignKeys('schema2.table2')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'public',
                foreign_table: 'prefix_table2',
                name: 'foreign',
                on_delete: 'cascade',
                on_update: 'no action'
            }
        ]);
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('$user').mockReturnValueOnce('claudio');
        expect(await builder.getForeignKeys('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'public',
                foreign_table: 'prefix_table2',
                name: 'foreign',
                on_delete: '',
                on_update: ''
            }
        ]);
    });

    it('Works Drop Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');

        const stmtSpied = jest
            .spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop table "public"."users","public"."companies" cascade');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop table "public"."users","public"."spatial_ref_sys" cascade');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getTables')
            .mockResolvedValueOnce([
                { name: 'users', schema: 'public', size: 100, comment: '' },
                { name: 'companies', schema: 'public', size: 100, comment: '' },
                { name: 'spatial_ref_sys', schema: 'public', size: 100, comment: '' }
            ])
            .mockResolvedValueOnce([
                { name: 'users', schema: 'public', size: 100, comment: '' },
                { name: 'companies', schema: 'public', size: 100, comment: '' },
                { name: 'spatial_ref_sys', schema: 'public', size: 100, comment: '' }
            ])
            .mockResolvedValueOnce([]);

        await builder.dropTables();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce(['companies']);
        await builder.dropTables();
        await builder.dropTables();
        expect(getAllSpied).toHaveBeenCalledTimes(3);
        expect(stmtSpied).toHaveBeenCalledTimes(2);
    });

    it('Works Drop Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest
            .spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop view "public"."view_users","public"."view_companies" cascade');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'drop view "public"."view_users","public"."geography_columns","public"."geometry_columns" cascade'
                );
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getViews')
            .mockResolvedValueOnce([
                { name: 'view_users', schema: 'public', definition: 'definition' },
                { name: 'view_companies', schema: 'public', definition: 'definition' },
                { name: 'geography_columns', schema: 'public', definition: 'definition' },
                { name: 'geometry_columns', schema: 'public', definition: 'definition' }
            ])
            .mockResolvedValueOnce([
                { name: 'view_users', schema: 'public', definition: 'definition' },
                { name: 'view_companies', schema: 'public', definition: 'definition' },
                { name: 'geography_columns', schema: 'public', definition: 'definition' },
                { name: 'geometry_columns', schema: 'public', definition: 'definition' }
            ])
            .mockResolvedValueOnce([]);

        await builder.dropViews();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce(['view_companies']);
        await builder.dropViews();
        await builder.dropViews();
        expect(getAllSpied).toHaveBeenCalledTimes(3);
        expect(stmtSpied).toHaveBeenCalledTimes(2);
    });

    it('Works Drop Types', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest
            .spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop type "public"."enum_status" cascade');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop domain "public"."enum_domain" cascade');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getTypes')
            .mockResolvedValueOnce([
                {
                    category: 'boolean',
                    implicit: true,
                    name: 'enum_boole',
                    schema: 'public',
                    type: 'base'
                },
                {
                    category: 'boolean',
                    implicit: false,
                    name: 'enum_status',
                    schema: 'public',
                    type: 'base'
                },
                {
                    category: 'boolean',
                    implicit: false,
                    name: 'enum_domain',
                    schema: 'public',
                    type: 'domain'
                }
            ])
            .mockResolvedValueOnce([]);

        await builder.dropTypes();
        await builder.dropTypes();
        expect(getAllSpied).toHaveBeenCalledTimes(2);
        expect(stmtSpied).toHaveBeenCalledTimes(2);
    });

    it('Works Get Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select c.relname as name, n.nspname as schema, pg_total_relation_size(c.oid) as size, obj_description(c.oid, 'pg_class') as comment from pg_class c, pg_namespace n where c.relkind in ('r', 'p') and n.oid = c.relnamespace and n.nspname not in ('pg_catalog', 'information_schema')order by c.relname"
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'users', schema: 'public', size: 100, comment: '' }];
        });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getTables()).toEqual([{ name: 'users', schema: 'public', size: 100, comment: '' }]);
    });

    it('Works Get Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);

        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select viewname as name, schemaname as schema, definition from pg_views where schemaname not in ('pg_catalog', 'information_schema') order by viewname"
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'view_users', schema: 'public', definition: 'definition' }];
        });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getViews()).toEqual([{ name: 'view_users', schema: 'public', definition: 'definition' }]);
    });

    it('Works Get Types', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new PostgresSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select t.typname as name, n.nspname as schema, t.typtype as type, t.typcategory as category, ((t.typinput = 'array_in'::regproc and t.typoutput = 'array_out'::regproc) or t.typtype = 'm') as implicit from pg_type t join pg_namespace n on n.oid = t.typnamespace left join pg_class c on c.oid = t.typrelid left join pg_type el on el.oid = t.typelem left join pg_class ce on ce.oid = el.typrelid where ((t.typrelid = 0 and (ce.relkind = 'c' or ce.relkind is null)) or c.relkind = 'c') and not exists (select 1 from pg_depend d where d.objid in (t.oid, t.typelem) and d.deptype = 'e') and n.nspname not in ('pg_catalog', 'information_schema')"
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    name: 'enum_status',
                    schema: 'public',
                    implicit: 1,
                    type: 'b',
                    category: 'b'
                },
                {
                    name: 'external_type',
                    schema: 'public',
                    implicit: 1,
                    type: 'z',
                    category: 'k'
                }
            ];
        });

        const builder = new PostgresBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getTypes()).toEqual([
            {
                category: 'boolean',
                implicit: true,
                name: 'enum_status',
                schema: 'public',
                type: 'base'
            },
            {
                category: null,
                implicit: true,
                name: 'external_type',
                schema: 'public',
                type: null
            }
        ]);
    });
});
