import { DB } from './fixtures/config';

describe('Prova', () => {
    afterAll(async () => {
        await DB.disconnect();
    });

    it('Works Connection', async () => {
        await DB.connection().select('select 1');
    });
});
