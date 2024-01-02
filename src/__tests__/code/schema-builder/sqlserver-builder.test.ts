import SqlserverBuilder from '../../../schema/builders/sqlserver-builder';
import { pdo as fakePdo, getSqlserverConnection } from '../fixtures/mocked';

describe('Sqlserver Schema QueryBuilder Test', () => {
    afterAll(async () => {
        await fakePdo.disconnect();
    });

    it('Works Enable Foreign Key Constraints', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'EXEC sp_msforeachtable @command1="print \'?\'", @command2="ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";'
            );
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.enableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.disableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Has Type', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const builder = new SqlserverBuilder(session);

        jest.spyOn(builder, 'getTypes')
            .mockImplementationOnce(async () => [])
            .mockImplementation(async () => {
                return [
                    {
                        name: 'type',
                        schema: 'dbo',
                        type: 'varchar(11)'
                    }
                ];
            });

        expect(await builder.hasType('type')).toBeFalsy();
        expect(await builder.hasType('type')).toBeTruthy();
    });

    it('Works Create Table', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('create database [database]');
            expect(bindings).toBeUndefined();
            return true;
        });
        const builder = new SqlserverBuilder(session);
        expect(await builder.createDatabase('database')).toBeTruthy();
    });

    it('Works Create Type', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create type SSN from VARCHAR(11) NULL');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create type SSN from VARCHAR(11) NOT NULL');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create type SSN from VARCHAR(11)');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create type Utf8String external name utf8string.[Microsoft.Samples.SqlServer.utf8string]'
                );
                expect(bindings).toBeUndefined();
                return true;
            });
        const builder = new SqlserverBuilder(session);
        expect(
            await builder.createType('SSN', 'simple', {
                from: 'VARCHAR(11)',
                nullable: true
            })
        ).toBeTruthy();
        expect(
            await builder.createType('SSN', 'simple', {
                from: 'VARCHAR(11)',
                nullable: false
            })
        ).toBeTruthy();

        expect(
            await builder.createType('SSN', 'simple', {
                from: 'VARCHAR(11)'
            })
        ).toBeTruthy();
        expect(
            await builder.createType('Utf8String', 'external', 'utf8string.[Microsoft.Samples.SqlServer.utf8string]')
        ).toBeTruthy();
    });

    it('Works Create View', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create view [schema].[prefix_foo] as select [id], [name] from [schema2].[prefix_baz] where [type] in ('bar', 'bax')"
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create view [schema].[prefix_foo] ([id], [name]) with encryption as select [id], [name] from [schema2].[prefix_baz] where [type] in ('bar', 'bax') with check option"
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create view [schema].[prefix_foo] ([id], [name]) with schemabinding as select [id], [name] from [schema2].[prefix_baz] where [type] in ('bar', 'bax') with check option"
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create view [schema].[prefix_foo] ([id], [name]) with view_metadata as select [id], [name] from [schema2].[prefix_baz] where [type] in ('bar', 'bax') with check option"
                );
                expect(bindings).toBeUndefined();
                return true;
            });
        const builder = new SqlserverBuilder(session);
        expect(
            await builder.createView('schema.foo', view =>
                view.as(query => {
                    return query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('schema2.baz');
                })
            )
        ).toBeTruthy();
        expect(
            await builder.createView('schema.foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .withEncryption()
                    .check()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('schema2.baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView('schema.foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .withSchemabinding()
                    .check()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('schema2.baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView('schema.foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .withViewMetadata()
                    .check()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('schema2.baz'))
            )
        ).toBeTruthy();
    });

    it('Works Drop Database If Exists', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop database if exists [database]');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.dropDatabaseIfExists('database')).toBeTruthy();
    });

    it('Works Drop View', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view [prefix_view]');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.dropView('view')).toBeTruthy();
    });

    it('Works Drop View If Exists', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view if exists [prefix_view]');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.dropViewIfExists('view')).toBeTruthy();
    });

    it('Works Drop Type', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop type [prefix_type]');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.dropType('type')).toBeTruthy();
    });

    it('Works Drop View If Exists', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop type if exists [prefix_type]');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.dropTypeIfExists('type')).toBeTruthy();
    });

    it('Works Get Columns', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select col.name, type.name as type_name, col.max_length as length, col.precision as precision, col.scale as places, col.is_nullable as nullable, def.definition as [default], col.is_identity as autoincrement, col.collation_name as collation, cast(prop.value as nvarchar(max)) as comment from sys.columns as col join sys.types as type on col.user_type_id = type.user_type_id join sys.objects as obj on col.object_id = obj.object_id join sys.schemas as scm on obj.schema_id = scm.schema_id left join sys.default_constraints def on col.default_object_id = def.object_id and col.object_id = def.parent_object_id left join sys.extended_properties as prop on obj.object_id = prop.major_id and col.column_id = prop.minor_id and prop.name = 'MS_Description' where obj.type in ('U', 'V') and obj.name = N'prefix_table' and scm.name = SCHEMA_NAME() order by col.column_id"
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    name: 'column',
                    type_name: 'numeric',
                    length: 10,
                    precision: 5,
                    places: 4,
                    nullable: 1,
                    default: null,
                    autoincrement: 1,
                    collation: 'collation',
                    comment: 'comment'
                },
                {
                    name: 'column2',
                    type_name: 'binary',
                    length: -1,
                    precision: 1,
                    places: 2,
                    nullable: 1,
                    default: null,
                    autoincrement: 1,
                    collation: 'collation',
                    comment: 'comment'
                },
                {
                    name: 'column3',
                    type_name: 'char',
                    length: 30,
                    precision: 1,
                    places: 2,
                    nullable: 1,
                    default: null,
                    autoincrement: 1,
                    collation: 'collation',
                    comment: 'comment'
                },
                {
                    name: 'column4',
                    type_name: 'time',
                    length: 30,
                    precision: 3,
                    places: 2,
                    nullable: 1,
                    default: null,
                    autoincrement: 1,
                    collation: 'collation',
                    comment: 'comment'
                }
            ];
        });
        const builder = new SqlserverBuilder(session);
        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: true,
                collation: 'collation',
                comment: 'comment',
                default: null,
                name: 'column',
                nullable: true,
                type: 'numeric(5,4)',
                type_name: 'numeric'
            },
            {
                auto_increment: true,
                collation: 'collation',
                comment: 'comment',
                default: null,
                name: 'column2',
                nullable: true,
                type: 'binary(max)',
                type_name: 'binary'
            },
            {
                auto_increment: true,
                collation: 'collation',
                comment: 'comment',
                default: null,
                name: 'column3',
                nullable: true,
                type: 'char(30)',
                type_name: 'char'
            },
            {
                auto_increment: true,
                collation: 'collation',
                comment: 'comment',
                default: null,
                name: 'column4',
                nullable: true,
                type: 'time(3)',
                type_name: 'time'
            }
        ]);
    });

    it('Works Drop Tables', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
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
        const builder = new SqlserverBuilder(session);
        await builder.dropTables();
    });

    it('Works Drop Views', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql.replace(/\s\s+/g, ' ')).toBe(
                "DECLARE @sql NVARCHAR(MAX) = N''; SELECT @sql += 'DROP VIEW ' + QUOTENAME(OBJECT_SCHEMA_NAME(object_id)) + '.' + QUOTENAME(name) + ';' FROM sys.views; EXEC sp_executesql @sql;"
            );
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new SqlserverBuilder(session);
        await builder.dropViews();
    });

    it('Works Drop Types', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');

        const spiedTransaction = jest.spyOn(fakePdo, 'beginTransaction');

        jest.spyOn(session, 'getSchemaPdo').mockReturnValue(fakePdo);
        const stmtSpied = jest
            .spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop type [dbo].[prefix_custom_string]');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('drop type [dbo].[prefix_custom_boolean]');
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new SqlserverBuilder(session);
        const getAllSpied = jest
            .spyOn(builder, 'getTypes')
            .mockResolvedValueOnce([
                {
                    name: 'custom_string',
                    schema: 'dbo',
                    type: 'varchar(11)'
                },
                {
                    name: 'custom_boolean',
                    schema: 'dbo',
                    type: 'boolean'
                }
            ])
            .mockResolvedValueOnce([]);

        await builder.dropTypes();
        await builder.dropTypes();
        expect(getAllSpied).toHaveBeenCalledTimes(2);
        expect(spiedTransaction).toHaveBeenCalledTimes(1);
        expect(stmtSpied).toHaveBeenCalledTimes(2);
    });

    it('Works Get Indexes', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select idx.name as name, string_agg(col.name, ',') within group (order by idxcol.key_ordinal) as columns, idx.type_desc as [type], idx.is_unique as [unique], idx.is_primary_key as [primary] from sys.indexes as idx join sys.tables as tbl on idx.object_id = tbl.object_id join sys.schemas as scm on tbl.schema_id = scm.schema_id join sys.index_columns as idxcol on idx.object_id = idxcol.object_id and idx.index_id = idxcol.index_id join sys.columns as col on idxcol.object_id = col.object_id and idxcol.column_id = col.column_id where tbl.name = N'prefix_table' and scm.name = SCHEMA_NAME() group by idx.name, idx.type_desc, idx.is_unique, idx.is_primary_key"
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

        const builder = new SqlserverBuilder(session);
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
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select fk.name as name, string_agg(lc.name, ',') within group (order by fkc.constraint_column_id) as columns, fs.name as foreign_schema, ft.name as foreign_table, string_agg(fc.name, ',') within group (order by fkc.constraint_column_id) as foreign_columns, fk.update_referential_action_desc as on_update, fk.delete_referential_action_desc as on_delete from sys.foreign_keys as fk join sys.foreign_key_columns as fkc on fkc.constraint_object_id = fk.object_id join sys.tables as lt on lt.object_id = fk.parent_object_id join sys.schemas as ls on lt.schema_id = ls.schema_id join sys.columns as lc on fkc.parent_object_id = lc.object_id and fkc.parent_column_id = lc.column_id join sys.tables as ft on ft.object_id = fk.referenced_object_id join sys.schemas as fs on ft.schema_id = fs.schema_id join sys.columns as fc on fkc.referenced_object_id = fc.object_id and fkc.referenced_column_id = fc.column_id where lt.name = N'prefix_table' and ls.name = SCHEMA_NAME() group by fk.name, fs.name, ft.name, fk.update_referential_action_desc, fk.delete_referential_action_desc"
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    name: 'foreign',
                    columns: 'column1,column2',
                    foreign_schema: 'database',
                    foreign_table: 'prefix_table2',
                    foreign_columns: 'column3,column4',
                    on_update: 'NO_ACTION',
                    on_delete: 'NO_ACTION'
                }
            ];
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.getForeignKeys('table')).toEqual([
            {
                columns: ['column1', 'column2'],
                foreign_columns: ['column3', 'column4'],
                foreign_schema: 'database',
                foreign_table: 'prefix_table2',
                name: 'foreign',
                on_delete: 'no action',
                on_update: 'no action'
            }
        ]);
    });

    it('Works Get Tables', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'select t.name as name, SCHEMA_NAME(t.schema_id) as [schema], sum(u.total_pages) * 8 * 1024 as size from sys.tables as t join sys.partitions as p on p.object_id = t.object_id join sys.allocation_units as u on u.container_id = p.hobt_id group by t.name, t.schema_id order by t.name'
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'users', schema: 'schema', size: 100 }];
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.getTables()).toEqual([{ name: 'users', schema: 'schema', size: 100 }]);
    });

    it('Works Get Views', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'select').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'select name, SCHEMA_NAME(v.schema_id) as [schema], definition from sys.views as v inner join sys.sql_modules as m on v.object_id = m.object_id order by name'
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'view_users', schema: 'schema', definition: 'definition' }];
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.getViews()).toEqual([{ name: 'view_users', schema: 'schema', definition: 'definition' }]);
    });

    it('Works Get Types', async () => {
        const connection = getSqlserverConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                'select name, SCHEMA_NAME(schema_id) as [schema_name], TYPE_NAME(system_type_id) as [type_name], max_length as [length], precision, scale from sys.types where is_user_defined = 1'
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    name: 'type1',
                    type_name: 'numeric',
                    length: 10,
                    precision: 5,
                    places: 4,
                    schema: 'dbo'
                },
                {
                    name: 'type2',
                    type_name: 'binary',
                    length: -1,
                    precision: 1,
                    places: 2,
                    schema: 'dbo'
                },
                {
                    name: 'type3',
                    type_name: 'char',
                    length: 30,
                    precision: 1,
                    places: 2,
                    schema: 'dbo'
                },
                {
                    name: 'type4',
                    type_name: 'time',
                    length: 30,
                    precision: 3,
                    places: 2,
                    schema: 'dbo'
                }
            ];
        });

        const builder = new SqlserverBuilder(session);
        expect(await builder.getTypes()).toEqual([
            {
                name: 'type1',
                type: 'numeric(5,4)',
                schema: 'dbo'
            },
            {
                name: 'type2',
                type: 'binary(max)',
                schema: 'dbo'
            },
            {
                name: 'type3',
                type: 'char(30)',
                schema: 'dbo'
            },
            {
                name: 'type4',
                type: 'time(3)',
                schema: 'dbo'
            }
        ]);
    });
});
