import MysqlGrammar from '../../../query/grammars/mysql-grammar';
import MysqlBuilder from '../../../schema/builders/mysql-builder';
import { getMysqlConnection } from '../fixtures/mocked';

describe('Mysql Schema QueryBuilder Test', () => {
    it('Works Enable Foreign Key Constraints', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('SET FOREIGN_KEY_CHECKS=1;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);
        expect(await builder.enableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('SET FOREIGN_KEY_CHECKS=0;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);
        expect(await builder.disableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Create View', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'getQueryGrammar').mockReturnValue(new MysqlGrammar());
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create view `prefix_foo` as select `id`, `name` from `baz` where `type` in ('bar', 'bax')"
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create algorithm=merge definer='user'@'table' sql security definer view `prefix_foo` (`id`, `name`) as select `id`, `name` from `baz` where `type` in ('bar', 'bax') with local check option"
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create algorithm=merge definer='user'@'table' sql security definer view `prefix_foo` (`id`, `name`) as select `id`, `name` from `baz` where `type` in ('bar', 'bax') with cascaded check option"
                );
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "create algorithm=merge definer='user'@'table' sql security definer view `prefix_foo` (`id`, `name`) as select `id`, `name` from `baz` where `type` in ('bar', 'bax') with check option"
                );
                expect(bindings).toBeUndefined();
                return true;
            });

        const builder = new MysqlBuilder(session);
        expect(
            await builder.createView('foo', view =>
                view.as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();

        expect(
            await builder.createView('foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .algorithm('merge')
                    .definer('user@table')
                    .withCheckLocal()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView('foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .algorithm('merge')
                    .definer('user@table')
                    .withCheckCascaded()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
        expect(
            await builder.createView('foo', view =>
                view
                    .columnNames(['id', 'name'])
                    .algorithm('merge')
                    .definer('user@table')
                    .check()
                    .as(query => query.select('id', 'name').whereIn('type', ['bar', 'bax']).from('baz'))
            )
        ).toBeTruthy();
    });

    it('Works Create Table', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create database `database`');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create database `database` default character set `latin1`');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create database `database` default character set `latin1` default collate `latin1_swedish_ci`'
                );
                expect(bindings).toBeUndefined();
                return true;
            });
        const builder = new MysqlBuilder(session);
        expect(await builder.createDatabase('database')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('latin1');
        expect(await builder.createDatabase('database')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('latin1').mockReturnValueOnce('latin1_swedish_ci');
        expect(await builder.createDatabase('database')).toBeTruthy();
    });

    it('Works Drop Database If Exists', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop database if exists `database`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);
        expect(await builder.dropDatabaseIfExists('database')).toBeTruthy();
    });

    it('Works Drop View', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view `prefix_view`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);
        expect(await builder.dropView('view')).toBeTruthy();
    });

    it('Works Drop View If Exists', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view if exists `prefix_view`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);
        expect(await builder.dropViewIfExists('view')).toBeTruthy();
    });

    it('Works Get Columns', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select column_name as `name`, data_type as `type_name`, column_type as `type`, collation_name as `collation`, is_nullable as `nullable`, column_default as `default`, column_comment as `comment`, extra as `extra` from information_schema.columns where table_schema = 'database' and table_name = 'prefix_table'"
                );
                expect(bindings).toBeUndefined();
                return [{ name: 'column' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select column_name as `name`, data_type as `type_name`, column_type as `type`, collation_name as `collation`, is_nullable as `nullable`, column_default as `default`, column_comment as `comment`, extra as `extra` from information_schema.columns where table_schema = 'database' and table_name = 'prefix_db2.table2'"
                );
                expect(bindings).toBeUndefined();
                return [{ name: 'column' }];
            });
        const builder = new MysqlBuilder(session);

        expect(await builder.getColumns('table')).toEqual([
            {
                auto_increment: false,
                name: 'column',
                nullable: false
            }
        ]);
        expect(await builder.getColumns('db2.table2')).toEqual([
            {
                auto_increment: false,
                name: 'column',
                nullable: false
            }
        ]);
    });

    it('Works Get Indexes', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select index_name as `name`, group_concat(column_name order by seq_in_index) as `columns`, index_type as `type`, not non_unique as `unique` from information_schema.statistics where table_schema = 'database' and table_name = 'prefix_table' group by index_name, index_type, non_unique"
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    name: 'PRIMARY',
                    columns: 'id',
                    unique: 1,
                    type: 'PRIMARY'
                },
                {
                    name: 'IDX_COLUMN',
                    columns: 'column1,column2',
                    unique: 0,
                    type: 'INDEX'
                }
            ];
        });

        const builder = new MysqlBuilder(session);

        expect(await builder.getIndexes('table')).toEqual([
            {
                columns: ['id'],
                name: 'primary',
                primary: true,
                type: 'primary',
                unique: true
            },
            {
                columns: ['column1', 'column2'],
                name: 'idx_column',
                primary: false,
                type: 'index',
                unique: false
            }
        ]);
    });

    it('Works Get Foreign Keys', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select kc.constraint_name as `name`, group_concat(kc.column_name order by kc.ordinal_position) as `columns`, kc.referenced_table_schema as `foreign_schema`, kc.referenced_table_name as `foreign_table`, group_concat(kc.referenced_column_name order by kc.ordinal_position) as `foreign_columns`, rc.update_rule as `on_update`, rc.delete_rule as `on_delete` from information_schema.key_column_usage kc join information_schema.referential_constraints rc on kc.constraint_schema = rc.constraint_schema and kc.constraint_name = rc.constraint_name where kc.table_schema = 'database' and kc.table_name = 'prefix_table' and kc.referenced_table_name is not null group by kc.constraint_name, kc.referenced_table_schema, kc.referenced_table_name, rc.update_rule, rc.delete_rule"
            );
            expect(bindings).toBeUndefined();
            return [
                {
                    name: 'foreign',
                    columns: 'column1,column2',
                    foreign_schema: 'database',
                    foreign_table: 'prefix_table2',
                    foreign_columns: 'column3,column4',
                    on_update: 'NO ACTION',
                    on_delete: 'NO ACTION'
                }
            ];
        });

        const builder = new MysqlBuilder(session);

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

    it('Works Drop Tables', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        const called: string[] = [];
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(called).toEqual(['disabled']);
            expect(sql).toBe('drop table `prefix_users`,`prefix_companies`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);

        const getAllSpied = jest
            .spyOn(builder, 'getTables')
            .mockResolvedValueOnce([
                { name: 'prefix_users', comment: 'comment', engine: 'innodb', size: 100, collation: 'collation' },
                { name: 'prefix_companies', comment: 'comment', engine: 'innodb', size: 100, collation: 'collation' }
            ])
            .mockResolvedValueOnce([]);
        const disableForSpied = jest.spyOn(builder, 'disableForeignKeyConstraints').mockImplementationOnce(async () => {
            called.push('disabled');
            return true;
        });
        const enabledForSpied = jest.spyOn(builder, 'enableForeignKeyConstraints').mockImplementationOnce(async () => {
            called.push('enabled');
            return true;
        });

        await builder.dropTables();
        await builder.dropTables();
        expect(getAllSpied).toHaveBeenCalledTimes(2);
        expect(stmtSpied).toHaveBeenCalledTimes(1);
        expect(disableForSpied).toHaveBeenCalledTimes(1);
        expect(enabledForSpied).toHaveBeenCalledTimes(1);
        expect(called[0]).toBe('disabled');
        expect(called[1]).toBe('enabled');
    });

    it('Works Drop Views', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view `prefix_view_users`,`prefix_view_companies`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MysqlBuilder(session);

        const getAllSpied = jest
            .spyOn(builder, 'getViews')
            .mockResolvedValueOnce([
                { name: 'prefix_view_users', definition: 'definition' },
                { name: 'prefix_view_companies', definition: 'definition' }
            ])
            .mockResolvedValueOnce([]);

        await builder.dropViews();
        await builder.dropViews();
        expect(getAllSpied).toHaveBeenCalledTimes(2);
        expect(stmtSpied).toHaveBeenCalledTimes(1);
    });

    it('Works Get Tables', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select table_name as `name`, (data_length + index_length) as `size`, table_comment as `comment`, engine as `engine`, table_collation as `collation` from information_schema.tables where table_schema = 'database' and table_type = 'BASE TABLE' order by table_name"
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'users', comment: 'comment', engine: 'innodb', size: 100, collation: 'collation' }];
        });

        const builder = new MysqlBuilder(session);

        expect(await builder.getTables()).toEqual([
            { name: 'users', comment: 'comment', engine: 'innodb', size: 100, collation: 'collation' }
        ]);
    });

    it('Works Get Views', async () => {
        const connection = getMysqlConnection();
        const session = connection.sessionSchema();
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe(
                "select table_name as `name`, view_definition as `definition` from information_schema.views where table_schema = 'database' order by table_name"
            );
            expect(bindings).toBeUndefined();
            return [{ name: 'view_users', definition: 'definition' }];
        });

        const builder = new MysqlBuilder(session);

        expect(await builder.getViews()).toEqual([{ name: 'view_users', definition: 'definition' }]);
    });
});
