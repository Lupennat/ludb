import MySqlBuilder from '../../../schema/builders/mysql-builder';
import MySqlSchemaGrammar from '../../../schema/grammars/mysql-grammar';
import { getConnection } from '../fixtures/mocked';

describe('Mysql Schema Builder Test', () => {
    it('Works Enable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('SET FOREIGN_KEY_CHECKS=1;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MySqlBuilder(session);
        expect(await builder.enableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Disable Foreign Key Constraints', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('SET FOREIGN_KEY_CHECKS=0;');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MySqlBuilder(session);
        expect(await builder.disableForeignKeyConstraints()).toBeTruthy();
    });

    it('Works Create Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create database `db`');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe('create database `db` default character set `latin1`');
                expect(bindings).toBeUndefined();
                return true;
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'create database `db` default character set `latin1` default collate `latin1_swedish_ci`'
                );
                expect(bindings).toBeUndefined();
                return true;
            });
        const builder = new MySqlBuilder(session);
        expect(await builder.createDatabase('db')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('latin1');
        expect(await builder.createDatabase('db')).toBeTruthy();
        jest.spyOn(session, 'getConfig').mockReturnValueOnce('latin1').mockReturnValueOnce('latin1_swedish_ci');
        expect(await builder.createDatabase('db')).toBeTruthy();
    });

    it('Works Drop Database If Exists', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop database if exists `db`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MySqlBuilder(session);
        expect(await builder.dropDatabaseIfExists('db')).toBeTruthy();
    });

    it('Works Has Table', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db', 'prefix_table']);
                return ['prefix_table'];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    "select * from information_schema.tables where table_schema = ? and table_name = ? and table_type = 'BASE TABLE'"
                );
                expect(bindings).toEqual(['db2', 'prefix_table2']);
                return ['prefix_table2'];
            });
        const builder = new MySqlBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.hasTable('table')).toBeTruthy();
        expect(await builder.hasTable('db2.table2')).toBeTruthy();
    });

    it('Works Get Column Listing', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectFromWriteConnection')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name as `column_name` from information_schema.columns where table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db', 'prefix_table']);
                return [{ column_name: 'column' }];
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name as `column_name` from information_schema.columns where table_schema = ? and table_name = ?'
                );
                expect(bindings).toEqual(['db2', 'prefix_table2']);
                return [{ column_name: 'column' }];
            });
        const builder = new MySqlBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getColumnListing('table')).toEqual(['column']);
        expect(await builder.getColumnListing('db2.table2')).toBeTruthy();
    });

    it('Works Get Column Type', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectOne')
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name as `column_name`, data_type as `data_type` from information_schema.columns where table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db', 'prefix_table', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async (sql, bindings) => {
                expect(sql).toBe(
                    'select column_name as `column_name`, data_type as `data_type` from information_schema.columns where table_schema = ? and table_name = ? and column_name = ?'
                );
                expect(bindings).toEqual(['db2', 'prefix_table2', 'column']);
                return { column_name: 'column', data_type: 'int' };
            })
            .mockImplementationOnce(async () => {
                return null;
            });
        const builder = new MySqlBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValue('db');
        expect(await builder.getColumnType('table', 'column')).toEqual('int');
        expect(await builder.getColumnType('db2.table2', 'column')).toEqual('int');
        await expect(builder.getColumnType('table', 'column')).rejects.toThrowError(
            'column "column" not found on table "prefix_table" with database "db".'
        );
    });

    it('Works Drop All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        const called: string[] = [];
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(called).toEqual(['disabled']);
            expect(sql).toBe('drop table `users`,`companies`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MySqlBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        const getAllSpied = jest
            .spyOn(builder, 'getAllTables')
            .mockResolvedValueOnce(['users', 'companies'])
            .mockResolvedValueOnce([]);
        const disableForSpied = jest.spyOn(builder, 'disableForeignKeyConstraints').mockImplementationOnce(async () => {
            called.push('disabled');
            return true;
        });
        const enabledForSpied = jest.spyOn(builder, 'enableForeignKeyConstraints').mockImplementationOnce(async () => {
            called.push('enabled');
            return true;
        });

        await builder.dropAllTables();
        await builder.dropAllTables();
        expect(getAllSpied).toBeCalledTimes(2);
        expect(stmtSpied).toBeCalledTimes(1);
        expect(disableForSpied).toBeCalledTimes(1);
        expect(enabledForSpied).toBeCalledTimes(1);
        expect(called[0]).toBe('disabled');
        expect(called[1]).toBe('enabled');
    });

    it('Works Drop All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        const stmtSpied = jest.spyOn(session, 'statement').mockImplementationOnce(async (sql, bindings) => {
            expect(sql).toBe('drop view `view_users`,`view_companies`');
            expect(bindings).toBeUndefined();
            return true;
        });

        const builder = new MySqlBuilder(session);
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

    it('Works Get All Tables', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectColumn').mockImplementationOnce(async (column, sql, bindings) => {
            expect(column).toBe(0);
            expect(sql).toBe("SHOW FULL TABLES WHERE table_type = 'BASE TABLE'");
            expect(bindings).toBeUndefined();
            return ['users'];
        });

        const builder = new MySqlBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllTables()).toEqual(['users']);
    });

    it('Works Get All Views', async () => {
        const connection = getConnection();
        const session = connection.sessionSchema();
        const grammar = new MySqlSchemaGrammar();
        jest.spyOn(session, 'getSchemaGrammar').mockReturnValue(grammar);
        jest.spyOn(session, 'getTablePrefix').mockReturnValue('prefix_');
        jest.spyOn(session, 'selectColumn').mockImplementationOnce(async (column, sql, bindings) => {
            expect(column).toBe(0);
            expect(sql).toBe("SHOW FULL TABLES WHERE table_type = 'VIEW'");
            expect(bindings).toBeUndefined();
            return ['view_users'];
        });

        const builder = new MySqlBuilder(session);
        jest.spyOn(builder.getConnection(), 'getDatabaseName').mockReturnValueOnce('db');
        expect(await builder.getAllViews()).toEqual(['view_users']);
    });
});
