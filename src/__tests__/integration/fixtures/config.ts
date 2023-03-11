import DatabaseManager from '../../../database-manager';
import { DatabaseConfig } from '../../../types';

export const currentDB: string = process.env.DB as string;

const config: DatabaseConfig = {
    default: currentDB,
    connections: {
        mysql: {
            driver: 'mysql',
            host: 'localhost',
            port: 5308,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            database: 'tempdb'
        },
        maria: {
            driver: 'mysql',
            host: 'localhost',
            port: 31011,
            username: 'lupdo',
            password: 'lupdo@s3cRet',
            database: 'tempdb'
        },
        sqlite: {
            driver: 'sqlite',
            database: __dirname + '/../../../../.sqlite3.db',
            foreign_key_constraints: true
        },
        postgres: {
            driver: 'pgsql',
            username: 'lupdo',
            password: 'lupdos3cRet',
            host: 'localhost',
            database: 'tempdb',
            port: 25435
        },
        sqlsrv: {
            port: 21435,
            driver: 'sqlsrv',
            database: 'tempdb',
            username: 'sa',
            password: 'lupdo@s3cRet',
            host: 'localhost',
            trust_server_certificate: true
        }
    }
};

export const DB = new DatabaseManager(config);
