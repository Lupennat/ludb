import MysqlConnection from '../../../connections/mysql-connection';
import PostgresConnection from '../../../connections/postgres-connection';
import SqliteConnection from '../../../connections/sqlite-connection';
import SqlserverConnection from '../../../connections/sqlserver-connection';
import { mysqlConfig, postgresConfig, sqliteConfig, sqlserverConfig } from '../fixtures/config';
import { MockedFactory, pdo, schemaPdo } from '../fixtures/mocked';

describe('Connection Factory', () => {
    afterAll(async () => {
        await pdo.disconnect();
        await schemaPdo.disconnect();
    });

    it('Works Error Is Thrown On Unsupported Driver', () => {
        expect(() => {
            // @ts-expect-error not existing driver
            new MockedFactory().make({ driver: 'foo' }, 'foo');
        }).toThrow('Unsupported driver [foo]');
    });

    it('Works Error Is Thrown On Unsupported Connection', () => {
        expect(() => {
            new MockedFactory().createConnection(
                'baz',
                'baz',
                pdo,
                schemaPdo,
                // @ts-expect-error not existing driver
                { driver: 'baz', name: 'baz', database: '', prefix: '' },
                '',
                ''
            );
        }).toThrow('Unsupported driver [baz]');
    });

    it('Works Merge Read And Write Config', () => {
        const factory = new MockedFactory();

        jest.spyOn(factory, 'createPdoSchemaResolver').mockImplementation(() => {
            return pdo;
        });

        const spiedPdoResolved = jest
            .spyOn(factory, 'createPdoResolver')
            .mockImplementationOnce(config => {
                expect(config.database).toBe('database');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databasewrite');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databaseread');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databasewrite');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databaseread');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databasewrite');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databaseread');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(config.database).toBe('databasewrite');
                return pdo;
            })
            .mockImplementationOnce(config => {
                expect(['databaseread1', 'databaseread2', 'databaseread3'].includes(config.database!)).toBeTruthy();
                return pdo;
            });

        factory.make(
            {
                driver: 'sqlite',
                database: 'database'
            },
            'mysql'
        );

        factory.make(
            {
                driver: 'sqlite',
                database: 'databasewrite',
                read: {
                    database: 'databaseread'
                }
            },
            'mysql'
        );

        factory.make(
            {
                driver: 'sqlite',
                database: 'databaseread',
                write: {
                    database: 'databasewrite'
                }
            },
            'mysql'
        );

        factory.make(
            {
                driver: 'sqlite',
                database: ':memory:',
                read: {
                    database: 'databaseread'
                },
                write: {
                    database: 'databasewrite'
                }
            },
            'mysql'
        );

        factory.make(
            {
                driver: 'sqlite',
                database: 'databasewrite',
                read: [
                    {
                        database: 'databaseread1'
                    },
                    {
                        database: 'databaseread2'
                    },
                    {
                        database: 'databaseread3'
                    }
                ]
            },
            'sqlite'
        );

        expect(spiedPdoResolved).toHaveBeenCalledTimes(9);
    });

    it('Works Mysql Driver', () => {
        expect(new MockedFactory().make(mysqlConfig, 'mysql')).toBeInstanceOf(MysqlConnection);
    });

    it('Works Sqlite Driver', () => {
        expect(new MockedFactory().make(sqliteConfig, 'sqlite')).toBeInstanceOf(SqliteConnection);
    });

    it('Works Postgres Driver', () => {
        expect(new MockedFactory().make(postgresConfig, 'postgres')).toBeInstanceOf(PostgresConnection);
    });

    it('Works Sqlserver Driver', () => {
        expect(new MockedFactory().make(sqlserverConfig, 'sqlServer')).toBeInstanceOf(SqlserverConnection);
    });
});
