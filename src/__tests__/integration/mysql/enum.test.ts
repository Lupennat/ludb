import { DB, currentGenericDB, currentMysqlDB, isMysql } from '../fixtures/config';

const maybe = isMysql() ? describe : describe.skip;

maybe('Mysql Enum', () => {
    const currentDB = currentGenericDB as currentMysqlDB;
    const Schema = DB.connection(currentDB).getSchemaBuilder();

    const isOld = (): boolean => {
        return currentDB === 'mysql57' || currentDB === 'maria1003';
    };

    beforeAll(async () => {
        await Schema.create('test_enum_users', table => {
            table.integer('id');
            table.string('name');
            table.string('age');
            table.enum('color', ['red', 'blue']);
        });
    });

    afterAll(async () => {
        await Schema.drop('test_enum_users');
        await DB.connection(currentDB).disconnect();
    });

    it('Works Rename Column On Table With Enum', async () => {
        if (isOld()) {
            await Schema.table('test_enum_users', table => {
                table.enum('name', ['red', 'blue']).renameTo('username').change();
            });
        } else {
            await Schema.table('test_enum_users', table => {
                table.renameColumn('name', 'username');
            });
        }

        expect(await Schema.hasColumn('test_enum_users', 'username')).toBeTruthy();
    });

    it('Works Change Column On Table With Enum', async () => {
        await Schema.table('test_enum_users', table => {
            table.unsignedInteger('age').charset('').change();
        });

        expect(await Schema.getColumnType('test_enum_users', 'age')).toBe('int');
    });
});
