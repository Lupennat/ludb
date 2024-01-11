import { DB, currentGenericDB } from './fixtures/config';

describe('Wheres', () => {
    const Schema = DB.connection(currentGenericDB).getSchemaBuilder();
    beforeAll(async () => {
        await Schema.create('test_wheres_users', table => {
            table.increments('id');
            table.string('name');
            table.string('email');
            table.string('address');
        });

        await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .insert([
                { name: 'test-name', email: 'test-email', address: 'test-address' },
                { name: 'test-name1', email: 'test-email1', address: 'test-address1' },
                { name: 'test-name2', email: 'test-email2', address: 'test-address2' },
                { name: 'test-name3', email: 'test-email3', address: 'test-address3' }
            ]);
    });

    afterAll(async () => {
        await Schema.drop('test_wheres_users');
        await DB.connection(currentGenericDB).disconnect();
    });

    it('Works Where And Where Or Behavior', async () => {
        expect(
            await DB.connection(currentGenericDB).table('test_wheres_users').where('name', '=', 'test-name').first()
        ).toEqual({
            id: 1,
            name: 'test-name',
            email: 'test-email',
            address: 'test-address'
        });
        expect(
            await DB.connection(currentGenericDB).table('test_wheres_users').where('name', 'test-name').first()
        ).toEqual({
            id: 1,
            name: 'test-name',
            email: 'test-email',
            address: 'test-address'
        });
        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where('name', 'test-name')
                .where('email', 'test-email')
                .first()
        ).toEqual({ id: 1, name: 'test-name', email: 'test-email', address: 'test-address' });

        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where('name', 'test-name')
                .where('email', 'test-email1')
                .first()
        ).toBeNull();
        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where('name', 'wrong-name')
                .orWhere('email', 'test-email1')
                .first()
        ).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where({ name: 'test-name', email: 'test-email' })
                .first()
        ).toEqual({ id: 1, name: 'test-name', email: 'test-email', address: 'test-address' });
        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where({ name: 'test-name', email: 'test-email1' })
                .first()
        ).toBeNull();

        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .orWhere({ name: 'wrong-name', email: 'test-email1' })
                .first()
        ).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });

        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where({ name: 'test-name', email: 'test-email1' })
                .orWhere({ name: 'test-name1', address: 'wrong-address' })
                .count()
        ).toBe(1);

        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where({ name: 'test-name', email: 'test-email1' })
                .orWhere({ name: 'test-name1', address: 'wrong-address' })
                .first()
        ).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
    });

    it('Works Where Not', async () => {
        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .whereNot(query => {
                    query.where('name', '=', 'test-name');
                })
                .first()
        ).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });

        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where('name', 'test-name')
                .whereNot(query => {
                    query.where('email', 'test-email1');
                })
                .first()
        ).toEqual({ id: 1, name: 'test-name', email: 'test-email', address: 'test-address' });

        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where('name', 'wrong-name')
                .orWhereNot(query => {
                    query.where('email', 'test-email');
                })
                .first()
        ).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
    });

    it('Works Where In', async () => {
        expect(await DB.connection(currentGenericDB).table('test_wheres_users').whereIn('id', [2]).first()).toEqual({
            id: 2,
            name: 'test-name1',
            email: 'test-email1',
            address: 'test-address1'
        });

        let users = await DB.connection(currentGenericDB).table('test_wheres_users').whereIn('id', [2, 3, 22]).get();

        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(2).toBe(users.length);

        users = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .whereIn('email', ['test-email1', 'test-email2'])
            .get();

        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(2).toBe(users.length);

        users = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .whereIn('id', [2])
            .orWhereIn('email', ['test-email1', 'test-email2'])
            .get();

        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });

        expect(2).toBe(users.length);
    });

    it('Works Where In Can Accept Queryable', async () => {
        let query = DB.connection(currentGenericDB).table('test_wheres_users').select('name').where('id', '>', 2);

        let users = await DB.connection(currentGenericDB).table('test_wheres_users').whereIn('name', query).get();

        expect(users[0]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(users[1]).toEqual({ id: 4, name: 'test-name3', email: 'test-email3', address: 'test-address3' });

        expect(2).toBe(users.length);

        users = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .whereIn('name', query => {
                query.from('test_wheres_users').select('name').where('id', '>', 2);
            })
            .get();

        expect(users[0]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(users[1]).toEqual({ id: 4, name: 'test-name3', email: 'test-email3', address: 'test-address3' });

        expect(2).toBe(users.length);

        query = DB.connection(currentGenericDB).table('test_wheres_users').select('name').where('id', '=', 1);

        users = await DB.connection(currentGenericDB).table('test_wheres_users').whereNotIn('name', query).get();

        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(users[2]).toEqual({ id: 4, name: 'test-name3', email: 'test-email3', address: 'test-address3' });

        expect(3).toBe(users.length);
    });

    it('Works Where Integer In Raw', async () => {
        let users = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .whereIntegerInRaw('id', [2, 3, 5])
            .get();
        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(2).toBe(users.length);

        users = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .whereIntegerNotInRaw('id', [1, 3])
            .get();
        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 4, name: 'test-name3', email: 'test-email3', address: 'test-address3' });
        expect(2).toBe(users.length);

        users = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .whereIntegerInRaw('id', ['2', '3'])
            .get();
        expect(users[0]).toEqual({ id: 2, name: 'test-name1', email: 'test-email1', address: 'test-address1' });
        expect(users[1]).toEqual({ id: 3, name: 'test-name2', email: 'test-email2', address: 'test-address2' });
        expect(2).toBe(users.length);
    });

    it('Works Sole', async () => {
        expect(
            await DB.connection(currentGenericDB).table('test_wheres_users').where('name', 'test-name').sole()
        ).toEqual({
            id: 1,
            name: 'test-name',
            email: 'test-email',
            address: 'test-address'
        });
    });

    it('Works Sole Fails For Multiple Records', async () => {
        await expect(
            DB.connection(currentGenericDB).table('test_wheres_users').whereIn('id', [1, 2]).sole()
        ).rejects.toThrow('2 records were found.');
    });

    it('Works Sole Fails If No Records', async () => {
        await expect(
            DB.connection(currentGenericDB).table('test_wheres_users').where('name', 'wrong-name').sole()
        ).rejects.toThrow('no records were found.');
    });

    it('Works Sole Value', async () => {
        expect(
            await DB.connection(currentGenericDB)
                .table('test_wheres_users')
                .where('name', 'test-name')
                .soleValue<string>('name')
        ).toBe('test-name');
    });

    it('Works Chunck Map', async () => {
        const results = await DB.connection(currentGenericDB)
            .table('test_wheres_users')
            .orderBy('id')
            .chunkMap<string, { name: string }>(user => {
                return user.name;
            }, 1);

        expect(4).toBe(results.length);
        expect('test-name').toBe(results[0]);
        expect('test-name1').toBe(results[1]);
        expect('test-name2').toBe(results[2]);
        expect('test-name3').toBe(results[3]);
    });
});
